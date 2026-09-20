import type { WeekMeta } from "../types";

const week1: WeekMeta = {
  slug: "week-1",
  number: 1,
  phase: "Phase 1 · 기초",
  title: "AI 지형도와 수학·코드 기초",
  subtitle: "벡터·내적, 확률·베이즈, 미분·경사하강법 — 모든 것의 출발점",
  selfHours: "개인 6h",
  sessionHours: "세션 2h",
  difficulty: 2,
  keywords: ["벡터", "내적", "확률", "미분", "경사하강법"],
  objectives: [
    "AI·ML·DL·생성형 AI의 포함관계와 역사를 설명한다.",
    '"학습 = 손실을 줄이는 방향으로 파라미터를 움직이는 것"을 수식과 코드로 설명한다.',
    "벡터 내적·코사인 유사도, 조건부확률·베이즈 정리, 편미분·기울기를 계산한다.",
  ],
  learningOrder: [
    '영상: 3Blue1Brown "Essence of Linear Algebra" 1~4강, "But what is a neural network?" (약 1.5h)',
    "읽기: Mathematics for ML (mml-book.com) 2장 일부 · CS229 Linear Algebra Review / Probability Review (cs229.stanford.edu)",
    "본 문서 개념 정리 → 실습 코드 → 퀴즈 → 백지공부 → 과제",
  ],
  conceptsMd: `
### 2.1 AI의 지형도

[[diagram:ai-hierarchy]]

| 시기 | 사건 | 의미 |
| --- | --- | --- |
| 1956 | 다트머스 회의 | "AI" 용어 탄생 |
| 1986 | 역전파 대중화(Rumelhart, Hinton) | 다층 신경망 학습 가능 |
| 2012 | AlexNet (ImageNet 우승) | GPU + 대규모 데이터 = 딥러닝 시대 |
| 2017 | Transformer | 현대 LLM의 뼈대 |
| 2022~ | ChatGPT 등 대화형 LLM | 생성형 AI 대중화 |

### 2.2 ML의 한 줄 정의

데이터 (x, y)가 주어질 때, 함수 \`f_θ(x) ≈ y\` 가 되도록 파라미터 θ를 찾는다. 이를 위해 **손실 L(θ)**를 정의하고 **최소화**한다.

[[diagram:ml-loop]]

### 2.3 선형대수: 벡터와 유사도

- 벡터 = 특징들의 목록 (예: 단어 임베딩 \`[0.2, -1.1, 0.7, ...]\`)
- 내적 \`a·b = Σ aᵢbᵢ = |a||b|cosθ\` → **같은 방향일수록 큼**
- 코사인 유사도 = \`a·b / (|a||b|) ∈ [-1, 1]\` — W7 RAG 검색의 핵심 연산
- 행렬-벡터 곱 \`Wx\` = "입력을 새 좌표계로 변환" — 신경망 한 층의 본질

### 2.4 확률

- 조건부확률 \`P(A|B) = P(A∩B)/P(B)\`
- 베이즈 정리: \`P(A|B) = P(B|A)P(A)/P(B)\`
- 기대값 \`E[X]\`, 분산 \`Var(X)\` — 손실이 "평균 오차"인 이유

:::example 예제
질병 유병률 1%, 검사 민감도 99%, 위양성률 5%. 양성일 때 실제 병일 확률은?
→ 0.99×0.01 / (0.99×0.01 + 0.05×0.99) = 0.0099/0.0594 ≈ **16.7%**. (직관과 크게 다름: 기저율을 무시하면 생기는 오류)
:::

### 2.5 미분과 경사하강법

[[diagram:gradient-descent-curve]]

\`\`\`formula
w ← w − η · dL/dw
η(학습률)가 너무 크면 발산, 너무 작으면 느림
\`\`\`

예: L(w) = (w−3)² → dL/dw = 2(w−3). w=0, η=0.1 → w₁ = 0 − 0.1×(−6) = 0.6 → 1.08 → … → 3에 수렴.

다변수: 기울기 \`∇L = [∂L/∂w₁, …, ∂L/∂wₙ]\` (가장 가파르게 오르는 방향). 그 반대로 이동한다.
`,
  practiceMd: `
Google Colab에서 그대로 실행할 수 있다.

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

# (1) 코사인 유사도
def cos_sim(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

king  = np.array([0.9, 0.8, 0.1])
queen = np.array([0.85, 0.75, 0.9])
apple = np.array([0.1, 0.05, 0.5])
print(cos_sim(king, queen), cos_sim(king, apple))

# (2) 경사하강법: L(w) = (w-3)^2
w, lr, hist = 0.0, 0.1, []
for step in range(30):
    grad = 2 * (w - 3)
    w -= lr * grad
    hist.append((w - 3) ** 2)
plt.plot(hist); plt.yscale("log"); plt.title("loss"); plt.show()

# (3) 실험: lr을 0.01, 0.1, 0.9, 1.1 로 바꿔 수렴/발산 관찰하기
\`\`\`

:::warn 관찰 과제
lr=1.1일 때 왜 발산하는지 수식으로 설명하라. (힌트: w−3 은 매 스텝 (1−2η) 배가 된다.)
:::
`,
  quiz: [
    "a=[1,2], b=[2,1]의 내적과 코사인 유사도는?",
    "유병률 2%, 민감도 90%, 위양성률 10%일 때 양성 시 실제 병일 확률은?",
    "L(w)=w²+4w+1 의 기울기와 경사하강법 첫 스텝(w=1, η=0.1) 결과는?",
    "학습률이 너무 큰 경우 나타나는 현상은?",
    '"ML = 함수 근사"라는 말을 한 문장으로 설명하라.',
  ],
  worksheet: [
    { label: "① 제목·오늘의 질문", hint: "오늘 배운 내용을 한 문장 질문으로 적어보세요." },
    { label: "② 핵심 키워드 5개", hint: "쉼표로 구분해 5개를 적어보세요." },
    { label: "③ 구조도/그림 — 경사하강법 루프를 그려라", hint: "말로 설명해도 좋습니다: 어떤 노드가 어떤 순서로 연결되나요?" },
    { label: "④ 수식·코드 스케치 — w 갱신식", hint: "w ← w − η·(...)" },
    { label: '⑤ 중학생에게 설명하기 — "AI는 어떻게 학습하나요?" (5문장)', hint: "비유를 하나 이상 사용해보세요." },
    { label: "⑥ 막힌 곳 / 다음 주 질문", hint: "책을 펴서 확인한 뒤, 다른 색으로 보완한 내용을 적어보세요." },
  ],
  assignmentMd: `
### 필수

1. NumPy만으로 \`y = 2x + 1 + 노이즈\` 데이터 100개를 생성하고, 경사하강법으로 w, b를 학습하라. MSE 기울기를 직접 유도해 주석으로 적을 것.
2. 학습률 4종(0.001, 0.01, 0.1, 0.5)의 loss 곡선을 한 그래프에 그리고 관찰을 3줄로 서술.
3. 해석해(\`np.linalg.lstsq\`)와 결과를 비교하라.

### 심화 (가산점)

- 확률적 경사하강법(미니배치)으로 바꾸고, 배치 크기에 따른 수렴 곡선의 잡음 차이를 설명.
- 베이즈 정리 예제를 시뮬레이션(10만 명 샘플링)으로 검증.

### 채점 기준 (10점)

| 항목 | 점수 |
| --- | --- |
| 수식 유도의 정확성 | 3 |
| 코드 재현 가능성 | 3 |
| 실험 관찰의 통찰 | 3 |
| 가독성 | 1 |
`,
  dueNote: "제출: 일요일 23:59, Colab 링크 + 1쪽 리포트",
  furtherReading: [
    "CS229 Lecture Notes: Supervised Learning 앞부분 (cs229.stanford.edu)",
    'Sutton의 "The Bitter Lesson" 에세이 (AI 역사 관점)',
    "Karpathy, micrograd 영상 (다음 주 예습)",
  ],
};

export default week1;
