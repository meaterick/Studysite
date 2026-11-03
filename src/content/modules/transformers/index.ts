import { defineModule, md } from "../../kit";
import tokenization from "./tokenization";
import attentionMotivation from "./attention-motivation";
import selfAttention from "./self-attention";
import multiHeadAttention from "./multi-head-attention";
import transformerBlock from "./transformer-block";
import efficientAttention from "./efficient-attention";
import linearAttention from "./linear-attention";
import positionExtrapolation from "./position-extrapolation";
import assignment from "./assignment";

export default defineModule({
  slug: "transformers",
  track: "genai",
  order: 1,
  title: "트랜스포머",
  summary: "토큰화와 위치 정보, attention의 필요성, self-attention, 멀티헤드 attention과 causal mask, 디코더 블록",
  anchor: md`
GPT 같은 언어 모델은 문장을 토큰으로 나누고, 토큰마다 앞의 토큰들을 참조해 다음 토큰의 확률을 계산한다. 이 모듈은 그 계산의 핵심인 Transformer 디코더 블록을 NumPy로 직접 구현한다. BPE로 문장을 토큰으로 나누고 토큰 임베딩에 위치 벡터를 더해 입력을 만든다. Seq2Seq의 고정 크기 문맥 벡터가 긴 문장에서 정보를 잃는 문제에서 출발해, 토큰마다 다른 토큰들의 값을 가중합하는 self-attention $\text{softmax}(QK^\top/\sqrt{d_k})V$를 손으로 계산한다. 헤드를 여러 개로 나누고, causal mask로 뒤쪽 토큰을 가리며, 잔차 연결과 LayerNorm으로 블록을 쌓는다. 마지막 토큰을 바꿔도 앞 토큰의 출력이 그대로인지 검사해 구현이 맞는지 확인한다.
`,
  objectives: [
    "BPE로 어휘를 만들고 새 단어를 토큰화하며, 토큰 임베딩에 사인파 위치 인코딩을 더해 입력을 만든다.",
    "Seq2Seq의 병목과 attention의 해법을 설명하고, RNN과 self-attention의 경로 길이와 연산량을 비교한다.",
    "$\\text{softmax}(QK^\\top/\\sqrt{d_k})V$를 손과 코드로 계산하고, 각 부분이 필요한 이유를 설명한다.",
    "멀티헤드 attention의 텐서 모양을 계산하고, causal mask를 구현해 올바르게 적용되었는지 검사한다.",
    "디코더 블록에서 attention, MLP, 잔차 연결, LayerNorm의 역할과 위치 정보가 필요한 이유를 설명한다.",
  ],
  lessons: [tokenization, attentionMotivation, selfAttention, multiHeadAttention, transformerBlock, efficientAttention, linearAttention, positionExtrapolation],
  recall: [
    { prompt: "Seq2Seq의 병목 문제를 쓰고, attention이 출력 스텝마다 문맥 벡터 $c_t$를 만드는 식을 쓰라. RNN과 self-attention의 정보 경로 길이와 연산량도 비교하라." },
    { prompt: "self-attention에서 Query, Key, Value가 하는 일과 $\\text{softmax}(QK^\\top/\\sqrt{d_k})V$의 계산 순서를 쓰라. 토큰 $n$개일 때 $Q$, $QK^\\top$, 출력의 모양도 쓰라." },
    { prompt: "점수를 $\\sqrt{d_k}$로 나누는 이유를 내적의 분산과 softmax의 기울기로 쓰라." },
    { prompt: "causal mask가 가리는 칸과 마스크 없이 학습하면 생기는 문제를 쓰고, 헤드를 여러 개 쓰는 이유와 $d = 512$, $h = 8$일 때 헤드별 텐서의 모양을 쓰라." },
    { prompt: "위치 정보가 없는 self-attention이 단어의 순서를 구별하지 못하는 이유를 순열 등변성으로 쓰고, 사인파 위치 인코딩의 식을 쓰라." },
  ],
  assignment,
});
