<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 6-2 LLM의 학습과 생성

[전체 목차](README.md) · 트랙 6 생성형 AI와 언어 모델 · [모듈 원본](../../src/content/modules/llm-training/index.ts)

다음 토큰 예측과 사전학습, 디코딩, 지시 미세조정과 LoRA, 선호 학습, 프롬프트 설계

## 목표 문제

GPT 같은 LLM은 대규모 텍스트로 다음 토큰을 예측하도록 사전학습한 뒤, 지시와 응답의 예시로 미세조정하고 사람의 선호 비교로 다시 학습해 만든다. 이 모듈은 이 학습 과정과, 학습한 모델에서 텍스트를 생성하는 방법을 다룬다. 문장 하나에서 예측 문제를 만들어 손실과 perplexity를 계산하고, temperature와 top-k, top-p로 같은 확률분포에서 서로 다른 출력을 만든다. LoRA로 미세조정의 학습 파라미터 수를 줄이는 원리를 계산하고, Bradley–Terry 모델로 보상 모델의 손실을, KL 규제와 DPO로 선호 학습의 목적함수를 계산한다. 마지막으로 역할, 출력 형식, Few-shot 예시, 구분자를 적용한 프롬프트를 만들고 모델의 출력을 검사하는 코드를 작성한다.

## 학습 목표

- 다음 토큰 예측으로 학습 예제를 만들고, 교차 엔트로피 손실과 perplexity를 계산하며, 문맥 창이 제한되는 이유를 설명한다.
- temperature, top-k, top-p, 빔 서치, 반복 페널티가 출력 분포를 어떻게 바꾸는지 계산하고, 용도에 맞는 디코딩 설정을 고른다.
- SFT의 역할을 설명하고, 전체 미세조정과 LoRA·QLoRA의 학습 파라미터 수와 메모리를 계산한다.
- Bradley–Terry 모델로 보상 모델의 손실을 계산하고, RLHF와 DPO가 KL 규제로 기준 모델에서 크게 벗어나지 않게 하는 원리를 설명한다.
- 설계 원칙을 적용해 프롬프트를 작성하고, CoT와 Self-Consistency의 원리와 프롬프트 인젝션의 위험을 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [다음 토큰 예측, 사전학습, 문맥 창](#lesson-pretraining) | 핵심 | 30분 | #77 다음 토큰 예측, 사전학습, 문맥 창, 샘플링 |
| 2 | [샘플링과 디코딩 전략](#lesson-decoding) | 핵심 | 40분 | #77 다음 토큰 예측, 사전학습, 문맥 창, 샘플링 |
| 3 | [지시 미세조정과 LoRA](#lesson-instruction-tuning) | 핵심 | 35분 | #78 지시 미세조정, LoRA, 선호도 학습, 프롬프트 설계 |
| 4 | [선호도 학습: RLHF와 DPO](#lesson-preference-learning) | 핵심 | 45분 | #78 지시 미세조정, LoRA, 선호도 학습, 프롬프트 설계 |
| 5 | [프롬프트 설계](#lesson-prompt-design) | 핵심 | 40분 | #78 지시 미세조정, LoRA, 선호도 학습, 프롬프트 설계 |
| 6 | [LLM 구조: BERT, GPT, T5](#lesson-llm-architectures) | 보충 | 35분 | — |
| 7 | [스케일링 법칙](#lesson-scaling-laws) | 보충 | 40분 | — |
| 8 | [생성 단계의 트랜스포머: KV 캐시와 RoPE](#lesson-kv-cache-rope) | 보충 | 45분 | — |
| 9 | [강화학습 기초](#lesson-rl-basics) | 보충 | 45분 | — |
| 10 | [추론 시간 계산: 자기일관성, best-of-n, 검증기](#lesson-test-time-compute) | 보충 | 35분 | — |
| 11 | [DPO의 유도](#lesson-dpo-derivation) | 심화 | 30분 | — |
| 12 | [정책 경사와 PPO](#lesson-policy-gradient) | 심화 | 35분 | — |

## 핵심 레슨

<a id="lesson-pretraining"></a>

### 1. 다음 토큰 예측, 사전학습, 문맥 창

핵심 · 30분 · [본문 원본](../../src/content/modules/llm-training/pretraining.ts) · [실습 원본](../../src/content/modules/llm-training/labs/pretraining.ts)

**학습 목표:** 사전학습의 다음 토큰 예측 손실 $L = -\frac{1}{T}\sum_t \log P(x_t \mid x_{<t})$과 perplexity $e^L$을 계산하고, 라벨 없이 학습 데이터가 만들어지는 이유와 문맥 창의 의미와 한계를 설명한다.

**쓰이는 곳:** 모든 LLM은 다음 토큰 예측으로 사전학습한 뒤 지시 미세조정([6-2 지시 미세조정과 LoRA](#lesson-instruction-tuning))과 선호도 학습([6-2 선호도 학습: RLHF와 DPO](#lesson-preference-learning))을 거친다. 사전학습 손실과 perplexity는 언어 모델의 성능을 비교하는 기본 지표이고, 문맥 창의 길이는 한 번에 넣을 수 있는 문서의 양과 비용을 정한다.

**본문 절:** 다음 토큰 예측 · 손으로, 그리고 코드로 계산하기 · 문맥 창

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 공짜 라벨 만들기와 bigram 모델의 perplexity

**서술형**

- `d1` 다음 토큰 예측이 사람의 라벨 없이 학습 데이터를 만드는 이유를 쓰고, 평균 손실이 2.0 nats일 때 perplexity와 그 의미를 쓰라($e^2 \approx 7.39$). 문맥 창이 제한되는 이유도 두 가지 이상 쓰라.

**참고 자료**

- [Liu et al. (2023) — Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) — 긴 입력의 중간에 있는 정보를 덜 활용하는 현상 (영문)
- [Karpathy — Intro to Large Language Models (1시간 영상)](https://www.youtube.com/watch?v=zjkBMFhNj_g) — 사전학습, 미세조정, 사용까지 LLM 전체의 구성 (영문)
- [Stanford CS336 — Language Modeling from Scratch](https://stanford-cs336.github.io/) — LLM을 처음부터 만드는 강의: 데이터, 학습, 스케일링 (영문)

<a id="lesson-decoding"></a>

### 2. 샘플링과 디코딩 전략

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-training/decoding.ts) · [실습 원본](../../src/content/modules/llm-training/labs/decoding.ts)

**학습 목표:** $\text{softmax}(z/T)$로 temperature의 효과를 계산하고, greedy 디코딩·빔 서치·top-k·top-p·반복 페널티·스톱 토큰의 차이를 설명하며 직접 구현한다.

**쓰이는 곳:** 같은 모델이라도 디코딩 설정에 따라 출력의 정확성과 다양성이 크게 달라진다. LLM API의 temperature, top_p, max_tokens, stop 같은 매개변수가 이 레슨의 디코딩 방법이며, RAG 시스템([6-3 RAG 파이프라인](6-3-llm-systems.md#lesson-rag))처럼 출력을 일정하게 유지해야 하는 응용에서는 이 설정을 알맞게 골라야 한다.

**본문 절:** temperature · 디코딩 방법 · greedy 디코딩과 빔 서치 · top-k와 top-p 샘플링 · 반복 페널티와 스톱 토큰

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3

**실습**

- `ex1` temperature·top-k·top-p·반복 페널티 구현

**서술형**

- `d1` logit $[3, 2, 1, 0, -1]$에서 $T = 0.5$일 때 1위 후보의 확률이 $T = 1$일 때보다 커지는 이유를 $\text{softmax}(z/T)$로 쓰고, $T \to 0$과 $T \to \infty$에서 분포가 어떻게 되는지 쓰라.
- `d2` greedy 디코딩, 빔 서치, top-k, top-p 샘플링의 차이를 쓰고, 확률분포가 한 토큰에 집중될 때와 여러 토큰에 고르게 퍼질 때 top-p의 후보 수가 어떻게 바뀌는지 쓰라.

**참고 자료**

- [Hugging Face — How to generate text](https://huggingface.co/blog/how-to-generate) — greedy, 빔 서치, top-k, top-p를 GPT-2로 비교 (영문)
- [Holtzman et al. (2019) — The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751) — top-p(nucleus) 샘플링을 제안한 논문: 그림 1의 반복 예시 (영문)

<a id="lesson-instruction-tuning"></a>

### 3. 지시 미세조정과 LoRA

핵심 · 35분 · [본문 원본](../../src/content/modules/llm-training/instruction-tuning.ts) · [실습 원본](../../src/content/modules/llm-training/labs/instruction-tuning.ts)

**학습 목표:** SFT의 역할과 전체 미세조정의 메모리 비용을 계산하고, LoRA($\Delta W = BA$)와 QLoRA가 각각 학습 파라미터 수와 메모리를 얼마나 줄이는지 계산한다.

**쓰이는 곳:** 사전학습한 모델이 지시를 따르는 대화형 모델이 되려면 SFT를 거쳐야 한다([6-2 다음 토큰 예측, 사전학습, 문맥 창](#lesson-pretraining)). 대부분의 조직은 모델 전체를 다시 학습할 GPU 메모리가 없으므로 LoRA 같은 파라미터 효율적 미세조정으로 자기 데이터에 맞춘 모델을 만든다.

**본문 절:** SFT: 지시를 따르도록 학습하기 · 전체 미세조정의 메모리 비용 · LoRA · QLoRA

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` LoRA의 파라미터 수와 낮은 랭크 근사

**서술형**

- `d1` LoRA에서 $\Delta W = BA$($B$는 $d \times r$, $A$는 $r \times k$)로 나타내면 학습 파라미터 수가 $\Delta W$를 직접 학습할 때보다 얼마나 줄어드는지 $d = k = 4096$, $r = 8$로 계산하고, $B$를 0으로 초기화하는 이유를 쓰라.
- `d2` 전체 미세조정에서 파라미터 하나당 약 16바이트가 필요한 이유를 쓰고, QLoRA가 LoRA에 더해 메모리를 줄이는 방법을 쓰라.

**참고 자료**

- [Hu et al. (2021) — LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) — LoRA 원 논문: 그림 1에 구조가 있다 (영문)
- [Dettmers et al. (2023) — QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) — NF4, 이중 양자화, 페이지드 옵티마이저 (영문)
- [Hugging Face PEFT 문서](https://huggingface.co/docs/peft/index) — LoRA를 실제 모델에 적용하는 라이브러리 (영문)

<a id="lesson-preference-learning"></a>

### 4. 선호도 학습: RLHF와 DPO

핵심 · 45분 · [본문 원본](../../src/content/modules/llm-training/preference-learning.ts) · [실습 원본](../../src/content/modules/llm-training/labs/preference-learning.ts)

**학습 목표:** SFT·RLHF·DPO의 데이터와 목적함수의 차이, 보상 모델과 KL 페널티의 역할을 설명하고, DPO 손실을 계산하며 $\beta$가 클수록 모델이 기준 모델 근처에 머무는 이유를 설명한다.

**쓰이는 곳:** 대화형 LLM은 SFT 뒤에 선호도 학습을 거쳐 사람이 선호하는 응답을 생성하도록 조정된다. 보상 해킹, 아첨 같은 LLM의 문제가 이 단계에서 생기므로, 목적함수의 구조를 알아야 이런 문제의 원인을 설명하고 평가할 수 있다([6-3 환각과 한계](6-3-llm-systems.md#lesson-hallucination)).

**본문 절:** SFT 다음 단계 · RLHF: 보상 모델과 PPO · DPO · 선호도 학습의 한계

**구성:** 확인 문제 7 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3 · 이미지 1

**실습**

- `ex1` DPO 손실과 KL 페널티 아래의 최적 정책

**서술형**

- `d1` SFT, RLHF, DPO가 각각 어떤 데이터로 무엇을 학습하는지 쓰고, RLHF 목적함수에서 KL 페널티를 없애면 생기는 문제를 쓰라.
- `d2` DPO 손실의 괄호 안 값이 커질수록 손실이 작아지는 이유를 $\sigma$와 $-\log$로 쓰고, $\beta$를 크게 하면 모델이 기준 모델 근처에 머무는 이유를 손실의 기울기로 쓰라.

**참고 자료**

- [Ouyang et al. (2022) — Training language models to follow instructions with human feedback (InstructGPT)](https://arxiv.org/abs/2203.02155) — 그림 2에 SFT, 보상 모델, PPO의 세 단계가 있다 (영문)
- [Rafailov et al. (2023) — Direct Preference Optimization](https://arxiv.org/abs/2305.18290) — 4절: β가 기준 정책에서 벗어나는 정도를 조절한다 (영문)
- [Hugging Face — Illustrating RLHF](https://huggingface.co/blog/rlhf) — RLHF 파이프라인을 그림으로 정리한 블로그 (영문)

<a id="lesson-prompt-design"></a>

### 5. 프롬프트 설계

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-training/prompt-design.ts) · [실습 원본](../../src/content/modules/llm-training/labs/prompt-design.ts)

**학습 목표:** 역할, 출력 형식, Few-shot 예시, 불확실성 허용, 구분자 원칙으로 프롬프트를 작성하고, CoT·Self-Consistency·구조화 출력의 원리와 탈옥·프롬프트 인젝션의 차이를 설명한다.

**쓰이는 곳:** LLM 응용의 동작은 모델의 가중치를 바꾸지 않고 프롬프트만으로 정하는 경우가 많다. 같은 모델이라도 프롬프트가 조건을 얼마나 명시하는지에 따라 출력의 형식과 정확도가 달라지며, 이 레슨의 원칙은 RAG의 프롬프트 조립([6-3 RAG 파이프라인](6-3-llm-systems.md#lesson-rag))과 에이전트의 도구 호출([6-3 도구 호출과 에이전트 루프](6-3-llm-systems.md#lesson-agents))에 그대로 쓰인다.

**본문 절:** 프롬프트와 출력 분포 · 설계 원칙 · Chain-of-Thought · Self-Consistency · 구조화 출력 · 원칙을 적용한 프롬프트 · 탈옥과 프롬프트 인젝션

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 5

**실습**

- `ex1` 구분자 탈출 막기, 출력 계약 검사, 다수결

**서술형**

- `d1` CoT가 다단계 문제의 정답률을 높이는 이유를 자기회귀 생성의 관점에서 설명하고, Self-Consistency의 다수결이 오답을 고르게 되는 조건을 쓰라.
- `d2` 탈옥과 간접 프롬프트 인젝션을 공격자, 입력 경로, 공격 대상으로 구분해 설명하고, 구분자로 데이터를 감싸는 방법의 효과와 한계를 쓰라.

**참고 자료**

- [Anthropic — Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — 명확한 지시, 예시, XML 태그 구분자, CoT를 다루는 공식 가이드 (영문)
- [OpenAI — Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering) — 같은 원칙을 정리한 OpenAI의 가이드 (영문)
- [Wei et al. (2022) — Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903) — CoT 프롬프트를 제안한 논문. 그림 1이 본문 그림의 사과 문제다 (영문)
- [Wang et al. (2022) — Self-Consistency Improves Chain of Thought Reasoning in Language Models](https://arxiv.org/abs/2203.11171) — 여러 CoT 풀이의 다수결로 정답률을 높인 논문 (영문)
- [Greshake et al. (2023) — Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) — 간접 프롬프트 인젝션을 체계적으로 분석한 논문 (영문)

## 보충 레슨

<a id="lesson-llm-architectures"></a>

### 6. LLM 구조: BERT, GPT, T5

보충 · 35분 · [본문 원본](../../src/content/modules/llm-training/llm-architectures.ts) · [실습 원본](../../src/content/modules/llm-training/labs/llm-architectures.ts)

**학습 목표:** Encoder-only(BERT, MLM), Decoder-only(GPT, 다음 토큰 예측), Encoder-Decoder(T5, text-to-text) 구조의 차이를 attention 마스크로 설명하고, 대형 LLM이 Decoder-only 구조를 주로 쓰는 이유와 창발 능력에 대한 반론을 설명한다.

**쓰이는 곳:** 문장 분류와 임베딩에는 Encoder-only 모델을, 대화와 글 생성에는 Decoder-only 모델을 쓰는 것처럼, 과제에 맞는 모델을 고르려면 구조의 차이를 알아야 한다. RAG에서 문서를 벡터로 바꾸는 임베딩 모델([6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval))은 주로 Encoder-only 구조이고, 이 모듈에서 다루는 LLM은 Decoder-only 구조다.

**본문 절:** Encoder-only: BERT · Decoder-only: GPT · Encoder-Decoder: T5 · 세 구조의 비교 · 대형 LLM이 Decoder-only 구조를 쓰는 이유 · 창발 능력과 In-Context Learning

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 그림 3 · 이미지 1

**실습**

- `ex1` GPT(CLM)와 BERT(MLM)의 학습 문제와 attention 마스크

**서술형**

- `d1` BERT와 GPT의 학습 목적함수와 attention 마스크를 비교하고, 대화 생성 모델에 BERT식 양방향 마스크를 쓰지 않는 이유를 쓰라.
- `d2` 창발 능력이 무엇인지 스케일링 법칙의 손실 곡선과 비교해 설명하고, Schaeffer et al. (2023)의 반론을 평가 지표의 관점에서 쓰라.

**참고 자료**

- [Devlin et al. (2018) — BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) — MLM과 BERT를 제안한 논문 (영문)
- [Jay Alammar — The Illustrated BERT, ELMo, and co.](https://jalammar.github.io/illustrated-bert/) — BERT의 사전학습과 미세조정을 그림으로 설명한다 (영문)
- [Raffel et al. (2020) — Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (T5)](https://arxiv.org/abs/1910.10683) — T5와 text-to-text 형식을 제안한 논문. 그림 1이 본문 그림이다 (영문)
- [Wei et al. (2022) — Emergent Abilities of Large Language Models](https://arxiv.org/abs/2206.07682) — 창발 능력을 정의하고 사례를 정리한 논문 (영문)
- [Schaeffer et al. (2023) — Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) — 창발 능력이 평가 지표의 선택에서 생길 수 있다는 반론 (영문)

<a id="lesson-scaling-laws"></a>

### 7. 스케일링 법칙

보충 · 40분 · [본문 원본](../../src/content/modules/llm-training/scaling-laws.ts) · [실습 원본](../../src/content/modules/llm-training/labs/scaling-laws.ts)

**학습 목표:** $L(N, D) \approx E + A/N^\alpha + B/D^\beta$, $C \approx 6ND$, $D \approx 20N$으로 컴퓨트 예산에 맞는 모델 크기와 데이터 양을 계산하고, 실무의 과잉학습(overtraining)과 스케일링 법칙이 경험적 적합이라는 한계를 설명한다.

**쓰이는 곳:** 대형 모델의 학습에는 많은 비용이 들기 때문에, 작은 모델의 실험 결과로 큰 모델의 손실을 예측해 모델 크기와 학습 데이터의 양을 미리 정한다. 공개 모델의 파라미터 수와 학습 토큰 수를 보고 그 모델이 컴퓨트 최적인지, 추론 비용을 줄이기 위해 과잉학습했는지 판단할 때도 이 레슨의 식을 쓴다.

**본문 절:** 멱법칙 · 손실의 분해 · 컴퓨트 최적 배분 · 과잉학습

**구성:** 확인 문제 7 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 2 · 이미지 2

**실습**

- `ex1` 스케일링 법칙으로 컴퓨트 최적 모델 크기 찾기

**서술형**

- `d1` 컴퓨트 예산 $C$가 주어졌을 때 $C \approx 6ND$와 $D \approx 20N$으로 최적 모델 크기 $N$과 토큰 수 $D$를 구하는 과정을 쓰고, 7B 모델의 컴퓨트 최적 토큰 수와 필요한 컴퓨트를 계산하라. 실무에서 이 비율보다 작은 모델을 더 많은 토큰으로 학습시키는 이유도 쓰라.
- `d2` 스케일링 법칙이 물리 법칙이 아니라 경험적 적합이라는 말의 의미를 쓰고, 이 식을 쓸 때 주의할 점 세 가지를 쓰라.

**참고 자료**

- [Hoffmann et al. (2022) — Training Compute-Optimal Large Language Models (Chinchilla)](https://arxiv.org/abs/2203.15556) — 컴퓨트 최적 배분 D ≈ 20N을 제시한 논문. 그림 1과 표 3이 근거다 (영문)
- [Kaplan et al. (2020) — Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) — 언어 모델의 멱법칙 관계를 처음 체계적으로 측정한 논문. 그림 1이 본문 그림이다 (영문)
- [Besiroglu et al. (2024) — Chinchilla Scaling: A replication attempt](https://arxiv.org/abs/2404.10102) — Chinchilla 식을 다시 추정한 논문. 실습의 상수 출처다 (영문)

<a id="lesson-kv-cache-rope"></a>

### 8. 생성 단계의 트랜스포머: KV 캐시와 RoPE

보충 · 45분 · [본문 원본](../../src/content/modules/llm-training/kv-cache-rope.ts) · [실습 원본](../../src/content/modules/llm-training/labs/kv-cache-rope.ts)

**학습 목표:** 생성할 때 KV 캐시가 저장하는 값과 스텝마다 새로 계산하는 값을 구분하고 결과가 같은 이유를 설명하며, KV 캐시의 메모리를 계산하고, RoPE가 회전으로 상대 거리만 attention 점수에 반영하는 원리를 설명한다.

**쓰이는 곳:** LLM API의 응답 속도와 GPU 메모리 사용량은 대부분 생성 단계의 계산 방식으로 정해진다. 긴 문맥이나 많은 동시 요청을 처리할 때 메모리가 부족해지는 원인을 KV 캐시의 크기로 계산하고, 모델 설정에 나오는 GQA와 RoPE가 무엇을 바꾸는지 판단할 때 이 레슨의 내용을 쓴다.

**본문 절:** 학습과 생성의 차이 · KV 캐시 · 캐시를 쓴 결과의 검증 · KV 캐시의 메모리 · RoPE: 회전으로 상대 거리를 표현하는 위치 인코딩

**구성:** 확인 문제 7 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 4

**실습**

- `ex1` KV 캐시로 한 토큰씩 생성하기와 RoPE의 상대 거리

**서술형**

- `d1` KV 캐시가 없을 때 101번째 토큰을 생성하면서 낭비되는 계산이 무엇인지 쓰고, 캐시를 써도 결과가 같은 이유를 causal mask로 설명하라. 캐시가 차지하는 메모리를 결정하는 요소와 GQA가 메모리를 줄이는 원리도 쓰라.
- `d2` RoPE가 Query와 Key를 어떻게 변환하는지 쓰고, 회전한 두 벡터의 내적이 상대 거리에만 의존하는 이유를 회전 행렬의 성질로 설명하라.

**참고 자료**

- [Hugging Face Transformers — Caching (KV cache)](https://huggingface.co/docs/transformers/main/en/cache_explanation) — Transformers 라이브러리에서 KV 캐시가 동작하는 방식 (영문)
- [EleutherAI — Rotary Embeddings: A Relative Revolution](https://blog.eleuther.ai/rotary-embeddings/) — RoPE의 유도와 구현 (영문)
- [Su et al. (2021) — RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) — RoPE를 제안한 논문 (영문)

<a id="lesson-rl-basics"></a>

### 9. 강화학습 기초

보충 · 45분 · [본문 원본](../../src/content/modules/llm-training/rl-basics.ts) · [실습 원본](../../src/content/modules/llm-training/labs/rl-basics.ts)

**학습 목표:** 에이전트, 환경, 상태, 행동, 보상, 정책, 이득과 MDP, 벨만 방정식, 탐색과 활용의 균형을 설명하고, 가치 기반 방법(Q-Learning, DQN)과 정책 기반 방법(정책 경사, Actor-Critic, PPO)을 구분한다.

**쓰이는 곳:** RLHF([6-2 선호도 학습: RLHF와 DPO](#lesson-preference-learning))는 LLM을 강화학습의 정책으로 보고 보상 모델의 점수를 최대화하도록 학습한다. 추론 모델의 학습과 에이전트의 행동 최적화도 같은 틀을 쓰므로, 이 레슨의 용어와 방법을 알아야 PPO나 GRPO 같은 알고리즘이 무엇을 최적화하는지 이해할 수 있다.

**본문 절:** 강화학습의 구성 요소 · MDP와 벨만 방정식 · 탐색과 활용 · 가치 기반 방법과 정책 기반 방법

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 4

**실습**

- `ex1` 점진적 평균과 벨만 방정식으로 Q값 배우기

**서술형**

- `d1` 강화학습의 에이전트, 상태, 행동, 정책, 보상을 RLHF에 각각 대응시키고, 응답이 끝난 뒤에만 보상이 주어질 때 이득이 어떻게 계산되는지 예를 들어 쓰라.
- `d2` 벨만 방정식이 나타내는 재귀 관계를 설명하고, 가치 기반 방법(Q-Learning, DQN)과 정책 기반 방법(정책 경사, Actor-Critic)이 각각 무엇을 학습하는지 비교하라. PPO가 어느 계열인지도 쓰라.

**참고 자료**

- [OpenAI Spinning Up — Key Concepts in RL](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) — 강화학습의 용어와 수식을 정리한 자료 (영문)
- [Hugging Face Deep RL Course — Unit 1](https://huggingface.co/learn/deep-rl-course/unit1/introduction) — 강화학습의 기본 개념을 실습과 함께 다루는 코스. Unit 2가 Q-Learning이다 (영문)

<a id="lesson-test-time-compute"></a>

### 10. 추론 시간 계산: 자기일관성, best-of-n, 검증기

보충 · 35분 · [본문 원본](../../src/content/modules/llm-training/test-time-compute.ts) · [실습 원본](../../src/content/modules/llm-training/labs/test-time-compute.ts)

**학습 목표:** CoT가 추론 계산량을 늘리는 원리를 설명하고, 자기일관성(다수결)의 정답률을 이항분포로, 검증기를 쓰는 best-of-n의 정답률과 그 한계를 TPR·FPR로 계산한다.

**쓰이는 곳:** 추론 모델은 답을 내기 전에 긴 추론을 생성하거나 여러 후보를 만들어 고르는 방식으로 정답률을 높인다. 이 방법은 요청마다 비용과 지연시간을 늘리므로, 어떤 문제에서 계산을 더 쓸 가치가 있는지, 검증기의 품질이 결과의 상한을 어떻게 정하는지 계산할 수 있어야 한다.

**본문 절:** 생성 토큰과 계산량 · 자기일관성: 다수결 · best-of-n과 검증기 · 비용과 문제 난이도

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 다수결과 best-of-n의 정답률 계산기

**서술형**

- `d1` 한 번 정답률이 $p$인 문제를 $n$번 풀어 다수결할 때 $p > 0.5$와 $p < 0.5$에서 $n$을 늘리면 각각 어떻게 되는지 설명하라. 검증기로 고르는 best-of-n의 정답률이 $n$을 늘려도 $\frac{p\cdot\text{TPR}}{p\cdot\text{TPR} + (1-p)\cdot\text{FPR}}$을 넘지 못하는 이유도 쓰라.

**참고 자료**

- [Wang et al. (2022) — Self-Consistency Improves Chain of Thought Reasoning in Language Models](https://arxiv.org/abs/2203.11171) — 자기일관성(다수결)을 제안한 논문 (영문)
- [Snell et al. (2024) — Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters](https://arxiv.org/abs/2408.03314) — 추론 시간 계산의 배분과 문제 난이도의 관계를 분석한 논문 (영문)
- [Gao et al. (2023) — Scaling Laws for Reward Model Overoptimization](https://arxiv.org/abs/2210.10760) — best-of-n과 강화학습에서 보상 모델을 과도하게 최적화할 때의 현상을 측정한 논문 (영문)

## 심화 레슨

<a id="lesson-dpo-derivation"></a>

### 11. DPO의 유도

심화 · 30분 · [본문 원본](../../src/content/modules/llm-training/dpo-derivation.ts) · [실습 원본](../../src/content/modules/llm-training/labs/dpo-derivation.ts)

**학습 목표:** KL 규제 보상 최대화의 최적 정책 $\pi^* \propto \pi_{ref}e^{r/\beta}$를 유도하고, 보상의 재매개변수화와 Bradley–Terry 모델에서 분배함수가 소거되어 DPO 손실이 나오는 과정을 설명하며, 그 가정이 깨질 때의 약점을 말할 수 있다.

**쓰이는 곳:** DPO는 보상 모델과 강화학습 없이 선호 데이터만으로 RLHF와 같은 목적함수를 최적화한다. 유도 과정을 알면 $\beta$가 학습에 미치는 영향, DPO에서 선호 응답의 확률까지 떨어지는 현상, IPO·KTO·SimPO 같은 후속 방법이 바꾼 가정을 판단할 수 있다.

**본문 절:** 1단계: KL 규제 목적함수의 최적 정책 · 2단계: 보상을 정책으로 다시 쓰기 · 3단계: Bradley–Terry에서 $Z$가 사라진다 · DPO 손실의 기울기 · 가정이 성립하지 않을 때

**구성:** 확인 문제 6 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` KL 규제 최적 정책과 DPO의 암묵적 보상

**서술형**

- `d1` KL 규제 목적함수 $\mathbb{E}_\pi[r] - \beta D_{KL}(\pi \Vert \pi_{ref})$를 $\beta\log Z - \beta D_{KL}(\pi \Vert \pi^*)$로 다시 써서 최적 정책을 구하고, 보상을 정책으로 다시 쓴 식을 Bradley–Terry 모델에 넣을 때 분배함수 $Z$가 사라지는 이유를 설명하라.

**참고 자료**

- [Rafailov et al. (2023) — Direct Preference Optimization: Your Language Model is Secretly a Reward Model](https://arxiv.org/abs/2305.18290) — DPO를 제안한 논문. 4절과 부록 A에 유도가 있다 (영문)
- [Azar et al. (2023) — A General Theoretical Paradigm to Understand Learning from Human Preferences](https://arxiv.org/abs/2310.12036) — 결정적 선호에서 DPO가 과적합하는 이유와 IPO를 제시한 논문 (영문)

<a id="lesson-policy-gradient"></a>

### 12. 정책 경사와 PPO

심화 · 35분 · [본문 원본](../../src/content/modules/llm-training/policy-gradient.ts) · [실습 원본](../../src/content/modules/llm-training/labs/policy-gradient.ts)

**학습 목표:** 로그 미분 트릭으로 정책 경사를 유도하고, 기준값이 편향 없이 분산을 줄이는 이유를 증명하며, PPO 클리핑 목적함수의 비대칭과 RLHF의 PPO가 쓰는 구성 요소(KL 벌점, 가치 함수)를 설명한다.

**쓰이는 곳:** RLHF의 PPO와 추론 모델 학습에 쓰는 GRPO는 모두 정책 경사에 기준값과 클리핑을 더한 방법이다. 학습 설정의 KL 계수, 클리핑 범위 $\varepsilon$, 묶음 크기가 무엇을 조절하는지 판단하고, 학습 중 정책이 불안정해질 때 원인을 찾으려면 이 레슨의 유도가 필요하다.

**본문 절:** 로그 미분 트릭: 보상을 미분하지 않고 기울기 구하기 · 기준값: 기댓값을 유지하고 분산을 줄인다 · PPO: 같은 데이터로 여러 번 갱신할 때의 제한

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 2

**실습**

- `ex1` 정책 경사의 기준값과 PPO 클리핑

**서술형**

- `d1` 로그 미분 트릭으로 정책 경사 $\nabla\mathbb{E}[R] = \mathbb{E}[R\,\nabla\log\pi]$를 유도하고, 기준값 $b$를 빼도 기울기의 기댓값이 변하지 않는 이유를 보여라. PPO 클리핑 목적함수에서 $\min$이 만드는 비대칭도 설명하라.

**참고 자료**

- [Schulman et al. (2017) — Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) — PPO와 클리핑 목적함수를 제안한 논문 (영문)
- [OpenAI Spinning Up — Intro to Policy Optimization](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html) — 정책 경사 정리와 기준값의 유도 (영문)
- [Shao et al. (2024) — DeepSeekMath (GRPO)](https://arxiv.org/abs/2402.03300) — 묶음 평균을 기준값으로 쓰는 GRPO를 제안한 논문 (영문)

## 백지 복습

1. 다음 토큰 예측이 사람의 라벨 없이 학습 예제를 만드는 원리를 쓰고, 토큰 $T$개짜리 문서에서 예측 문제가 몇 개 만들어지는지 쓰라. 평균 손실이 2.0 nats일 때 perplexity도 계산하라.
2. logit $[3, 2, 1, 0, -1]$에서 $T = 0.5$와 $T = 2$의 분포가 어떻게 다른지 쓰고, top-k와 top-p가 후보를 고르는 기준의 차이를 쓰라.
3. 사전학습, SFT, 선호 학습이 각각 어떤 데이터로 무엇을 학습하는지 쓰고, $d = k = 4096$, $r = 16$일 때 LoRA의 학습 파라미터 수를 계산하라.
4. Bradley–Terry 모델의 선호 확률과 보상 모델의 손실을 쓰고, RLHF와 DPO에서 KL 규제가 필요한 이유를 보상 해킹으로 쓰라.
5. CoT가 다단계 문제의 정답률을 높이는 이유를 자기회귀 생성으로 쓰고, 구분자로 데이터를 감싸도 프롬프트 인젝션을 완전히 막지 못하는 이유를 쓰라.

## 과제: LLM 해부 실험 노트

저장 키 `llm-anatomy` · 만점 10점 · [과제 원본](../../src/content/modules/llm-training/assignment.ts)

같은 logit이 temperature와 top-k·top-p 필터를 거치며 어떻게 바뀌는지 표로 정리하고, 이 과정의 학습 자료로 직접 학습한 작은 언어 모델로 디코딩 설정별 생성 결과를 비교합니다. Chinchilla 스케일링 법칙으로 최적 모델 크기를 계산해 공개 모델과 비교하고, 환각 사례의 유형과 원인을 학습 과정과 연결해 분석한 뒤 InstructGPT의 학습 과정을 정리합니다.

**핵심** 항목 다섯 개는 과제 안내와 이 모듈의 레슨으로 풀 수 있고, 채점 기준도 이 다섯 항목만 봅니다. **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.

### 요구사항

- temperature 3가지와 필터 5가지를 조합한 분포 표의 TODO(필터 적용)를 채우고, 행마다 확률 합이 1이며 남는 후보 수가 맞는지 확인한다.
- 작은 언어 모델로 설정별(Greedy · T=0.7 · T=1.5 + top-p 0.9) 생성을 반복해 distinct-2와 품질, 반복 사례를 기록한다.
- $C = 10^{22}$, $10^{24}$에서 Chinchilla 최적 $N$, $D$를 풀이와 함께 계산하고, 공개 모델 하나의 $D/N$을 근거로 과잉학습 여부를 논평한다.
- 환각 사례 다섯 개를 유형별로 분류하고, 원인을 학습 과정과 연결해 설명하며, 완화책을 제안한다.
- InstructGPT 세 단계(SFT · 보상 모델 · PPO)의 데이터 · 모델 · 목적함수를 정리한다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| 디코딩 분포 표 | 핵심 | 코드 `decoding-code`, 답안 `decoding-answer`(최소 120자) |
| 작은 언어 모델로 생성 실험하기 | 핵심 | 코드 `generate-model`, 코드 `generate-experiment`, 답안 `generate-answer`(최소 330자) |
| 스케일링 법칙 계산 | 핵심 | 코드 `scaling-code`, 답안 `scaling-answer`(최소 150자) |
| 환각 사례 분류 | 핵심 | 답안 `hallucination-answer`(최소 400자) |
| InstructGPT 학습 과정 재구성 | 핵심 | 답안 `instructgpt-answer`(최소 300자) |
| 심화: DPO·PPO·추론 시간 계산·투기적 디코딩 실험 | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 채점 기준

| 기준 | 배점 | 확인 내용 |
| --- | ---: | --- |
| 계산 정확성 | 3 | 디코딩 분포 표와 Chinchilla 최적 N, D 계산이 정확합니다. |
| 생성 실험 설계와 기록 | 2 | 설정별로 여러 번 생성해 다양성과 품질을 비교하고, 반복 사례를 기록했습니다. |
| 과잉학습 판정의 근거와 출처 | 2 | D/N을 최적 비율과 비교하고, 추론 비용 등 이유를 출처와 함께 논평했습니다. |
| 환각의 분류, 원인, 완화책 | 2 | 유형 분류의 근거가 분명하고, 원인을 학습 과정과 연결해 설명했으며, 원인에 맞는 완화책을 제안했습니다. |
| 논문 이해 | 1 | 세 단계의 데이터·모델·목적함수를 정확히 정리했습니다. |

### 자동 테스트

- `decoding`: 필터를 실제로 적용했다(마지막 행: T=2.0, top-p 0.9)
- `generate`: 4-gram 언어 모델의 출력이 확률분포(로그)이고 Greedy 생성이 결정적이다
- `scaling`: chinchilla_optimal: N = √(C/120), D = 20N
- `scaling`: 공개 모델의 N, D를 정했다

### 선택 심화 문제

- `ch1` 빔 서치와 길이 정규화
- `ch2` DPO 기울기를 유도하고 작은 정책을 직접 학습시키기
