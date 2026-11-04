// 학습 화면 주소 규칙. 서버·클라이언트 공용(의존성 없음). 주소를 만드는 곳은 모두 이 함수를 쓴다.

export const trackHref = (track: string) => `/tracks/${track}`;
export const moduleHref = (module: string) => `/modules/${module}`;
export const lessonHref = (module: string, lesson: string) => `/modules/${module}/lessons/${lesson}`;
export const recallHref = (module: string) => `/modules/${module}/recall`;
export const assignmentHref = (module: string) => `/modules/${module}/assignment`;
export const reviewHref = (module: string) => `/modules/${module}/review`;
export const diagnosticHref = (module: string) => `/modules/${module}/diagnostic`;
