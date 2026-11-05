import type { TrackId } from "../types";

// 80개 개념과 필수 선수관계. 레슨은 concepts 필드로 여기의 id를 가리킨다.
// - id는 안정 키다(목록 번호가 바뀌어도 그대로 둔다). 화면의 "#25"는 order다.
// - requires는 그 개념을 배우기 전에 반드시 알아야 하는 개념이다. 기본 경로(트랙·모듈·레슨 순서)에서
//   선수 개념이 항상 먼저 나와야 하며, 검증 스크립트(npm run validate:content)가 이를 확인한다.

export interface Concept {
  id: string;
  order: number;
  track: TrackId;
  title: string;
  requires: string[];
}

const C = (order: number, track: TrackId, id: string, title: string, requires: string[] = []): Concept => ({ id, order, track, title, requires });

export const CONCEPTS: Concept[] = [
  // 트랙 1 · 프로그래밍 기초
  C(1, "programming", "variables-types", "변수와 값, 자료형, 형 변환"),
  C(2, "programming", "basic-operations", "숫자·문자열·불리언과 기본 연산", ["variables-types"]),
  C(3, "programming", "conditionals", "비교 연산, 논리 연산, 조건문", ["basic-operations"]),
  C(4, "programming", "loops", "반복문과 반복 제어", ["conditionals"]),
  C(5, "programming", "collections", "리스트, 튜플, 딕셔너리, 집합", ["loops"]),
  C(6, "programming", "indexing-slicing", "인덱싱과 슬라이싱", ["collections"]),
  C(7, "programming", "mutability-copy", "가변·불변 객체, 참조와 복사", ["collections", "functions-scope"]),
  C(8, "programming", "functions-scope", "함수, 매개변수, 반환값, 변수의 범위", ["loops"]),
  C(9, "programming", "comprehensions-iterators", "리스트 컴프리헨션과 반복자", ["collections", "functions-scope"]),
  C(10, "programming", "file-io", "파일 입출력: 텍스트, CSV, JSON", ["collections", "functions-scope"]),
  C(11, "programming", "errors-debugging", "오류 메시지 읽기, 예외 처리, 디버깅", ["functions-scope"]),
  C(12, "programming", "modules-environments", "모듈, 패키지, 가상환경, 의존성", ["functions-scope"]),
  C(13, "programming", "classes-objects", "클래스와 객체의 기초", ["functions-scope", "collections"]),
  C(14, "programming", "data-structures-complexity", "기본 자료구조와 시간복잡도", ["collections", "functions-scope"]),
  C(15, "programming", "git", "Git 기초와 코드 버전 관리", ["modules-environments"]),
  C(16, "programming", "notebooks-reproducibility", "Jupyter Notebook과 재현 가능한 실행", ["modules-environments"]),

  // 트랙 2 · 수학 기초
  C(17, "math", "functions-composition", "함수, 정의역·치역, 함수의 합성", ["functions-scope"]),
  C(18, "math", "elementary-functions", "일차함수, 이차함수, 지수함수, 로그함수", ["functions-composition"]),
  C(19, "math", "sigma-sequences", "시그마 표기와 수열의 기초", ["loops", "elementary-functions"]),
  C(20, "math", "scalars-tensors", "스칼라, 벡터, 행렬, 텐서", ["collections"]),
  C(21, "math", "vector-operations", "벡터의 덧셈, 스칼라곱, 선형결합", ["scalars-tensors"]),
  C(22, "math", "dot-product-similarity", "내적, 벡터의 길이, 거리, 코사인 유사도", ["vector-operations", "elementary-functions"]),
  C(23, "math", "matrix-operations", "행렬의 형태, 전치, 행렬곱", ["dot-product-similarity"]),
  C(24, "math", "linear-maps-basis", "선형변환, 선형독립, 기저, 차원", ["matrix-operations"]),
  C(25, "math", "derivatives", "미분과 도함수, 변화율", ["elementary-functions"]),
  C(26, "math", "partial-derivatives-gradient", "편미분과 기울기", ["derivatives", "scalars-tensors"]),
  C(27, "math", "chain-rule", "연쇄법칙과 합성함수의 미분", ["derivatives", "functions-composition"]),
  C(28, "math", "gradient-descent", "최솟값·최댓값, 경사하강법", ["partial-derivatives-gradient", "chain-rule"]),
  C(29, "math", "probability-events", "확률, 사건, 독립성", ["basic-operations"]),
  C(30, "math", "conditional-bayes", "조건부확률과 베이즈 정리", ["probability-events"]),
  C(31, "math", "random-variables", "확률변수, 확률분포, 기댓값, 분산", ["probability-events", "sigma-sequences"]),
  C(32, "math", "distributions", "정규분포, 이항분포, 표준정규분포", ["random-variables", "elementary-functions"]),
  C(33, "math", "sampling-bias", "표본과 모집단, 표본추출, 표본편향", ["probability-events"]),
  C(34, "math", "descriptive-statistics", "평균, 중앙값, 분위수, 표준편차", ["random-variables", "sigma-sequences"]),
  C(35, "math", "covariance-correlation", "공분산, 상관계수, 상관관계와 인과관계", ["descriptive-statistics", "dot-product-similarity"]),
  C(36, "math", "lln-clt", "큰 수의 법칙과 중심극한정리", ["distributions", "descriptive-statistics"]),
  C(37, "math", "statistical-inference", "추정, 신뢰구간, 가설검정, p값", ["lln-clt", "sampling-bias"]),
  C(38, "math", "likelihood-entropy", "우도, 최대우도추정, 엔트로피, 교차엔트로피", ["distributions", "elementary-functions"]),

  // 트랙 3 · 데이터 처리 기초
  C(39, "data", "numpy-arrays", "NumPy 배열, 축, 형태, 자료형", ["scalars-tensors", "collections"]),
  C(40, "data", "array-indexing-broadcasting", "배열 인덱싱, 불리언 마스킹, 브로드캐스팅", ["numpy-arrays", "indexing-slicing"]),
  C(41, "data", "vectorization-seeds", "벡터화 연산과 난수 시드", ["array-indexing-broadcasting", "data-structures-complexity"]),
  C(42, "data", "pandas-structures", "pandas의 Series와 DataFrame", ["numpy-arrays"]),
  C(43, "data", "pandas-selection", "데이터 불러오기, 조회, 필터링, 정렬", ["pandas-structures", "file-io"]),
  C(44, "data", "pandas-aggregation", "그룹별 집계, 테이블 결합, 형태 변환", ["pandas-selection"]),
  C(45, "data", "data-types", "수치형·범주형·시계열 데이터", ["pandas-structures"]),
  C(46, "data", "data-cleaning", "결측치, 중복값, 이상치, 잘못된 자료형", ["pandas-selection", "descriptive-statistics"]),
  C(47, "data", "visualization", "히스토그램, 산점도, 상자그림, 상관행렬", ["pandas-selection", "covariance-correlation"]),
  C(48, "data", "eda-quality", "탐색적 데이터 분석과 데이터 품질", ["visualization", "data-cleaning"]),
  C(49, "data", "encoding-scaling", "범주형 인코딩, 표준화, 정규화", ["data-types", "descriptive-statistics"]),
  C(50, "data", "feature-engineering", "특성 생성, 특성 선택, 차원의 저주", ["encoding-scaling", "dot-product-similarity"]),

  // 트랙 4 · 머신러닝 기초
  C(51, "ml", "ml-terms", "특성, 정답, 예측, 모델, 파라미터", ["functions-composition"]),
  C(52, "ml", "learning-paradigms", "지도학습, 비지도학습, 자기지도학습, 강화학습", ["ml-terms"]),
  C(53, "ml", "task-types", "회귀, 분류, 군집화, 이상 탐지", ["ml-terms"]),
  C(54, "ml", "data-splits-leakage", "학습·검증·테스트 데이터와 데이터 누수", ["ml-terms", "encoding-scaling"]),
  C(55, "ml", "baselines", "기준 모델과 단순한 예측 기준", ["task-types", "descriptive-statistics"]),
  C(56, "ml", "loss-objective", "손실함수, 목적함수, 학습과 추론", ["ml-terms", "gradient-descent"]),
  C(57, "ml", "linear-regression", "선형회귀, 잔차, 평균제곱오차", ["loss-objective", "matrix-operations"]),
  C(58, "ml", "logistic-regression", "로지스틱 회귀, 시그모이드, 분류 임계값", ["linear-regression", "likelihood-entropy"]),
  C(59, "ml", "classification-metrics", "혼동행렬, 정확도, 정밀도, 재현율, F1", ["logistic-regression"]),
  C(60, "ml", "roc-pr-imbalance", "ROC-AUC, PR-AUC, 클래스 불균형", ["classification-metrics"]),
  C(61, "ml", "generalization", "일반화, 과적합, 과소적합, 편향·분산", ["data-splits-leakage", "linear-regression"]),
  C(62, "ml", "regularization", "L1·L2 규제, 조기 종료, 학습 곡선", ["generalization"]),
  C(63, "ml", "cross-validation-tuning", "교차검증, 시계열 검증, 하이퍼파라미터 탐색", ["generalization", "data-splits-leakage"]),
  C(64, "ml", "knn-trees-forests", "k최근접 이웃, 결정트리, 랜덤 포레스트", ["dot-product-similarity", "generalization"]),
  C(65, "ml", "boosting-importance", "그래디언트 부스팅, 특성 중요도", ["knn-trees-forests"]),
  C(66, "ml", "kmeans-pca-pipelines", "K-means, PCA, 머신러닝 파이프라인", ["covariance-correlation", "linear-maps-basis", "cross-validation-tuning"]),

  // 트랙 5 · 딥러닝 기초
  C(67, "dl", "perceptron-mlp", "퍼셉트론, 다층 신경망, 활성화 함수", ["logistic-regression", "matrix-operations"]),
  C(68, "dl", "backprop-autodiff", "순전파, 역전파, 계산 그래프, 자동미분", ["perceptron-mlp", "chain-rule", "classes-objects"]),
  C(69, "dl", "optimizers", "배치, 에포크, 학습률, SGD, Adam", ["backprop-autodiff"]),
  C(70, "dl", "initialization-normalization", "가중치 초기화, 기울기 소실·폭주, 정규화 층", ["optimizers", "random-variables"]),
  C(71, "dl", "dropout-residual-transfer", "드롭아웃, 잔차 연결, 전이학습", ["initialization-normalization", "regularization"]),
  C(72, "dl", "pytorch", "PyTorch 텐서, 데이터 로더, 학습 루프, GPU", ["optimizers", "classes-objects", "numpy-arrays"]),
  C(73, "dl", "cnn", "합성곱, CNN, 이미지 증강", ["pytorch", "array-indexing-broadcasting"]),
  C(74, "dl", "sequences-rnn", "시퀀스 데이터, 임베딩, RNN의 기본 구조", ["backprop-autodiff", "dot-product-similarity"]),

  // 트랙 6 · 생성형 AI와 언어 모델
  C(75, "genai", "tokenization", "토큰화, 서브워드, 토큰 임베딩, 위치 정보", ["sequences-rnn", "collections"]),
  C(76, "genai", "attention-transformer", "쿼리·키·값, 셀프 어텐션, 트랜스포머", ["tokenization", "matrix-operations", "initialization-normalization"]),
  C(77, "genai", "pretraining-decoding", "다음 토큰 예측, 사전학습, 문맥 창, 샘플링", ["attention-transformer", "likelihood-entropy", "distributions"]),
  C(78, "genai", "finetuning-alignment-prompting", "지시 미세조정, LoRA, 선호도 학습, 프롬프트 설계", ["pretraining-decoding"]),
  C(79, "genai", "retrieval-rag-agents", "벡터 검색, RAG, 도구 호출, 에이전트", ["pretraining-decoding", "dot-product-similarity", "file-io", "data-structures-complexity"]),
  C(80, "genai", "evaluation-serving", "환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링", ["retrieval-rag-agents", "classification-metrics", "statistical-inference"]),
];

const BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return BY_ID.get(id);
}
