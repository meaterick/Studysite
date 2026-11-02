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
  summary: "합성곱과 풀링, CNN 학습과 이미지 증강, 임베딩과 RNN",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [convolution, pooling, cnnTraining, embeddings, rnn, cnnArchitectures, lstmGru, convAsMatmul],
  recall: [
    { prompt: "① 이미지에 완전연결층 대신 합성곱을 쓰는 이유를 파라미터 공유와 지역성으로 설명하십시오.", hint: "32×32×3 이미지에서 두 방식의 파라미터 수를 비교해 보십시오." },
    { prompt: "② 합성곱 출력 크기 공식을 적고, 입력 32×32, 커널 5, 패딩 2, stride 1일 때의 출력 크기를 계산하십시오.", hint: "stride를 2로 바꾸면 어떻게 되는지도 계산해 보십시오." },
    { prompt: "③ 수용영역이 무엇인지 설명하고, 3×3 합성곱을 여러 층 쌓거나 풀링을 하면 수용영역이 어떻게 넓어지는지 설명하십시오.", hint: "3×3 합성곱을 3층 쌓았을 때의 수용영역을 계산해 보십시오." },
  ],
  assignment,
});
