// 진행 저장소(components/progress/ProgressStore)에서 쓰는 문항 id. 서버 화면과 클라이언트 컴포넌트가 같은 규칙을 쓴다.
export const checkKey = (checkId: string) => `check:${checkId}`;
export const descKey = (quizId: string) => `desc:${quizId}`;
export const drillKey = (itemId: string) => `drill:${itemId}`;
