// 진행 저장소(components/progress/ProgressStore)에서 쓰는 문항 id. 서버 화면과 클라이언트 컴포넌트가 같은 규칙을 쓴다.
export const checkKey = (lessonId: string, key: string) => `check:${lessonId}/${key}`;
export const descKey = (lessonId: string, key: string) => `desc:${lessonId}/${key}`;
export const predictKey = (lessonId: string, key: string) => `predict:${lessonId}/${key}`;
