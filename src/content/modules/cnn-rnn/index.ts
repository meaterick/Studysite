import { defineModule, md } from "../../kit";
import convolution from "./convolution";
import pooling from "./pooling";
import cnnTraining from "./cnn-training";
import embeddings from "./embeddings";
import rnn from "./rnn";
import cnnArchitectures from "./cnn-architectures";
import lstmGru from "./lstm-gru";
import convAsMatmul from "./conv-as-matmul";
import assignment from "./assignment";

export default defineModule({
  slug: "cnn-rnn",
  track: "dl",
  order: 3,
  title: "이미지와 시퀀스를 위한 신경망",
  summary: "합성곱과 풀링, CNN 학습과 이미지 증강, 임베딩과 RNN, LSTM·GRU",
  anchor: md`
CIFAR-10은 $32 \times 32$ 컬러 이미지로 10개 클래스를 분류하는 데이터셋이다. 이미지를 한 줄로 펴서 완전연결층에 넣으면 파라미터가 많고, 물체의 위치가 조금만 바뀌어도 전혀 다른 입력이 된다. 합성곱으로 작은 커널을 모든 위치에 재사용해 파라미터를 줄이고, 풀링과 stride로 해상도를 줄이며 수용영역을 넓힌다. BatchNorm, 드롭아웃, 데이터 증강을 적용해 Colab에서 CIFAR-10 CNN을 학습한다. 이어서 길이가 일정하지 않은 문장을 토큰 번호와 임베딩 벡터의 시퀀스로 바꾸고, RNN으로 한 토큰씩 읽으며 은닉 상태를 갱신한다. 시퀀스가 길면 BPTT에서 기울기가 소실되는 이유를 계산하고, LSTM과 GRU가 게이트로 이 문제를 줄이는 방법을 확인한다.
`,
  objectives: [
    "합성곱의 출력 크기와 파라미터 수를 계산하고, 지역성과 파라미터 공유가 완전연결층보다 파라미터를 줄이는 이유를 설명한다.",
    "풀링과 stride 2 합성곱의 차이를 설명하고, 점프를 이용해 여러 층의 수용영역을 계산한다.",
    "BatchNorm2d, 드롭아웃, 라벨을 보존하는 데이터 증강을 적용해 CIFAR-10 CNN을 학습하고 평가한다.",
    "텍스트를 토큰 번호와 임베딩 벡터로 바꾸고, One-hot 표현의 한계와 Word2Vec의 학습 방식을 설명한다.",
    "RNN의 재귀식과 BPTT를 계산하고, 야코비안의 곱으로 기울기 소실과 폭주를 설명한다.",
  ],
  lessons: [convolution, pooling, cnnTraining, embeddings, rnn, cnnArchitectures, lstmGru, convAsMatmul],
  recall: [
    { prompt: "이미지에 완전연결층 대신 합성곱층을 쓰는 이유를 지역성과 파라미터 공유로 쓰고, $224 \\times 224 \\times 3$ 입력에서 출력 64개를 만드는 두 층의 파라미터 수를 쓰라." },
    { prompt: "합성곱의 출력 크기 공식을 쓰고, 입력 $32 \\times 32$, 커널 $5 \\times 5$, padding 2일 때 stride 1과 stride 2의 출력 크기를 계산하라." },
    { prompt: "수용영역의 갱신식을 $r$과 점프 $j$로 쓰고, $3 \\times 3$ 합성곱, $2 \\times 2$ 풀링(stride 2), $3 \\times 3$ 합성곱을 차례로 지난 수용영역을 계산하라." },
    { prompt: "One-hot 표현의 두 한계를 쓰고, 임베딩 행렬 $E$와 One-hot 벡터의 곱 $Ee_i$가 무엇인지, Skip-gram이 무엇으로 무엇을 예측하는지 쓰라." },
    { prompt: "RNN의 재귀식과 파라미터 수를 쓰고, BPTT에서 시점 $T$의 손실을 시점 $k$까지 전달할 때 기울기가 소실되는 이유를 쓰라." },
  ],
  assignment,
});
