import type { AssignmentSource, Exercise, LessonSource, ModuleSource } from "./types";

// 콘텐츠 원본 작성 도구.
//
// md`...`, py`...`는 String.raw처럼 백슬래시를 그대로 둔다. 그래서 LaTeX는 `\frac{1}{2}`처럼 백슬래시 하나로,
// Python 코드의 "\n"도 그대로 쓴다. 템플릿 안에서 이스케이프해야 하는 것은 두 가지뿐이다.
//   - 백틱:  \`   (마크다운 인라인 코드 `x`는 \`x\` 로 쓴다)
//   - ${  :  \${
// 여는 백틱 바로 다음의 줄바꿈 하나는 없앤다(템플릿 첫 줄부터 내용을 쓰지 않아도 된다).

function raw(strings: TemplateStringsArray, values: unknown[]): string {
  return String.raw({ raw: strings.raw }, ...values)
    .replace(/\\`/g, "`")
    .replace(/\\\$\{/g, "${")
    .replace(/^\n/, "");
}

/** 마크다운 본문 */
export function md(strings: TemplateStringsArray, ...values: unknown[]): string {
  return raw(strings, values).replace(/\s+$/, "\n");
}

/** Python 코드(실습 시작 코드·채점 코드·모범 답안·예측 문제) */
export function py(strings: TemplateStringsArray, ...values: unknown[]): string {
  return raw(strings, values).replace(/\s+$/, "\n");
}

// 아래 함수는 값을 그대로 돌려준다. 원본 파일에서 타입 검사와 편집기 자동 완성을 받기 위한 표시다.
export const defineLesson = (lesson: LessonSource): LessonSource => lesson;
export const defineModule = (module: ModuleSource): ModuleSource => module;
export const defineExercises = (exercises: Exercise[]): Exercise[] => exercises;
export const defineAssignment = (assignment: AssignmentSource): AssignmentSource => assignment;
