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
  summary: "토큰화와 위치 정보, 어텐션의 필요성, 셀프 어텐션, 멀티헤드 어텐션, 디코더 블록",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [tokenization, attentionMotivation, selfAttention, multiHeadAttention, transformerBlock, efficientAttention, linearAttention, positionExtrapolation],
  recall: [
    { prompt: "① RNN이 긴 문장의 앞부분 정보를 잃는 이유와, Seq2Seq의 고정 길이 벡터 병목을 Attention이 어떻게 해결했는지 설명하십시오.", hint: "디코더가 매 스텝 무엇을 다시 참조하는지 적어 보십시오." },
    { prompt: "② Self-Attention에서 Query, Key, Value가 각각 하는 일을 설명하고, softmax(QKᵀ/√dₖ)V의 계산 순서를 설명하십시오.", hint: "토큰 n개일 때 Q, K, V, QKᵀ, 출력의 shape을 함께 적어 보십시오." },
    { prompt: "③ 점수를 √dₖ로 나누는 이유를 설명하십시오.", hint: "dₖ가 커질 때 내적의 분산과 softmax가 어떻게 되는지 적어 보십시오." },
    { prompt: "④ Causal mask가 하는 일과, 마스크 없이 학습하면 생기는 문제를 설명하십시오. 헤드를 여러 개 쓰는 이유도 설명하십시오.", hint: "5×5 attention 행렬에서 가려지는 칸을 적어 보십시오." },
    { prompt: "⑤ Self-Attention만으로는 단어 순서를 구별하지 못하는 이유와 위치 인코딩의 역할을 설명하십시오.", hint: "토큰 순서를 섞었을 때 출력이 어떻게 되는지 적어 보십시오." },
  ],
  assignment,
});
