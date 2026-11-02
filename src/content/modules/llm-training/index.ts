import { defineModule, md } from "../../kit";
import pretraining from "./pretraining";
import decoding from "./decoding";
import instructionTuning from "./instruction-tuning";
import preferenceLearning from "./preference-learning";
import promptDesign from "./prompt-design";
import llmArchitectures from "./llm-architectures";
import scalingLaws from "./scaling-laws";
import kvCacheRope from "./kv-cache-rope";
import rlBasics from "./rl-basics";
import testTimeCompute from "./test-time-compute";
import dpoDerivation from "./dpo-derivation";
import policyGradient from "./policy-gradient";
import assignment from "./assignment";

export default defineModule({
  slug: "llm-training",
  track: "genai",
  order: 2,
  title: "LLM의 학습과 생성",
  summary: "다음 토큰 예측과 사전학습, 디코딩, 지시 미세조정과 LoRA, 선호도 학습, 프롬프트 설계",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [pretraining, decoding, instructionTuning, preferenceLearning, promptDesign, llmArchitectures, scalingLaws, kvCacheRope, rlBasics, testTimeCompute, dpoDerivation, policyGradient],
  recall: [
    { prompt: "① 다음 토큰 예측이 사람의 라벨 없이 학습 데이터를 만드는 원리를 설명하고, perplexity가 무엇을 뜻하는지 설명하십시오.", hint: "평균 손실이 2.0 nats일 때 perplexity를 계산해 보십시오." },
    { prompt: "② 사전학습, SFT, RLHF(또는 DPO)가 각각 어떤 데이터로 무엇을 학습하는지 설명하십시오.", hint: "원문, (지시, 응답) 쌍, 선호 비교 쌍을 단계와 연결해 보십시오." },
    { prompt: "④ temperature T가 softmax(z/T) 분포를 어떻게 바꾸는지 설명하고, top-k와 top-p의 차이를 설명하십시오.", hint: "logit [3, 2, 1, 0, −1]에서 T = 0.5와 T = 2를 비교해 보십시오." },
  ],
  assignment,
});
