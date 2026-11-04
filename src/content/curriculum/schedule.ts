// 기본 일정(16주). 콘텐츠 구조와 별개인 운영 단위다. 운영 설정의 기수 시작일을 정하면
// 진도 화면이 "이번 주 학습 범위"와 캡스톤 준비 단계를 이 표에서 보여 준다. 주당 학습 시간은 약 4~7시간을 기준으로 잡았다.

export interface ScheduleWeek {
  week: number;
  /** 이번 주에 학습할 모듈 slug */
  modules: string[];
  /** 이번 주에 제출할 과제의 저장 키 */
  due: string[];
  /** 이번 주까지 마칠 캡스톤 준비 단계. 단계별 할 일은 캡스톤 설계 레슨(capstone-design)의 일정 표에 있다. */
  milestone?: string;
}

export const SCHEDULE: ScheduleWeek[] = [
  { week: 1, modules: ["course-overview", "python-flow"], due: [] },
  { week: 2, modules: ["python-collections-functions"], due: [] },
  { week: 3, modules: ["python-files-errors", "python-objects-tools"], due: ["python-records-report"] },
  { week: 4, modules: ["math-functions", "linear-algebra"], due: [] },
  { week: 5, modules: ["calculus-optimization", "probability-basics"], due: [] },
  { week: 6, modules: ["descriptive-statistics", "inference-information"], due: ["math-gd-bayes"] },
  { week: 7, modules: ["numpy", "pandas"], due: [] },
  { week: 8, modules: ["data-preparation"], due: ["data-card-eda"] },
  { week: 9, modules: ["ml-framing", "linear-models"], due: [] },
  { week: 10, modules: ["generalization", "ml-algorithms"], due: ["ml-model-comparison"], milestone: "주제 초안" },
  { week: 11, modules: ["neural-networks", "deep-training"], due: ["autograd-mlp"] },
  { week: 12, modules: ["cnn-rnn"], due: ["cnn-ablation"], milestone: "데이터와 기준 모델" },
  { week: 13, modules: ["transformers"], due: ["mini-gpt-block"] },
  { week: 14, modules: ["llm-training"], due: ["llm-anatomy"] },
  { week: 15, modules: ["llm-systems"], due: ["rag-qa-bot"], milestone: "평가와 위험 점검" },
  { week: 16, modules: ["capstone-project"], due: ["capstone"] },
];
