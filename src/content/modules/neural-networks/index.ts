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
초승달 두 개 모양으로 섞인 2차원 데이터(make_moons)는 직선 하나로 나뉘지 않는다. ReLU 은닉층을 넣은 다층 신경망이 이런 데이터를 나눌 수 있는 이유를 XOR로 확인하고, 계산 그래프와 연쇄법칙으로 역전파를 손으로 계산한다. 그다음 덧셈·곱셈·ReLU의 국소 미분만 정의한 자동미분 엔진(Value 클래스)을 직접 만들고, 이 엔진 위에 뉴런·층·MLP를 쌓아 미니배치 경사하강법으로 make_moons를 분류한다. 학습률과 최적화기(SGD, Momentum, Adam)를 바꾸며 손실이 줄어드는 속도를 비교한다.
`,
  objectives: [
    "퍼셉트론과 뉴런의 계산을 하고, 활성화 함수가 없으면 여러 층이 한 층과 같아지는 이유와 은닉층이 XOR을 푸는 원리를 설명한다.",
    "계산 그래프에서 노드별 국소 미분과 연쇄법칙으로 역전파를 수행하고, 한 층의 기울기 공식을 행렬 모양과 수치미분으로 확인한다.",
    "연산자 메서드·클로저·재귀로 자동미분 엔진을 구현하고, 위상정렬과 기울기 누적이 필요한 이유를 설명한다.",
    "미니배치·반복·에포크를 구분하고, SGD·Momentum·Adam의 갱신식을 계산해 문제에 맞는 최적화기와 학습률을 고른다.",
  ],
  lessons: [perceptronMlp, backprop, micrograd, optimizers, autodiffTheory, adamTheory],
  recall: [
    { prompt: "활성화 함수 없이 선형 층을 여러 개 쌓으면 한 층과 같아지는 이유를 식으로 쓰고, ReLU 은닉층이 XOR을 푸는 원리를 쓰라." },
    { prompt: "계산 그래프에서 덧셈·곱셈·ReLU 노드가 입력으로 보내는 기울기를 쓰고, $L = (wx + c)^2$의 역전파를 노드 순서대로 쓰라. 역전파가 수치미분보다 효율적인 이유도 쓰라." },
    { prompt: "한 층 $z = Wx + b$에서 $\\delta = \\partial L/\\partial z$일 때 $\\partial L/\\partial W$, $\\partial L/\\partial b$, $\\partial L/\\partial x$를 쓰고, 각 기울기의 모양이 $W$, $b$, $x$와 같은 이유를 쓰라." },
    { prompt: "자동미분 엔진의 backward()가 위상정렬의 역순으로 _backward를 실행하는 이유와, 기울기를 += 로 누적하고 반복마다 0으로 되돌리는 이유를 쓰라." },
    { prompt: "SGD·Momentum·Adam이 파라미터를 갱신하는 방식의 차이를 쓰고, Adam의 편향 보정이 필요한 이유를 쓰라." },
  ],
  assignment,
});
