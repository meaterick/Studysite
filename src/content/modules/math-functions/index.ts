import { defineModule, md } from "../../kit";
import functionsComposition from "./functions-composition";
import elementaryFunctions from "./elementary-functions";
import sigmaSequences from "./sigma-sequences";

export default defineModule({
  slug: "math-functions",
  track: "math",
  order: 1,
  title: "함수와 수열",
  summary: "함수와 합성, 일차·이차·지수·로그함수, 시그마 표기와 수열",
  anchor: md`
데이터 $(1, 2), (2, 4), (3, 7)$에 모델 $\hat y = wx$를 맞출 때의 평균제곱오차 $L(w) = \frac{1}{n}\sum_{i=1}^{n}(w x_i - y_i)^2$를 하나의 함수로 보고, 그래프를 그려 최솟값의 위치를 꼭짓점 공식으로 구한다. 확률을 다루는 시그모이드와 로그 확률의 합을 넘침·언더플로 없이 계산한다. 이후의 모든 모델과 손실은 이 함수들의 합성으로 쓴다.
`,
  objectives: [
    "함수의 정의역·치역을 구분하고, 합성함수를 계산하며 여러 층으로 된 모델을 합성으로 나타낸다.",
    "일차·이차·지수·로그함수의 성질을 설명하고, 이차함수의 꼭짓점으로 평균제곱오차의 최솟값을 구한다.",
    "로그의 성질로 확률의 곱을 로그 확률의 합으로 바꾸고, 지수 계산의 넘침을 피한다.",
    "$\\Sigma$ 표기와 합의 성질을 적용하고, 등차·등비수열의 합을 계산하며 $\\Sigma$ 식을 코드로 옮긴다.",
  ],
  lessons: [functionsComposition, elementaryFunctions, sigmaSequences],
  recall: [
    { prompt: "$(g \\circ f)(x)$의 뜻을 쓰고, 순서를 바꾸면 결과가 달라지는 예와 $\\ln(x - 1)$의 정의역을 쓰라." },
    { prompt: "이차함수 $y = ax^2 + bx + c$의 꼭짓점 공식을 쓰고, 평균제곱오차가 파라미터 하나의 이차함수가 되는 이유를 설명하라." },
    { prompt: "로그의 성질 두 가지를 쓰고, 확률의 곱 대신 로그 확률의 합을 계산하는 이유를 설명하라." },
    { prompt: "평균, 분산, 평균제곱오차, 내적을 $\\Sigma$ 식으로 쓰고, 각각을 코드 한 줄로 옮겨라." },
    { prompt: "등비수열의 합 공식을 쓰고, 학습률을 매번 0.9배로 줄일 때 학습률의 총합이 얼마를 넘지 않는지 계산하라." },
  ],
});
