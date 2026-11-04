import type { AssignmentSpec, AssignmentTaskSpec } from "@/content/types";

// 과제 작업 공간(노트북)의 데이터 모델. 브라우저(작업 공간 화면)와 서버(초안 저장·제출
// 검증)가 같은 규칙을 쓰도록 이 파일은 React·Node 의존성 없이 순수 함수만 둔다.

export type NotebookOutput =
  | { type: "stream"; name: "stdout" | "stderr"; text: string }
  | { type: "result"; text: string }
  | { type: "error"; text: string }
  /** base64로 인코딩한 PNG (matplotlib 그림) */
  | { type: "image"; data: string };

export interface NotebookCell {
  id: string;
  kind: "code" | "text";
  source: string;
  /** 학습자가 직접 추가한 셀이면 true (명세에 없는 셀, 삭제 가능) */
  custom?: boolean;
  outputs?: NotebookOutput[];
  /** 마지막으로 실행한 시각 (코드 셀) */
  executedAt?: string;
  /** 마지막 실행이 오류 없이 끝났는지 */
  runOk?: boolean;
  /** 마지막 실행 이후 코드가 바뀌었는지 */
  stale?: boolean;
}

export interface NotebookTaskState {
  cells: NotebookCell[];
}

export interface AssignmentDraft {
  tasks: Record<string, NotebookTaskState>;
  updatedAt?: string;
}

export const NOTEBOOK_LIMITS = {
  cellsPerTask: 30,
  sourceChars: 30_000,
  outputTextChars: 20_000,
  outputsPerCell: 40,
  imagesPerCell: 6,
  /** base64 문자열 길이 기준 (약 450KB PNG) */
  imageChars: 600_000,
  /** 초안 전체 JSON 크기 */
  draftBytes: 6 * 1024 * 1024,
} as const;

const CELL_ID = /^[A-Za-z0-9_-]{1,64}$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** 명세에서 새 초안을 만든다. 코드 셀은 시작 코드, 답안 셀은 틀(template)로 채운다. */
export function initialDraft(spec: AssignmentSpec): AssignmentDraft {
  const tasks: Record<string, NotebookTaskState> = {};
  for (const task of spec.tasks) tasks[task.id] = { cells: initialTaskCells(task) };
  return { tasks };
}

function initialTaskCells(task: AssignmentTaskSpec): NotebookCell[] {
  return task.cells.map((c) =>
    c.kind === "code" ? { id: c.id, kind: "code", source: c.starter } : { id: c.id, kind: "text", source: c.template ?? "" }
  );
}

/**
 * 저장된 초안을 현재 명세에 맞춘다. 명세에 새로 생긴 셀은 채워 넣고, 명세 셀의 순서를
 * 지키면서 학습자가 추가한 셀은 원래 있던 자리(바로 앞 셀 뒤)에 남긴다.
 */
export function mergeDraft(spec: AssignmentSpec, draft: AssignmentDraft | undefined): AssignmentDraft {
  const base = initialDraft(spec);
  if (!draft) return base;
  const tasks: Record<string, NotebookTaskState> = {};
  for (const task of spec.tasks) {
    const saved = draft.tasks[task.id]?.cells ?? [];
    const savedById = new Map(saved.map((c) => [c.id, c]));
    const specIds = new Set(task.cells.map((c) => c.id));
    const merged: NotebookCell[] = [];
    // 학습자 셀을 "바로 앞 명세 셀" 기준으로 묶는다.
    const customAfter = new Map<string, NotebookCell[]>();
    let anchor = "__start__";
    for (const cell of saved) {
      if (specIds.has(cell.id)) anchor = cell.id;
      else if (cell.custom) customAfter.set(anchor, [...(customAfter.get(anchor) ?? []), cell]);
    }
    merged.push(...(customAfter.get("__start__") ?? []));
    for (const specCell of base.tasks[task.id].cells) {
      const savedCell = savedById.get(specCell.id);
      merged.push(savedCell && savedCell.kind === specCell.kind ? { ...savedCell, custom: undefined } : specCell);
      merged.push(...(customAfter.get(specCell.id) ?? []));
    }
    tasks[task.id] = { cells: merged };
  }
  return { tasks, updatedAt: draft.updatedAt };
}

function clampText(text: unknown, max: number): string {
  return typeof text === "string" ? text.slice(0, max) : "";
}

function sanitizeOutputs(raw: unknown): NotebookOutput[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: NotebookOutput[] = [];
  let images = 0;
  let textBudget = NOTEBOOK_LIMITS.outputTextChars;
  for (const o of raw.slice(0, NOTEBOOK_LIMITS.outputsPerCell)) {
    if (!o || typeof o !== "object") continue;
    const item = o as Record<string, unknown>;
    if (item.type === "image") {
      const data = typeof item.data === "string" ? item.data : "";
      if (images >= NOTEBOOK_LIMITS.imagesPerCell || data.length > NOTEBOOK_LIMITS.imageChars || !BASE64.test(data)) continue;
      images++;
      out.push({ type: "image", data });
      continue;
    }
    if (textBudget <= 0) continue;
    const text = clampText(item.text, textBudget);
    textBudget -= text.length;
    if (item.type === "stream") out.push({ type: "stream", name: item.name === "stderr" ? "stderr" : "stdout", text });
    else if (item.type === "result") out.push({ type: "result", text });
    else if (item.type === "error") out.push({ type: "error", text });
  }
  return out;
}

/**
 * 클라이언트가 보낸 초안을 검증·정리한다. 명세에 없는 과제·셀 id, 너무 큰 입력,
 * PNG가 아닌 이미지 데이터는 버린다. 결과가 크기 제한을 넘으면 null.
 */
export function sanitizeDraft(spec: AssignmentSpec, raw: unknown): AssignmentDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const rawTasks = (raw as { tasks?: unknown }).tasks;
  if (!rawTasks || typeof rawTasks !== "object") return null;
  const tasks: Record<string, NotebookTaskState> = {};
  for (const task of spec.tasks) {
    const rawCells = (rawTasks as Record<string, { cells?: unknown }>)[task.id]?.cells;
    if (!Array.isArray(rawCells)) continue;
    const specKinds = new Map(task.cells.map((c) => [c.id, c.kind]));
    const seen = new Set<string>();
    const cells: NotebookCell[] = [];
    for (const rc of rawCells.slice(0, NOTEBOOK_LIMITS.cellsPerTask)) {
      if (!rc || typeof rc !== "object") continue;
      const c = rc as Record<string, unknown>;
      const id = typeof c.id === "string" ? c.id : "";
      if (!CELL_ID.test(id) || seen.has(id)) continue;
      const kind = c.kind === "text" ? "text" : c.kind === "code" ? "code" : null;
      if (!kind) continue;
      const specKind = specKinds.get(id);
      if (specKind && specKind !== kind) continue;
      const custom = !specKind;
      seen.add(id);
      const cell: NotebookCell = { id, kind, source: clampText(c.source, NOTEBOOK_LIMITS.sourceChars) };
      if (custom) cell.custom = true;
      if (kind === "code") {
        const outputs = sanitizeOutputs(c.outputs);
        if (outputs && outputs.length) cell.outputs = outputs;
        if (typeof c.executedAt === "string" && !Number.isNaN(Date.parse(c.executedAt))) cell.executedAt = c.executedAt;
        if (typeof c.runOk === "boolean") cell.runOk = c.runOk;
        if (c.stale === true) cell.stale = true;
      }
      cells.push(cell);
    }
    tasks[task.id] = { cells };
  }
  const draft: AssignmentDraft = { tasks, updatedAt: new Date().toISOString() };
  if (JSON.stringify(draft).length > NOTEBOOK_LIMITS.draftBytes) return null;
  return draft;
}

// ─── 자동 저장 변경분 ────────────────────────────────────────────────────
// 작업 공간은 입력이 멈출 때마다 저장한다. 매번 초안 전체(그림 포함 수십~수백 KB)를 보내지 않고,
// 서버에 저장된 것으로 확인된 초안과 비교해 바뀐 과제의 셀 순서와 바뀐 셀만 보낸다.

/** 자동 저장 변경분. 바뀐 과제마다 셀 순서(order)와 바뀐 셀(cells)만 담는다. */
export interface DraftPatch {
  /** 이 변경분의 기준 초안이 서버에 저장된 시각(updatedAt). 서버 초안이 그 사이 바뀌었으면 전체 저장으로 돌아간다. */
  base: string;
  tasks: Record<string, { order: string[]; cells: NotebookCell[] }>;
}

/**
 * prev(서버에 저장된 것으로 확인된 초안)와 next를 비교한다. 화면은 셀을 고칠 때 그 셀(과 과제) 객체만 새로 만들므로
 * 참조가 같으면 바뀌지 않은 것이다. 과제가 없어지는 등 비교할 수 없으면 null(전체 저장).
 */
export function diffDraft(prev: AssignmentDraft, next: AssignmentDraft): DraftPatch["tasks"] | null {
  for (const id of Object.keys(prev.tasks)) if (!next.tasks[id]) return null;
  const out: DraftPatch["tasks"] = {};
  for (const [taskId, task] of Object.entries(next.tasks)) {
    const before = prev.tasks[taskId];
    if (before === task) continue;
    const beforeCells = new Map((before?.cells ?? []).map((c) => [c.id, c]));
    out[taskId] = { order: task.cells.map((c) => c.id), cells: task.cells.filter((c) => beforeCells.get(c.id) !== c) };
  }
  return out;
}

/**
 * 저장된 초안에 변경분을 합친다(서버). 순서에 있는 셀을 변경분에서도 저장본에서도 찾지 못하면 null(전체 저장 필요).
 * 합친 결과는 전체 저장과 똑같이 sanitizeDraft로 다시 검증한다.
 */
export function applyDraftPatch(stored: AssignmentDraft, rawTasks: unknown): AssignmentDraft | null {
  if (!rawTasks || typeof rawTasks !== "object") return null;
  const tasks: Record<string, NotebookTaskState> = { ...stored.tasks };
  for (const [taskId, raw] of Object.entries(rawTasks as Record<string, unknown>)) {
    // 저장본에 있는 과제만 받는다(처음 저장은 전체 저장이라 모든 과제가 들어 있다). "__proto__" 같은 키도 여기서 걸러진다.
    if (!Object.hasOwn(stored.tasks, taskId) || !raw || typeof raw !== "object") return null;
    const { order, cells } = raw as { order?: unknown; cells?: unknown };
    if (!Array.isArray(order) || !Array.isArray(cells) || order.length > NOTEBOOK_LIMITS.cellsPerTask) return null;
    const changed = new Map<string, NotebookCell>();
    for (const c of cells) {
      if (c && typeof c === "object" && typeof (c as { id?: unknown }).id === "string") changed.set((c as NotebookCell).id, c as NotebookCell);
    }
    const storedCells = new Map((stored.tasks[taskId]?.cells ?? []).map((c) => [c.id, c]));
    const merged: NotebookCell[] = [];
    for (const id of order) {
      const cell = typeof id === "string" ? (changed.get(id) ?? storedCells.get(id)) : undefined;
      if (!cell) return null;
      merged.push(cell);
    }
    tasks[taskId] = { cells: merged };
  }
  return { tasks, updatedAt: stored.updatedAt };
}

export interface TaskCheck {
  taskId: string;
  title: string;
  optional: boolean;
  /** 최소 글자 수를 채우지 못한 답안 셀의 안내 문구 */
  missingAnswers: string[];
  /** 한 번도 실행하지 않았거나 수정 후 다시 실행하지 않은 코드 셀 수 */
  unrunCode: number;
  /** 마지막 실행이 오류로 끝난 코드 셀 수 */
  failedCode: number;
  complete: boolean;
}

/** 과제별 작성 현황. 제출 버튼의 활성 조건과 작업 공간의 진행 표시에 함께 쓴다. */
export function checkTasks(spec: AssignmentSpec, draft: AssignmentDraft): TaskCheck[] {
  return spec.tasks.map((task) => {
    const cells = draft.tasks[task.id]?.cells ?? [];
    const byId = new Map(cells.map((c) => [c.id, c]));
    const missingAnswers: string[] = [];
    for (const specCell of task.cells) {
      if (specCell.kind !== "text") continue;
      const cell = byId.get(specCell.id);
      const written = (cell?.source ?? "").trim();
      const template = (specCell.template ?? "").trim();
      const min = specCell.minChars ?? 1;
      if (written === template || written.length < min) missingAnswers.push(specCell.prompt);
    }
    const codeCells = cells.filter((c) => c.kind === "code");
    const unrunCode = codeCells.filter((c) => !c.executedAt || c.stale).length;
    const failedCode = codeCells.filter((c) => c.executedAt && !c.stale && c.runOk === false).length;
    return {
      taskId: task.id,
      title: task.title,
      optional: task.tier !== "core",
      missingAnswers,
      unrunCode,
      failedCode,
      complete: missingAnswers.length === 0 && unrunCode === 0 && failedCode === 0,
    };
  });
}

/** 필수 과제의 답안 셀이 모두 채워졌는지 — 서버가 제출을 받아들이는 최소 조건 */
export function missingRequiredAnswers(spec: AssignmentSpec, draft: AssignmentDraft): { task: string; prompt: string }[] {
  return checkTasks(spec, draft)
    .filter((t) => !t.optional)
    .flatMap((t) => t.missingAnswers.map((prompt) => ({ task: t.title, prompt })));
}

export function newCellId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
