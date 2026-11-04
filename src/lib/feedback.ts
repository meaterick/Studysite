import "server-only";
import { MODULES, moduleOfAssignment } from "@/content/course";
import { lessonLabel } from "@/content/tiers";
import { readLessonState, readRecallState, type LearningRecord } from "./learningStore";
import { listUserSubmissions } from "./submissionStore";
import { findConversation, unreadCount } from "./chatStore";
import { assignmentHref, reviewHref } from "./routes";

// 스터디원 한 명에게 온 피드백을 한곳에 모은다(피드백함·진도 화면·헤더 배지가 같이 쓴다).
// - 운영자 피드백: 채점 결과, 재제출 요청, 과제별 코멘트, 운영자 채팅
// - 복습할 것: 틀린 적 있는 확인 문제, 보완 필요로 표시한 서술형, 정답을 본 출력 예측, 보완 필요로 표시한 백지 복습 문항
// "새 피드백"은 피드백함을 마지막으로 연 시각(record.feedbackSeenAt) 이후의 채점과 읽지 않은 채팅이다.

export type FeedbackKind = "grade" | "revision" | "chat";

/** 채점 하나를 가리키는 키(과제 화면에서 확인한 채점을 기록할 때 쓴다) */
export function gradeKey(submissionId: string, gradedAt: string): string {
  return `${submissionId}:${gradedAt}`;
}

/** 아직 확인하지 않은 채점인지: 피드백함을 마지막으로 연 뒤에 나왔고, 과제 화면에서도 보지 않은 것 */
export function isGradeUnseen(record: LearningRecord, submissionId: string, gradedAt: string): boolean {
  if (gradedAt <= (record.feedbackSeenAt ?? "")) return false;
  return !(record.seenGrades ?? []).includes(gradeKey(submissionId, gradedAt));
}

/** 아직 확인하지 않은 채점 수(헤더의 피드백함 배지). 이 과정의 과제만 센다. */
export function unseenGradeCount(userId: string, record: LearningRecord): number {
  return listUserSubmissions(userId)
    .filter((s) => !!moduleOfAssignment(s.assignmentKey))
    .reduce((n, s) => n + s.grades.filter((g) => isGradeUnseen(record, s.id, g.gradedAt)).length, 0);
}

export interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  title: string;
  detail?: string;
  /** 과제별 코멘트 수(채점 결과) */
  comments?: number;
  href: string;
  at: string;
  isNew: boolean;
}

/** 모듈 하나의 복습 거리 */
export interface ModuleReview {
  moduleSlug: string;
  moduleCode: string;
  moduleTitle: string;
  /** 다시 볼 레슨들 */
  lessons: { lessonId: string; label: string; title: string; wrongChecks: number; recovered: number; weakAnswers: number; revealedPredicts: number }[];
  weakRecall: number;
  /** 아직 해결하지 않은 것의 수(정렬용) */
  open: number;
  href: string;
}

export interface MemberFeedback {
  items: FeedbackItem[];
  /** 새 채점·재제출 요청 수 + 읽지 않은 채팅 메시지 수 */
  newCount: number;
  chatUnread: number;
  review: ModuleReview[];
  gradesTotal: number;
  gradesSeen: number;
}

export function moduleReview(slug: string, record: LearningRecord): ModuleReview | undefined {
  const mod = MODULES.find((m) => m.slug === slug);
  if (!mod) return undefined;
  const lessons: ModuleReview["lessons"] = [];
  for (const lesson of mod.lessons) {
    const state = readLessonState(record, lesson.id);
    let wrongChecks = 0;
    let recovered = 0;
    for (const c of lesson.checks) {
      const s = state.checks[c.key];
      if (s && s.wrong.length > 0) {
        wrongChecks++;
        if (s.correct) recovered++;
      }
    }
    const weakAnswers = (lesson.descriptive ?? []).filter((d) => state.answers[d.key]?.review === "incorrect").length;
    const revealedPredicts = (lesson.predicts ?? []).filter((p) => state.predicts[p.key]?.revealed && !state.predicts[p.key]?.correct).length;
    if (wrongChecks + weakAnswers + revealedPredicts > 0) {
      lessons.push({ lessonId: lesson.id, label: lessonLabel(lesson), title: lesson.title, wrongChecks, recovered, weakAnswers, revealedPredicts });
    }
  }
  const weakRecall = Object.values(readRecallState(record, slug).marks).filter((m) => m === "weak").length;
  const open = lessons.reduce((n, l) => n + l.wrongChecks - l.recovered + l.weakAnswers + l.revealedPredicts, 0) + weakRecall;
  if (lessons.length === 0 && weakRecall === 0) return undefined;
  return { moduleSlug: slug, moduleCode: mod.code, moduleTitle: mod.title, lessons, weakRecall, open, href: reviewHref(slug) };
}

export function memberFeedback(userId: string, record: LearningRecord): MemberFeedback {
  const items: FeedbackItem[] = [];
  let gradesTotal = 0;
  let gradesSeen = 0;
  for (const sub of listUserSubmissions(userId)) {
    const mod = moduleOfAssignment(sub.assignmentKey);
    if (!mod?.assignment) continue;
    const title = `${mod.code} ${mod.assignment.title}`;
    for (const g of sub.grades) {
      gradesTotal++;
      const isNew = isGradeUnseen(record, sub.id, g.gradedAt);
      if (!isNew) gradesSeen++;
      const comments = Object.keys(g.taskComments ?? {}).length;
      items.push({
        id: `grade:${sub.id}:${g.gradedAt}`,
        kind: g.decision === "revision" ? "revision" : "grade",
        title: g.decision === "revision" ? `${title} · 재제출 요청 (제출본 v${g.version})` : `${title} · ${g.score ?? "-"}/${g.maxScore}점 (제출본 v${g.version})`,
        detail: g.feedback ? g.feedback.slice(0, 240) : undefined,
        comments: comments || undefined,
        href: assignmentHref(mod.slug),
        at: g.gradedAt,
        isNew,
      });
    }
  }

  const conv = findConversation(userId);
  const chatUnread = unreadCount(conv, "member");
  const lastAdmin = conv ? [...conv.messages].reverse().find((m) => m.role === "admin") : undefined;
  if (lastAdmin) {
    items.push({
      id: `chat:${lastAdmin.id}`,
      kind: "chat",
      title: chatUnread > 0 ? `운영자의 새 메시지 ${chatUnread}개` : "운영자 채팅",
      detail: lastAdmin.text.slice(0, 200),
      href: "/chat",
      at: lastAdmin.createdAt,
      isNew: chatUnread > 0,
    });
  }
  items.sort((a, b) => b.at.localeCompare(a.at));

  const review = MODULES.map((m) => moduleReview(m.slug, record))
    .filter((r): r is ModuleReview => !!r)
    .sort((a, b) => b.open - a.open);
  const newGrades = items.filter((i) => i.kind !== "chat" && i.isNew).length;
  return { items, newCount: newGrades + chatUnread, chatUnread, review, gradesTotal, gradesSeen };
}
