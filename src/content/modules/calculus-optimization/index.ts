import { defineModule, md } from "../../kit";
import derivatives from "./derivatives";
import gradient from "./gradient";
import chainRule from "./chain-rule";
import gradientDescent from "./gradient-descent";
import gdConvergence from "./gd-convergence";

export default defineModule({
  slug: "calculus-optimization",
  track: "math",
  order: 3,
  title: "미분과 최적화",
  summary: "도함수, 편미분과 기울기, 연쇄법칙, 경사하강법",
  anchor: md`
데이터 $(1, 2), (2, 4), (3, 7)$에 모델 $\hat y = wx + b$를 맞출 때, 평균제곱오차를 $w$와 $b$로 편미분해 기울기를 구하고, 그 반대 방향으로 두 파라미터를 반복해서 옮겨 최소제곱 해 $w = 2.5$, $b \approx -0.667$에 도달한다. 손으로 유도한 기울기는 수치미분으로 검산하고, 학습률을 바꿔 가며 수렴·진동·발산이 일어나는 조건을 오차의 배율로 설명한다.
`,
  objectives: [
    "평균변화율의 극한으로 도함수를 정의하고, 미분 규칙으로 도함수를 구하며, 도함수의 부호로 증가·감소와 최솟값을 판단한다.",
    "편미분으로 기울기 벡터를 만들고, 기울기가 가장 빠르게 증가하는 방향이며 등고선에 수직인 이유를 방향도함수로 설명한다.",
    "연쇄법칙으로 합성함수와 여러 단계로 된 계산의 기울기를 구하고, 중심차분으로 결과를 검산한다.",
    "경사하강법으로 1변수·다변수 손실을 최소화하고, 학습률에 따른 수렴·진동·발산과 기울기가 0인 점의 종류를 구분한다.",
  ],
  lessons: [derivatives, gradient, chainRule, gradientDescent, gdConvergence],
  recall: [
    { prompt: "도함수의 정의를 쓰고, 정의만으로 $(x^2)' = 2x$임을 보여라. $\\frac{dL}{dw} = -6$이 무엇을 뜻하는지 설명하라." },
    { prompt: "$f(x, y) = x^2 + 3xy$의 편미분과 점 $(1, 2)$에서의 기울기를 구하고, $f$가 가장 빠르게 감소하는 방향을 쓰라." },
    { prompt: "연쇄법칙을 식으로 쓰고, $L = (wx - y)^2$의 $\\frac{dL}{dw}$와 $\\sigma'(z) = \\sigma(z)(1 - \\sigma(z))$를 유도하라." },
    { prompt: "경사하강법의 갱신식을 쓰고, $L(w) = (w - 3)^2$에서 오차가 매번 $(1 - 2\\eta)$배가 되는 이유와 $\\eta = 0.1, 0.75, 1.1$일 때 각각 어떻게 되는지 설명하라." },
    { prompt: "기울기가 0인 점이 최솟값이 아닐 수 있는 두 경우를 쓰고, 중심차분으로 손으로 구한 기울기를 검산하는 방법과 $h$를 지나치게 작게 하면 안 되는 이유를 설명하라." },
  ],
});
