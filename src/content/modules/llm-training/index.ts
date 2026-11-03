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
  summary: "다음 토큰 예측과 사전학습, 디코딩, 지시 미세조정과 LoRA, 선호 학습, 프롬프트 설계",
  anchor: md`
GPT 같은 LLM은 대규모 텍스트로 다음 토큰을 예측하도록 사전학습한 뒤, 지시와 응답의 예시로 미세조정하고 사람의 선호 비교로 다시 학습해 만든다. 이 모듈은 이 학습 과정과, 학습한 모델에서 텍스트를 생성하는 방법을 다룬다. 문장 하나에서 예측 문제를 만들어 손실과 perplexity를 계산하고, temperature와 top-k, top-p로 같은 확률분포에서 서로 다른 출력을 만든다. LoRA로 미세조정의 학습 파라미터 수를 줄이는 원리를 계산하고, Bradley–Terry 모델로 보상 모델의 손실을, KL 규제와 DPO로 선호 학습의 목적함수를 계산한다. 마지막으로 역할, 출력 형식, Few-shot 예시, 구분자를 적용한 프롬프트를 만들고 모델의 출력을 검사하는 코드를 작성한다.
`,
  objectives: [
    "다음 토큰 예측으로 학습 예제를 만들고, 교차 엔트로피 손실과 perplexity를 계산하며, 문맥 창이 제한되는 이유를 설명한다.",
    "temperature, top-k, top-p, 빔 서치, 반복 페널티가 출력 분포를 어떻게 바꾸는지 계산하고, 용도에 맞는 디코딩 설정을 고른다.",
    "SFT의 역할을 설명하고, 전체 미세조정과 LoRA·QLoRA의 학습 파라미터 수와 메모리를 계산한다.",
    "Bradley–Terry 모델로 보상 모델의 손실을 계산하고, RLHF와 DPO가 KL 규제로 기준 모델에서 크게 벗어나지 않게 하는 원리를 설명한다.",
    "설계 원칙을 적용해 프롬프트를 작성하고, CoT와 Self-Consistency의 원리와 프롬프트 인젝션의 위험을 설명한다.",
  ],
  lessons: [pretraining, decoding, instructionTuning, preferenceLearning, promptDesign, llmArchitectures, scalingLaws, kvCacheRope, rlBasics, testTimeCompute, dpoDerivation, policyGradient],
  recall: [
    { prompt: "다음 토큰 예측이 사람의 라벨 없이 학습 예제를 만드는 원리를 쓰고, 토큰 $T$개짜리 문서에서 예측 문제가 몇 개 만들어지는지 쓰라. 평균 손실이 2.0 nats일 때 perplexity도 계산하라." },
    { prompt: "logit $[3, 2, 1, 0, -1]$에서 $T = 0.5$와 $T = 2$의 분포가 어떻게 다른지 쓰고, top-k와 top-p가 후보를 고르는 기준의 차이를 쓰라." },
    { prompt: "사전학습, SFT, 선호 학습이 각각 어떤 데이터로 무엇을 학습하는지 쓰고, $d = k = 4096$, $r = 16$일 때 LoRA의 학습 파라미터 수를 계산하라." },
    { prompt: "Bradley–Terry 모델의 선호 확률과 보상 모델의 손실을 쓰고, RLHF와 DPO에서 KL 규제가 필요한 이유를 보상 해킹으로 쓰라." },
    { prompt: "CoT가 다단계 문제의 정답률을 높이는 이유를 자기회귀 생성으로 쓰고, 구분자로 데이터를 감싸도 프롬프트 인젝션을 완전히 막지 못하는 이유를 쓰라." },
  ],
  assignment,
});
