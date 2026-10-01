import type { AssignmentSpec } from "../types";

// 1주차 과제: 경사하강법으로 선형회귀를 직접 학습하고, 베이즈 정리를 다시 계산한다.
// 모든 코드 셀은 과제 작업 공간의 한 이름공간을 공유하므로 앞 셀에서 만든 변수를 뒤 셀에서 쓸 수 있다.
const week1Assignment: AssignmentSpec = {
  title: "경사하강법과 베이즈 정리 직접 계산하기",
  summary: `
NumPy만으로 선형회귀를 경사하강법으로 학습하고, 학습률에 따른 수렴 양상과 해석해를 비교합니다. 이어서 베이즈 정리 예제의 조건을 바꿔 사후확률이 어떻게 달라지는지 확인합니다. 모든 작업은 이 페이지의 코드 셀과 답안 칸에서 진행하며, 코드는 브라우저에서 실행됩니다.
`,
  tasks: [
    {
      id: "gd",
      tier: "core",
      title: "경사하강법으로 w, b 학습하기",
      instructions: `
데이터 $y = 2x + 1 + \\varepsilon$ 100개를 생성하고, 평균제곱오차 $L(w, b) = \\frac{1}{n}\\sum_i (w x_i + b - y_i)^2$를 경사하강법으로 최소화합니다.

1. 답안 칸에 $\\partial L/\\partial w$와 $\\partial L/\\partial b$를 유도 과정과 함께 적습니다.
2. 코드 셀의 \`grad\` 함수에서 \`TODO\` 두 줄을 유도한 식으로 채우고 실행합니다. 학습이 끝났을 때 $w \\approx 2$, $b \\approx 1$이 나오면 올바르게 구현한 것입니다.
`,
      cells: [
        {
          kind: "text",
          id: "gd-derivation",
          prompt: "MSE의 $w$, $b$에 대한 편미분을 유도 과정과 함께 적어 주십시오. 코드의 어느 줄이 어느 식에 대응하는지도 밝힙니다.",
          minChars: 80,
        },
        {
          kind: "code",
          id: "gd-code",
          label: "데이터 생성과 경사하강법",
          starter: `import numpy as np

rng = np.random.default_rng(42)
n = 100
x = rng.uniform(-3, 3, n)
y = 2 * x + 1 + rng.normal(0, 0.5, n)

def loss(w, b):
    return np.mean((w * x + b - y) ** 2)

def grad(w, b):
    err = w * x + b - y
    dw = 0.0  # TODO: ∂L/∂w
    db = 0.0  # TODO: ∂L/∂b
    return dw, db

def train(lr, steps=200):
    w, b = 0.0, 0.0
    history = []
    for _ in range(steps):
        dw, db = grad(w, b)
        w -= lr * dw
        b -= lr * db
        history.append(loss(w, b))
    return w, b, history

w, b, history = train(lr=0.1)
print(f"w = {w:.4f}, b = {b:.4f}, 최종 loss = {history[-1]:.4f}")
`,
        },
      ],
    },
    {
      id: "lr",
      tier: "core",
      title: "학습률 네 가지 비교",
      instructions: `
학습률 0.001, 0.01, 0.1, 0.5로 각각 학습해 loss 곡선을 한 그래프에 그립니다. 발산하는 경우에도 그래프가 읽히도록 세로축은 로그 척도로 두었습니다. 어떤 학습률이 가장 빠르게, 또 가장 안정적으로 수렴하는지 관찰 결과를 세 문장 이상으로 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "lr-code",
          label: "학습률별 loss 곡선",
          starter: `import matplotlib.pyplot as plt

plt.figure(figsize=(6, 4))
print(f"{'학습률':>8}{'w':>12}{'b':>12}{'최종 loss':>14}")
for lr in (0.001, 0.01, 0.1, 0.5):
    w_lr, b_lr, hist = train(lr, steps=200)
    plt.plot(hist, label=f"lr={lr}")
    print(f"{lr:>8}{w_lr:>12.3g}{b_lr:>12.3g}{hist[-1]:>14.3g}")
plt.yscale("log")
plt.xlabel("step")
plt.ylabel("MSE (log scale)")
plt.legend()
plt.title("Learning rate comparison")
plt.show()
`,
        },
        {
          kind: "text",
          id: "lr-observation",
          prompt: "학습률별 수렴 속도와 안정성을 비교하고, 그렇게 된 이유를 설명해 주십시오.",
          minChars: 120,
        },
      ],
    },
    {
      id: "lstsq",
      tier: "core",
      title: "해석해와 비교하기",
      instructions: `
설계 행렬 $X = [x, 1]$을 만들어 \`np.linalg.lstsq\`로 해석해를 구하고, 경사하강법 결과와의 차이를 출력합니다. 차이가 생긴다면 그 원인이 무엇인지(스텝 수, 학습률 등) 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "lstsq-code",
          label: "최소제곱 해석해",
          starter: `X = np.column_stack([x, np.ones(n)])
(w_star, b_star), *_ = np.linalg.lstsq(X, y, rcond=None)
print(f"해석해:     w = {w_star:.4f}, b = {b_star:.4f}")
print(f"경사하강법: w = {w:.4f}, b = {b:.4f}")
print(f"차이: |Δw| = {abs(w - w_star):.2e}, |Δb| = {abs(b - b_star):.2e}")
`,
        },
        {
          kind: "text",
          id: "lstsq-answer",
          prompt: "두 결과가 얼마나 가까운지, 차이가 있다면 원인이 무엇인지 설명해 주십시오.",
          minChars: 60,
        },
      ],
    },
    {
      id: "bayes",
      tier: "core",
      title: "베이즈 정리 다시 계산하기",
      instructions: `
「확률과 베이즈 정리」 단계의 예제(유병률 1%, 민감도 99%, 위양성률 5%)를 함수로 만들고, 유병률을 0.1%, 1%, 10%, 30%로 바꿔 양성 판정을 받은 사람이 실제로 병이 있을 확률 $P(\\text{병} \\mid \\text{양성})$을 계산합니다. 유병률에 따라 결과가 크게 달라지는 이유를 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "bayes-code",
          label: "사후확률 계산",
          starter: `def posterior(prevalence, sensitivity=0.99, false_positive=0.05):
    # TODO: 베이즈 정리로 P(병 | 양성)을 계산해 반환합니다.
    p_positive = 0.0  # TODO: 전체 확률의 법칙으로 P(양성)
    return 0.0        # TODO

for prev in (0.001, 0.01, 0.1, 0.3):
    print(f"유병률 {prev:>5.1%} → P(병 | 양성) = {posterior(prev):.1%}")
`,
        },
        {
          kind: "text",
          id: "bayes-answer",
          prompt: "유병률이 바뀔 때 사후확률이 어떻게 달라지는지, 그 이유와 함께 설명해 주십시오.",
          minChars: 80,
        },
      ],
    },
    {
      id: "advanced",
      tier: "advanced",
      title: "심화: 미니배치·학습률 스케줄·시뮬레이션",
      instructions: `
다음 중 하나 이상을 골라 실험합니다. 가산점 대상이며, 채점 기준의 해당 항목에 반영합니다.

- 미니배치 확률적 경사하강법으로 바꾸고, 배치 크기(1, 10, 100)에 따라 loss 곡선의 잡음이 어떻게 달라지는지 비교합니다.
- 스텝이 진행될수록 학습률을 줄이는 학습률 스케줄을 적용해 고정 학습률과 수렴 속도를 비교합니다.
- 가상의 10만 명을 만들어 베이즈 정리 결과를 시뮬레이션으로 검증합니다.
- 동전 던지기의 MLE와 MAP 추정치가 시행 횟수 $n$이 커질수록 가까워지는지 확인합니다.
`,
      cells: [
        {
          kind: "code",
          id: "advanced-code",
          label: "심화 실험",
          starter: `# 선택한 심화 실험을 이 셀에서 진행합니다. 필요하면 아래 '+ 코드 셀 추가'로 셀을 늘릴 수 있습니다.
`,
        },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "derivation", label: "수식 유도의 정확성", points: 3, guide: "편미분 유도가 정확하고, 식과 코드의 대응을 설명했습니다." },
    { id: "reproducible", label: "코드 동작과 재현성", points: 3, guide: "모든 셀이 처음부터 순서대로 실행되며, 시드를 고정해 같은 결과가 재현됩니다." },
    { id: "insight", label: "실험 관찰의 통찰", points: 3, guide: "학습률 비교, 해석해 비교, 유병률 변화에 대해 수치를 근거로 원인을 설명했습니다." },
    { id: "clarity", label: "가독성", points: 1, guide: "답안이 간결하고 그래프·출력과 서술이 잘 연결됩니다." },
  ],
};

export default week1Assignment;
