import { defineModule, md } from "../../kit";
import initialization from "./initialization";
import normalizationLayers from "./normalization-layers";
import dropoutResidual from "./dropout-residual";
import transferLearning from "./transfer-learning";
import pytorch from "./pytorch";
import pytorchPractice from "./pytorch-practice";
import trainingSchedules from "./training-schedules";
import gradientFlow from "./gradient-flow";

export default defineModule({
  slug: "deep-training",
  track: "dl",
  order: 2,
  title: "깊은 신경망 학습 기법",
  summary: "가중치 초기화와 정규화 층, 드롭아웃과 잔차 연결, 전이학습과 학습 진단, PyTorch 학습 루프",
  anchor: md`
폭 256인 ReLU 층 20개로 만든 신경망을 학습하면 손실이 처음부터 줄지 않는다. 가중치를 표준정규분포로 초기화하면 활성화가 층마다 약 11배씩 커지고, 너무 작게 초기화하면 0에 가까워진다. 분산 계산으로 He 초기화를 유도해 활성화의 크기를 유지하고, BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축을 비교한다. 드롭아웃으로 과적합을 줄이고, 잔차 연결 $y = F(x) + x$로 층이 깊어도 기울기가 앞쪽 층까지 전달되게 한다. 사전학습한 모델에서 출발하는 전이학습과, 학습이 실패할 때 초기 손실 $\ln C$와 배치 하나 과적합으로 원인을 좁히는 진단 순서를 익힌다. 마지막으로 직접 구현한 자동미분과 경사하강법을 PyTorch의 텐서, autograd, 옵티마이저, DataLoader로 옮겨 GPU에서 학습한다.
`,
  objectives: [
    "역전파에서 국소 미분의 곱으로 기울기가 소실·폭주하는 원리를 설명하고, 분산 계산으로 Xavier·He 초기화를 유도한다.",
    "BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축을 계산으로 구분하고, 학습 모드와 평가 모드의 차이를 설명한다.",
    "역드롭아웃의 보정과 잔차 연결의 기울기 $F'(x) + 1$을 계산하고, 성능 저하 문제가 최적화의 문제인 이유를 설명한다.",
    "데이터의 양과 유사도에 따라 특성 추출과 파인튜닝을 고르고, 초기 손실과 배치 하나 과적합으로 학습 실패의 원인을 진단한다.",
    "PyTorch의 텐서·autograd·nn.Module·옵티마이저·DataLoader로 GPU 학습 루프와 검증 루프를 작성한다.",
  ],
  lessons: [initialization, normalizationLayers, dropoutResidual, transferLearning, pytorch, pytorchPractice, trainingSchedules, gradientFlow],
  recall: [
    { prompt: "$\\mathrm{Var}(z) \\approx \\text{fan\\_in}\\cdot\\mathrm{Var}(w)\\cdot\\mathrm{Var}(x)$를 유도하고, He 초기화의 분산이 $2/\\text{fan\\_in}$인 이유를 쓰라. 층마다 0.8배가 되는 신호가 10층 뒤 몇 배가 되는지도 쓰라." },
    { prompt: "$z = \\begin{pmatrix}2 & 4\\\\ 6 & 8\\end{pmatrix}$(행은 샘플)에 BatchNorm과 LayerNorm을 적용할 때 각각의 평균과 분산을 쓰고, Transformer가 LayerNorm을 쓰는 이유를 쓰라." },
    { prompt: "역드롭아웃에서 학습 중에 남은 값을 $1/(1-p)$배 하는 이유와, 평가할 때 `model.eval()`을 호출하지 않으면 생기는 일을 쓰라." },
    { prompt: "잔차 연결 $y = F(x) + x$의 $dy/dx$를 쓰고, 블록 50개를 지난 기울기를 잔차 연결이 있을 때와 없을 때 비교해 쓰라." },
    { prompt: "PyTorch 학습 루프의 여섯 단계를 순서대로 쓰고, 각 단계가 직접 구현한 자동미분 엔진의 어느 부분에 해당하는지 쓰라. 10클래스 분류의 정상적인 초기 손실 값도 쓰라." },
  ],
});
