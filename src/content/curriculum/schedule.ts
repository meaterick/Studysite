// 기본 일정(16주). 콘텐츠 구조와 별개인 운영 단위다. 운영 설정의 기수 시작일을 정하면
// 진도 화면이 "이번 주 학습 범위"와 제출물을 이 표에서 보여 준다. 주당 학습 시간은 약 4~7시간을 기준으로 잡았다.

export interface ScheduleWeek {
  week: number;
  /** 이번 주에 학습할 모듈 slug */
  modules: string[];
  /** 이번 주에 제출할 것(과제 저장 키 또는 캡스톤 단계 설명) */
  due: string[];
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
  { week: 10, modules: ["generalization", "ml-algorithms"], due: ["ml-model-comparison", "캡스톤 주제 초안"] },
  { week: 11, modules: ["neural-networks", "deep-training"], due: ["autograd-mlp"] },
  { week: 12, modules: ["cnn-rnn"], due: ["cnn-ablation", "캡스톤 데이터와 기준 모델"] },
  { week: 13, modules: ["transformers"], due: ["mini-gpt-block"] },
  { week: 14, modules: ["llm-training"], due: ["llm-anatomy"] },
  { week: 15, modules: ["llm-systems"], due: ["rag-qa-bot", "캡스톤 평가와 위험 점검"] },
  { week: 16, modules: ["capstone-project"], due: ["capstone"] },
];
