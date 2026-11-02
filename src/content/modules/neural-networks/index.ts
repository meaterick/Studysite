import { defineModule, md } from "../../kit";
import perceptronMlp from "./perceptron-mlp";
import backprop from "./backprop";
import micrograd from "./micrograd";
import optimizers from "./optimizers";
import autodiffTheory from "./autodiff-theory";
import adamTheory from "./adam-theory";
import assignment from "./assignment";

export default defineModule({
  slug: "neural-networks",
  track: "dl",
  order: 1,
  title: "신경망과 학습 원리",
  summary: "퍼셉트론과 다층 신경망, 역전파와 계산 그래프, 자동미분 엔진, 최적화기",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [perceptronMlp, backprop, micrograd, optimizers, autodiffTheory, adamTheory],
  recall: [
    { prompt: "① 활성화 함수 없이 선형 층을 여러 개 쌓으면 왜 한 층과 같아지는지 설명하십시오.", hint: "W₃W₂W₁x를 하나의 행렬로 묶어 보십시오." },
    { prompt: "② 역전파가 연쇄법칙을 어떻게 효율적으로 적용하는지 계산 그래프와 \"계산 재사용\"으로 설명하십시오.", hint: "L = (w·x + c − y)²의 계산 그래프를 예로 들어 보십시오." },
    { prompt: "③ 한 층 z = Wx + b에서 δ = dL/dz가 주어질 때 dL/dW, dL/db, dL/dx를 적고, 각 결과의 shape이 W, b, x와 같은 이유를 설명하십시오.", hint: "W가 (m × n)일 때 각 행렬의 shape을 함께 적어 보십시오." },
    { prompt: "④ SGD, Momentum, Adam이 파라미터를 갱신하는 방식의 차이를 설명하십시오.", hint: "1차 모멘트와 2차 모멘트가 각각 하는 일을 적어 보십시오." },
  ],
  assignment,
});
