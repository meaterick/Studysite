import type { SectionMeta } from "../types";

// Week 6 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "pretraining": {
    "tier": "core",
    "goal": "사전학습의 다음 토큰 예측 손실 $L = -\\frac{1}{T}\\sum_t \\log P(x_t \\mid x_{<t})$과 perplexity $e^L$의 의미를 설명하고, 라벨 없이 학습 데이터가 만들어지는 이유를 말할 수 있다.",
    "checks": [
      {
        "id": "w6-pretraining-c1",
        "question": "평균 손실이 $L = \\ln 20 \\approx 3.0$ nats인 언어모델의 perplexity는?",
        "choices": [
          "약 3",
          "약 20",
          "약 $e^{20}$",
          "약 0.05"
        ],
        "answer": 1,
        "explanation": "perplexity $= e^{L} = e^{\\ln 20} = 20$. 매 스텝 평균 20개 후보 사이에서 헷갈리는 수준이다."
      },
      {
        "id": "w6-pretraining-c2",
        "question": "어휘 크기 50,000에서 모든 토큰에 같은 확률을 주는(학습 전) 모델의 perplexity는?",
        "choices": [
          "1",
          "약 10.8",
          "50,000",
          "0"
        ],
        "answer": 2,
        "explanation": "손실은 $\\ln 50000 \\approx 10.8$이고 perplexity는 $e^{10.8} \\approx 50000$, 즉 어휘 크기와 같다."
      },
      {
        "id": "w6-pretraining-c3",
        "question": "사전학습에 사람이 붙인 정답 레이블이 필요 없는 이유는?",
        "choices": [
          "사전학습은 손실함수가 없기 때문에",
          "원문에서 다음에 실제로 나온 토큰이 곧 정답이기 때문에",
          "모델이 스스로 정답을 지어내기 때문에",
          "평가를 하지 않기 때문에"
        ],
        "answer": 1,
        "explanation": "원문을 한 칸 밀면 (문맥, 다음 토큰) 쌍이 자동으로 생긴다. 자기지도학습이다."
      }
    ],
    "quizIds": [
      "w6-q1"
    ],
    "references": [
      {
        "title": "Karpathy — Intro to Large Language Models (1시간 영상)",
        "url": "https://www.youtube.com/watch?v=zjkBMFhNj_g",
        "note": "사전학습→파인튜닝→사용까지 LLM 전체 그림 (영문, 자막)"
      },
      {
        "title": "Stanford CS336 — Language Modeling from Scratch",
        "url": "https://stanford-cs336.github.io/",
        "note": "LLM을 처음부터 만드는 강의: 데이터·학습·스케일링 파트"
      }
    ]
  },
  "architectures": {
    "tier": "core",
    "goal": "BERT(Encoder-only, MLM)·GPT(Decoder-only, 다음 토큰 예측)·T5(Encoder-Decoder, text-to-text)의 차이와 대형 LLM이 Decoder-only로 수렴한 이유를 설명하고, 창발 능력과 그에 대한 반론을 말할 수 있다.",
    "checks": [
      {
        "id": "w6-architectures-c1",
        "question": "문장 \"나는 [MASK]를 먹었다\"에서 가려진 단어를 앞뒤 문맥을 모두 보고 맞히도록 학습하는 모델은?",
        "choices": [
          "GPT",
          "BERT",
          "T5의 디코더",
          "RNN 언어모델"
        ],
        "answer": 1,
        "explanation": "BERT의 Masked LM은 양방향 문맥을 본다. GPT는 앞쪽 문맥만 본다."
      },
      {
        "id": "w6-architectures-c2",
        "question": "T5가 번역·요약·분류를 하나의 모델로 처리하는 방법은?",
        "choices": [
          "태스크마다 다른 출력층을 붙인다",
          "모든 태스크를 \"텍스트를 넣으면 텍스트가 나온다\"는 형식으로 통일하고 접두어로 태스크를 지시한다",
          "태스크마다 다른 모델을 학습한다",
          "분류 과제만 처리한다"
        ],
        "answer": 1,
        "explanation": "예: \"summarize: ...\" → 요약문, 분류도 라벨을 텍스트로 출력한다."
      },
      {
        "id": "w6-architectures-c3",
        "question": "창발 능력에 대한 설명으로 가장 적절한 것은?",
        "choices": [
          "스케일링 법칙의 손실 곡선도 갑자기 꺾인다",
          "특정 과제 성능이 규모의 임계점에서 급격히 뛰는 현상이지만, 일부는 정답/오답만 세는 평가 지표 때문에 생긴 착시라는 반론이 있다",
          "작은 모델에서만 나타난다",
          "파인튜닝을 해야만 나타난다"
        ],
        "answer": 1,
        "explanation": "손실은 매끄럽게 줄어도 이산적인 지표로 재면 계단처럼 보일 수 있다(Schaeffer et al., 2023)."
      }
    ],
    "quizIds": [
      "w6-q11",
      "w6-q12",
      "w6-q13",
      "w6-q14"
    ],
    "references": [
      {
        "title": "Jay Alammar — The Illustrated BERT, ELMo, and co.",
        "url": "https://jalammar.github.io/illustrated-bert/",
        "note": "BERT의 사전학습(MLM)과 활용을 그림으로 (영문)"
      },
      {
        "title": "Raffel et al. (2019) — Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (T5)",
        "url": "https://arxiv.org/abs/1910.10683",
        "note": "그림 1의 text-to-text 예시만 봐도 충분하다"
      },
      {
        "title": "Schaeffer et al. (2023) — Are Emergent Abilities of Large Language Models a Mirage?",
        "url": "https://arxiv.org/abs/2304.15004",
        "note": "창발 능력이 평가 지표의 선택에서 생길 수 있다는 반론 (심화)"
      }
    ]
  },
  "scaling-laws": {
    "tier": "core",
    "goal": "$L(N, D) \\approx E + A/N^\\alpha + B/D^\\beta$, $C \\approx 6ND$, $D \\approx 20N$을 이용해 컴퓨트 예산에서 최적 모델 크기와 데이터 양을 계산하고, 실무의 과잉학습(overtraining)과 스케일링 법칙이 경험적 적합이라는 한계를 설명할 수 있다.",
    "checks": [
      {
        "id": "w6-scaling-laws-c1",
        "question": "7B 파라미터 모델을 1.4조($1.4 \\times 10^{12}$) 토큰으로 학습할 때 컴퓨트 $C \\approx 6ND$는?",
        "choices": [
          "약 $5.9 \\times 10^{22}$ FLOPs",
          "약 $9.8 \\times 10^{21}$ FLOPs",
          "약 $5.9 \\times 10^{21}$ FLOPs",
          "약 $4.2 \\times 10^{13}$ FLOPs"
        ],
        "answer": 0,
        "explanation": "$6 \\times 7 \\times 10^{9} \\times 1.4 \\times 10^{12} = 5.88 \\times 10^{22}$. $D/N = 200$이니 Chinchilla 최적(20)보다 10배 과잉학습이다."
      },
      {
        "id": "w6-scaling-laws-c2",
        "question": "컴퓨트 예산이 100배가 되면 Chinchilla 최적 모델 크기 $N$은 약 몇 배가 되는가? ($C \\approx 6ND$, $D \\approx 20N$)",
        "choices": [
          "100배",
          "50배",
          "10배",
          "변하지 않는다"
        ],
        "answer": 2,
        "explanation": "$C \\approx 120N^2$이므로 $N \\propto \\sqrt{C}$, $\\sqrt{100} = 10$배. 데이터도 10배 늘린다."
      },
      {
        "id": "w6-scaling-laws-c3",
        "question": "Llama 계열처럼 컴퓨트 최적보다 작은 모델에 훨씬 많은 토큰을 학습시키는 주된 이유는?",
        "choices": [
          "학습 비용을 줄이려고",
          "배포 후 수없이 반복되는 추론 비용을 줄이려고",
          "스케일링 법칙이 틀렸기 때문에",
          "데이터가 부족해서"
        ],
        "answer": 1,
        "explanation": "학습은 한 번이지만 추론은 계속된다. Chinchilla 식으로 계산하면 같은 컴퓨트에서 8B 모델은 최적점보다 손실이 약 0.02 높을 뿐이다."
      },
      {
        "id": "w6-scaling-laws-c4",
        "question": "스케일링 법칙 $L(N, D) \\approx E + A/N^\\alpha + B/D^\\beta$에 대한 설명으로 가장 정확한 것은?",
        "choices": [
          "어떤 모델·데이터에서도 성립하는 물리 법칙이라, 계산값이 도달 가능한 최저 손실이다",
          "특정 구조·데이터·학습 설정에서 관찰한 결과에 맞춘 경험식이라, 실험 범위 밖 외삽이나 설정 변화에서는 틀릴 수 있다",
          "특정 과제의 정확도를 정확히 예측해 준다",
          "$E$는 실험으로 직접 측정한 값이다"
        ],
        "answer": 1,
        "explanation": "스케일링 법칙은 사전학습 손실에 대한 경험적 적합이다. 지수·상수는 구조·데이터 분포·학습률 스케줄에 따라 달라지고(Kaplan과 Chinchilla의 최적 비율이 다른 이유 중 하나), 다운스트림 능력은 손실만으로 직접 예측되지 않는다. $E$도 곡선을 맞춰 얻은 추정치다."
      }
    ],
    "quizIds": [
      "w6-q2"
    ],
    "references": [
      {
        "title": "Hoffmann et al. (2022) — Training Compute-Optimal Large Language Models (Chinchilla)",
        "url": "https://arxiv.org/abs/2203.15556",
        "note": "그림 1과 표 3: D≈20N의 근거"
      },
      {
        "title": "Kaplan et al. (2020) — Scaling Laws for Neural Language Models",
        "url": "https://arxiv.org/abs/2001.08361",
        "note": "스케일링 법칙의 출발점: 그림 1만 봐도 된다"
      },
      {
        "title": "Besiroglu et al. (2024) — Chinchilla Scaling: A replication attempt",
        "url": "https://arxiv.org/abs/2404.10102",
        "note": "Chinchilla 식의 수정 상수 출처 (심화)"
      }
    ]
  },
  "finetuning-efficiency": {
    "tier": "core",
    "goal": "SFT의 역할과 풀 파인튜닝의 메모리 비용을 설명하고, LoRA($\\Delta W = BA$)·QLoRA·지식 증류·양자화가 각각 무엇을 줄이는지 계산과 함께 말할 수 있다.",
    "checks": [
      {
        "id": "w6-finetuning-efficiency-c1",
        "question": "$d = k = 4096$, $r = 16$인 LoRA의 학습 파라미터 수는 원래 $\\Delta W$의 몇 분의 1인가?",
        "choices": [
          "16분의 1",
          "128분의 1",
          "256분의 1",
          "4096분의 1"
        ],
        "answer": 1,
        "explanation": "$2 \\times 4096 \\times 16 = 131{}072$개, 원래는 $4096^2 \\approx 1{}678$만 개이므로 $4096 / (2 \\times 16) = 128$분의 1."
      },
      {
        "id": "w6-finetuning-efficiency-c2",
        "question": "QLoRA가 LoRA에 더한 것은?",
        "choices": [
          "더 큰 랭크 $r$",
          "고정된 원본 가중치를 4비트로 양자화해 메모리를 줄인 것",
          "강화학습",
          "학생 모델"
        ],
        "answer": 1,
        "explanation": "학습하는 $B, A$는 그대로 두고, 얼려둔 원본 $W_0$를 저비트로 저장한다."
      },
      {
        "id": "w6-finetuning-efficiency-c3",
        "question": "가중치를 INT8에서 INT4로 더 줄일 때 일어나는 일로 옳은 것은?",
        "choices": [
          "메모리는 늘고 정확도는 오른다",
          "메모리는 절반이 되지만 표현할 수 있는 값이 줄어 반올림 오차가 커진다",
          "아무 변화가 없다",
          "학습 파라미터 수가 줄어든다"
        ],
        "answer": 1,
        "explanation": "정규분포 가중치로 실험하면 상대 오차가 INT8 약 1%에서 INT4 약 16%로 커진다. 블록 단위 스케일 등으로 이 오차를 줄인다."
      }
    ],
    "quizIds": [
      "w6-q15",
      "w6-q16",
      "w6-q17",
      "w6-q18"
    ],
    "references": [
      {
        "title": "Hu et al. (2021) — LoRA: Low-Rank Adaptation of Large Language Models",
        "url": "https://arxiv.org/abs/2106.09685",
        "note": "그림 1 하나로 핵심이 보인다"
      },
      {
        "title": "Dettmers et al. (2023) — QLoRA: Efficient Finetuning of Quantized LLMs",
        "url": "https://arxiv.org/abs/2305.14314",
        "note": "NF4·이중 양자화·페이지드 옵티마이저 (심화)"
      },
      {
        "title": "Hugging Face PEFT 문서",
        "url": "https://huggingface.co/docs/peft/index",
        "note": "LoRA를 실제 모델에 몇 줄로 붙이는 라이브러리"
      }
    ]
  },
  "rlhf-dpo": {
    "tier": "core",
    "goal": "SFT·RLHF·DPO의 데이터와 목적함수 차이, 보상모델과 KL 페널티의 역할을 설명하고, DPO 손실을 계산하며 $\\beta$가 클수록 기준 모델 근처에 머무는 이유를 말할 수 있다.",
    "checks": [
      {
        "id": "w6-rlhf-dpo-c1",
        "question": "RLHF 보상모델을 학습하는 데이터의 형태는?",
        "choices": [
          "(지시, 모범답안) 쌍",
          "(프롬프트, 선호 응답, 비선호 응답) 비교",
          "라벨 없는 웹 문서",
          "(이미지, 캡션) 쌍"
        ],
        "answer": 1,
        "explanation": "사람은 절대 점수보다 비교를 더 일관되게 매긴다. SFT는 (지시, 응답) 쌍을 쓴다."
      },
      {
        "id": "w6-rlhf-dpo-c2",
        "question": "$\\beta = 0.1$, 로그확률 비율 차이가 $1.5$일 때 DPO 손실 $-\\log\\sigma(0.15)$는 약?",
        "choices": [
          "0.15",
          "0.54",
          "0.62",
          "0.69"
        ],
        "answer": 2,
        "explanation": "$\\sigma(0.15) \\approx 0.537$, $-\\log 0.537 \\approx 0.62$. 본문 예제와 같다."
      },
      {
        "id": "w6-rlhf-dpo-c3",
        "question": "DPO에서 $\\beta$를 크게 하면?",
        "choices": [
          "모델이 기준 모델에서 더 멀리 벗어나도록 허용된다",
          "작은 로그비율 차이로도 손실이 빨리 0에 가까워져, 모델이 기준 모델 근처에 머문다",
          "보상모델이 필요해진다",
          "손실이 항상 커진다"
        ],
        "answer": 1,
        "explanation": "$\\beta$는 KL 페널티 계수와 같은 역할이다. 최적 정책 $\\pi^* \\propto \\pi_{ref}\\,e^{r/\\beta}$에서 $\\beta$가 클수록 $\\pi^*$가 $\\pi_{ref}$에 가깝다. 학습 초반의 기울기 크기($\\beta/2$)는 오히려 $\\beta$가 클수록 크지만, 작은 로그비율 차이에서 손실이 포화되어 더 멀리 가지 않는다."
      },
      {
        "id": "w6-rlhf-dpo-c4",
        "question": "RLHF 목적함수에서 KL 페널티를 없애면 생기기 쉬운 문제는?",
        "choices": [
          "학습이 전혀 되지 않는다",
          "정책이 보상모델의 허점을 파고드는 보상 해킹",
          "모델 크기가 커진다",
          "토크나이저가 바뀐다"
        ],
        "answer": 1,
        "explanation": "보상모델은 사람 선호의 근사일 뿐이라, 기준 분포에서 멀리 벗어난 이상한 출력에 높은 점수를 줄 수 있다."
      },
      {
        "id": "w6-rlhf-dpo-c5",
        "question": "DPO에 대한 설명으로 가장 정확한 것은?",
        "choices": [
          "보상모델도 기준 모델도 필요 없고, 결과는 PPO 기반 RLHF와 항상 같다",
          "보상모델을 따로 학습하지 않지만 기준 모델 $\\pi_{ref}$는 계속 필요하고, 미리 모은 선호 쌍으로만 학습하는 오프라인 방식이다",
          "강화학습으로 새 응답을 생성하며 보상모델 점수를 최대화한다",
          "선호 데이터 없이 정답 응답만으로 학습한다"
        ],
        "answer": 1,
        "explanation": "DPO는 정책의 로그확률 비율을 암묵적 보상으로 써서 보상모델과 PPO 루프를 없앴다. 이상적인 가정(Bradley–Terry 선호, 충분한 데이터)에서 같은 KL-정규화 목적함수의 최적해를 겨냥하지만, 오프라인 학습이라 실제 결과는 PPO와 다를 수 있고 선호 응답의 확률까지 함께 내려가는 현상도 보고된다."
      }
    ],
    "quizIds": [
      "w6-q3",
      "w6-q5",
      "w6-q7",
      "w6-q9",
      "w6-q10"
    ],
    "references": [
      {
        "title": "Ouyang et al. (2022) — Training language models to follow instructions with human feedback (InstructGPT)",
        "url": "https://arxiv.org/abs/2203.02155",
        "note": "그림 2가 SFT→보상모델→PPO 3단계를 요약한다 (과제 5번)"
      },
      {
        "title": "Rafailov et al. (2023) — Direct Preference Optimization",
        "url": "https://arxiv.org/abs/2305.18290",
        "note": "4절에서 β가 기준 정책으로부터의 이탈을 조절하는 계수임을 확인할 수 있다"
      },
      {
        "title": "Hugging Face — Illustrating RLHF",
        "url": "https://huggingface.co/blog/rlhf",
        "note": "RLHF 파이프라인을 그림으로 정리한 블로그 (영문)"
      }
    ]
  },
  "decoding": {
    "tier": "core",
    "goal": "$\\text{softmax}(z/T)$로 temperature의 효과를 계산하고, greedy·beam search·top-k·top-p·반복 페널티·스톱 토큰의 차이와 지연시간–처리량 트레이드오프를 설명할 수 있다.",
    "checks": [
      {
        "id": "w6-decoding-c1",
        "question": "logit [3, 2, 1, 0, −1]에서 $T \\to 0$이면 샘플링 분포는?",
        "choices": [
          "균등분포",
          "1등 후보에 확률 1(argmax)",
          "logit에 비례",
          "2등 후보에 확률 1"
        ],
        "answer": 1,
        "explanation": "격차가 무한히 벌어져 greedy와 같아진다. $T \\to \\infty$면 균등분포가 된다."
      },
      {
        "id": "w6-decoding-c2",
        "question": "확률이 [0.90, 0.05, 0.03, 0.02]인 분포에 top-p($p = 0.9$)를 적용하면 남는 후보 수는?",
        "choices": [
          "1개",
          "2개",
          "3개",
          "4개"
        ],
        "answer": 0,
        "explanation": "1등의 누적확률이 이미 0.9에 도달하므로 1개만 남는다(본문 구현은 누적값이 $p$ 이상이 되는 첫 지점까지 포함). 분포가 평평하면 후보가 많아진다."
      },
      {
        "id": "w6-decoding-c3",
        "question": "빔 서치가 그리디보다 번역·요약에 유리한 이유는?",
        "choices": [
          "매 스텝 무작위로 고르기 때문에",
          "여러 후보 시퀀스를 동시에 유지해, 첫 선택은 덜 유망해도 전체 확률이 높은 문장을 찾을 수 있기 때문에",
          "계산량이 더 적기 때문에",
          "다양한 출력을 만들기 때문에"
        ],
        "answer": 1,
        "explanation": "예를 들어 작은 확률표 언어모델에서 그리디는 \"나는 그냥 그냥…\"(0.021), 빔 서치는 \"오늘 밥을 먹었다\"(0.342)를 고른다."
      }
    ],
    "quizIds": [
      "w6-q4",
      "w6-q6",
      "w6-q24",
      "w6-q25",
      "w6-q26",
      "w6-q27"
    ],
    "references": [
      {
        "title": "Hugging Face — How to generate text",
        "url": "https://huggingface.co/blog/how-to-generate",
        "note": "greedy·beam·top-k·top-p를 실제 GPT-2로 비교 (과제 2번에 직결)"
      },
      {
        "title": "Holtzman et al. (2019) — The Curious Case of Neural Text Degeneration",
        "url": "https://arxiv.org/abs/1904.09751",
        "note": "top-p(nucleus) 샘플링 제안 논문: 그림 1의 반복 예시"
      }
    ]
  },
  "hallucination": {
    "tier": "core",
    "goal": "환각이 사전학습 목적함수, 드물게 등장한 사실, 사후학습·평가 방식, 디코딩, 컨텍스트 창·지식 컷오프 등 여러 요인에서 생긴다는 점을 설명하고, 완화책이 환각을 줄일 뿐 없애지 못하는 이유를 말할 수 있다.",
    "checks": [
      {
        "id": "w6-hallucination-c1",
        "question": "사실 문장만으로 학습한 bigram 모델이 \"파리는 일본의 수도이다\"를 생성한 이유는?",
        "choices": [
          "학습 데이터에 오류가 있어서",
          "모델은 토큰이 이어질 확률만 배우고, 조합이 사실인지는 배우지 않기 때문에",
          "temperature가 0이라서",
          "어휘가 부족해서"
        ],
        "answer": 1,
        "explanation": "bigram은 바로 앞 단어 하나만 보므로 \"파리\"와 \"프랑스\"를 연결하지 못하고, \"X 는 Y 의 수도 이다\"라는 패턴의 확률만 배운다. 손실함수에는 사실 여부를 직접 검사하는 항이 없다. 실제 LLM은 긴 문맥으로 자주 나온 사실은 잘 맞히지만, 드물게 나온 사실에서 같은 종류의 오류를 낸다."
      },
      {
        "id": "w6-hallucination-c2",
        "question": "\"컨텍스트 창 한계\"와 \"지식 시점 컷오프\"의 차이로 옳은 것은?",
        "choices": [
          "둘은 같은 말이다",
          "전자는 지금 입력이 너무 길어 일부를 못 보는 문제, 후자는 학습 데이터 이후의 사실을 원천적으로 모르는 문제다",
          "전자는 학습 데이터 문제, 후자는 입력 길이 문제다",
          "둘 다 temperature로 해결된다"
        ],
        "answer": 1,
        "explanation": "컷오프는 RAG처럼 최신 정보를 입력에 넣어 완화하고, 컨텍스트 한계는 더 긴 창이나 요약·검색으로 완화한다."
      },
      {
        "id": "w6-hallucination-c3",
        "question": "보정이 잘 된(calibrated) 모델이란?",
        "choices": [
          "항상 확신도 100%로 답하는 모델",
          "\"80% 확신\"이라고 말한 답들 중 실제로 약 80%가 맞는 모델",
          "정확도가 100%인 모델",
          "답을 거부하는 모델"
        ],
        "answer": 1,
        "explanation": "확신도와 실제 정답률이 일치할수록 ECE가 0에 가깝다."
      },
      {
        "id": "w6-hallucination-c4",
        "question": "환각 완화책에 대한 설명으로 가장 정확한 것은?",
        "choices": [
          "RAG를 쓰면 모델이 근거 문서만 사용하므로 환각이 사라진다",
          "답변에 인용을 붙이게 하면 인용된 출처는 항상 실제로 존재한다",
          "RAG·인용·도구 사용·답변 보류 학습은 환각을 줄이지만, 검색 실패나 근거 오독, 가짜 인용이 남아 사람의 확인이 필요하다",
          "temperature를 0으로 두면 사실만 말한다"
        ],
        "answer": 2,
        "explanation": "검색이 엉뚱한 문서를 가져오거나 모델이 근거를 무시·오독하면 RAG에서도 환각이 생긴다. 모델이 만든 인용도 가짜이거나 주장을 뒷받침하지 않을 수 있다. temperature 0은 가장 확률이 높은 토큰을 고를 뿐, 그 토큰이 사실이라는 보장은 없다."
      }
    ],
    "quizIds": [
      "w6-q8"
    ],
    "references": [
      {
        "title": "Kalai et al. (2025) — Why Language Models Hallucinate",
        "url": "https://arxiv.org/abs/2509.04664",
        "note": "사전학습의 통계적 원인과, 추측을 보상하는 평가 방식을 함께 분석"
      },
      {
        "title": "Huang et al. (2023) — A Survey on Hallucination in Large Language Models",
        "url": "https://arxiv.org/abs/2311.05232",
        "note": "환각의 유형 분류와 완화책 정리 (과제 4번 참고)"
      }
    ]
  },
  "rl-basics": {
    "tier": "supplement",
    "goal": "Agent·Environment·State·Action·Reward·Policy·Return과 MDP, 벨만 방정식, 탐색–활용 트레이드오프를 설명하고, 가치 기반(Q-Learning·DQN)과 정책 기반(Policy Gradient·Actor-Critic·PPO) 방법을 구분할 수 있다.",
    "checks": [
      {
        "id": "w6-rl-basics-c1",
        "question": "RLHF에서 \"Action\"에 해당하는 것은?",
        "choices": [
          "사람이 매긴 점수",
          "다음에 생성할 토큰을 고르는 것",
          "보상모델의 파라미터",
          "프롬프트 데이터셋"
        ],
        "answer": 1,
        "explanation": "State는 지금까지의 토큰 시퀀스, Action은 다음 토큰 선택, Reward는 응답에 대한 선호 점수다."
      },
      {
        "id": "w6-rl-basics-c2",
        "question": "$\\gamma = 0.9$이고 한 스텝 뒤 목표 지점에서 보상 1을 받는다면, 목표 두 칸 전 상태에서 최선 행동의 Q값은? (중간 보상 0)",
        "choices": [
          "1",
          "0.9",
          "0.81",
          "0.5"
        ],
        "answer": 1,
        "explanation": "한 칸 전: 1, 두 칸 전: $0 + 0.9 \\times 1 = 0.9$. 목표 바로 앞 두 칸의 값이 이렇게 정해진다."
      },
      {
        "id": "w6-rl-basics-c3",
        "question": "PPO는 어느 계열의 알고리즘인가?",
        "choices": [
          "표 기반 Q-Learning",
          "DQN",
          "정책 경사 기반의 Actor-Critic",
          "지도학습"
        ],
        "answer": 2,
        "explanation": "정책(actor)을 직접 학습하고 가치함수(critic)로 분산을 줄이며, 기존 정책에서 너무 멀리 벗어나지 않게 제약한다."
      }
    ],
    "quizIds": [
      "w6-q19",
      "w6-q20",
      "w6-q21",
      "w6-q22",
      "w6-q23"
    ],
    "references": [
      {
        "title": "OpenAI Spinning Up — Key Concepts in RL",
        "url": "https://spinningup.openai.com/en/latest/spinningup/rl_intro.html",
        "note": "강화학습 용어와 수식을 가장 간결하게 정리한 자료 (영문)"
      },
      {
        "title": "Hugging Face Deep RL Course — Unit 1",
        "url": "https://huggingface.co/learn/deep-rl-course/unit1/introduction",
        "note": "강화학습 기본 개념을 실습과 함께 배우는 무료 코스 (Unit 2가 Q-Learning)"
      }
    ]
  },
  "test-time-compute": {
    "tier": "supplement",
    "goal": "연쇄 사고가 계산량을 늘리는 원리를 설명하고, 자기일관성(다수결)의 정답률을 이항분포로, 검증기를 쓰는 best-of-n의 정답률과 그 한계를 TPR·FPR로 계산할 수 있다.",
    "checks": [
      {
        "id": "w6-test-time-compute-c1",
        "question": "한 번 풀 때 정답률이 0.4이고 답이 정답·오답 두 갈래인 문제를, 독립적으로 101번 풀어 다수결하면 정답률은?",
        "choices": [
          "약 0.02로 떨어진다",
          "약 0.98로 오른다",
          "0.4 그대로다",
          "정확히 0.5가 된다"
        ],
        "answer": 0,
        "explanation": "$p < 0.5$면 과반이 오답일 확률이 $n$과 함께 1로 가므로 다수결 정답률은 0으로 간다. 다수결은 대체로 맞히는 문제를 확실하게 만들 뿐이다."
      },
      {
        "id": "w6-test-time-compute-c2",
        "question": "정답 확률 $p = 0.3$, 검증기 TPR 0.9, FPR 0.5일 때 best-of-n의 정답률이 $n$을 아무리 늘려도 넘지 못하는 값에 가장 가까운 것은?",
        "choices": [
          "약 0.44",
          "약 0.79",
          "1.0",
          "0.3"
        ],
        "answer": 0,
        "explanation": "통과한 후보가 정답일 확률은 $\\frac{0.27}{0.27 + 0.35} \\approx 0.435$다. 표본을 늘려도 검증기의 정밀도가 한계를 정한다."
      },
      {
        "id": "w6-test-time-compute-c3",
        "question": "보상모델을 검증기로 쓰는 best-of-n에서 $n$을 지나치게 키울 때의 위험으로 가장 알맞은 것은?",
        "choices": [
          "보상모델은 높게 평가하지만 실제로는 틀린 후보를 고르게 된다(보상 해킹)",
          "다수결이 불가능해진다",
          "온도가 0이 된다",
          "모델 파라미터가 바뀐다"
        ],
        "answer": 0,
        "explanation": "후보가 많을수록 보상모델의 오차를 파고드는 후보가 나올 기회가 늘어난다. 학습 중의 보상 해킹이 추론 시간에도 일어난다."
      }
    ],
    "quizIds": [
      "w6-q28"
    ],
    "references": [
      {
        "title": "Wang et al. (2022) — Self-Consistency Improves Chain of Thought Reasoning in Language Models",
        "url": "https://arxiv.org/abs/2203.11171",
        "note": "자기일관성(다수결) 원 논문 (영문)"
      },
      {
        "title": "Snell et al. (2024) — Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters",
        "url": "https://arxiv.org/abs/2408.03314",
        "note": "추론 시간 계산의 최적 배분과 난이도의 역할 (영문)"
      },
      {
        "title": "Gao et al. (2023) — Scaling Laws for Reward Model Overoptimization",
        "url": "https://arxiv.org/abs/2210.10760",
        "note": "best-of-n과 RL에서의 보상모델 과최적화 (영문)"
      }
    ]
  },
  "dpo-derivation": {
    "tier": "advanced",
    "goal": "KL 규제 보상 최대화의 최적 정책 $\\pi^* \\propto \\pi_{ref}e^{r/\\beta}$를 유도하고, 보상의 재매개변수화와 Bradley–Terry 모델에서 분배함수가 소거되어 DPO 손실이 나오는 과정을 설명하며, 그 가정이 깨질 때의 약점을 말할 수 있다.",
    "checks": [
      {
        "id": "w6-dpo-derivation-c1",
        "question": "목적함수 $\\mathbb{E}_\\pi[r] - \\beta D_{KL}(\\pi \\Vert \\pi_{ref})$를 최대화하는 정책은?",
        "choices": [
          "$\\pi^*(y) \\propto \\pi_{ref}(y)\\,e^{r(y)/\\beta}$",
          "보상이 가장 큰 응답 하나에 확률 1",
          "$\\pi_{ref}$ 그대로",
          "$\\pi^*(y) \\propto r(y)$"
        ],
        "answer": 0,
        "explanation": "목적함수가 $\\beta\\log Z - \\beta D_{KL}(\\pi \\Vert \\pi^*)$로 다시 쓰이므로 KL이 0이 되는 $\\pi^*$가 유일한 최적해다. 보상 최댓값 하나에 몰리는 것은 $\\beta \\to 0$인 극한이다."
      },
      {
        "id": "w6-dpo-derivation-c2",
        "question": "DPO 유도에서 계산할 수 없는 분배함수 $Z(x)$가 손실에서 사라지는 이유는?",
        "choices": [
          "선호 확률이 같은 프롬프트의 두 응답 보상의 차이만 보므로 $\\beta\\log Z(x)$가 빼기에서 소거된다",
          "$Z$가 항상 1이라서",
          "$\\beta$를 0으로 두기 때문",
          "보상모델이 $Z$를 대신 계산하기 때문"
        ],
        "answer": 0,
        "explanation": "Bradley–Terry는 $\\sigma(r(y_w) - r(y_l))$이고, 두 보상 모두 같은 $\\beta\\log Z(x)$를 포함하므로 차이에서 상쇄된다."
      },
      {
        "id": "w6-dpo-derivation-c3",
        "question": "DPO 학습 중 선호 응답 $y_w$의 로그확률까지 떨어질 수 있는 이유로 가장 알맞은 것은?",
        "choices": [
          "손실이 두 응답 로그확률 비율의 차이만 제약하므로, 둘이 함께 내려가도 차이가 벌어지면 손실이 준다",
          "학습률이 음수라서",
          "기준 모델이 함께 학습되기 때문",
          "Bradley–Terry 모델이 틀렸기 때문"
        ],
        "answer": 0,
        "explanation": "관측한 쌍의 차이만 보므로 확률이 데이터에 없는 다른 응답으로 새어 나갈 수 있다. 오프라인 학습이라 그 응답들을 직접 보지 못한다."
      }
    ],
    "quizIds": [
      "w6-q29"
    ],
    "references": [
      {
        "title": "Rafailov et al. (2023) — Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
        "url": "https://arxiv.org/abs/2305.18290",
        "note": "DPO 원 논문, 4절과 부록 A의 유도 (영문)"
      },
      {
        "title": "Azar et al. (2023) — A General Theoretical Paradigm to Understand Learning from Human Preferences",
        "url": "https://arxiv.org/abs/2310.12036",
        "note": "DPO의 과적합 분석과 IPO (영문)"
      }
    ]
  },
  "policy-gradient": {
    "tier": "advanced",
    "goal": "로그 미분 트릭으로 정책 경사를 유도하고, 기준선이 편향 없이 분산을 줄이는 이유를 증명하며, PPO 클리핑 목적함수의 비대칭과 RLHF에서 PPO가 쓰는 부품(KL 벌점·가치함수)을 설명할 수 있다.",
    "checks": [
      {
        "id": "w6-policy-gradient-c1",
        "question": "정책 경사 $\\nabla\\mathbb{E}_{a\\sim\\pi}[R] = \\mathbb{E}_{a\\sim\\pi}[R\\,\\nabla\\log\\pi(a)]$가 RLHF에 특히 유용한 이유는?",
        "choices": [
          "보상을 미분할 필요 없이 모델의 로그확률과 응답당 보상 숫자만으로 기울기를 추정할 수 있어서",
          "분산이 0이라서",
          "보상모델이 필요 없어서",
          "정책이 결정적이어서"
        ],
        "answer": 0,
        "explanation": "보상은 사람 판정이나 보상모델 점수라 응답에 대해 미분할 수 없다. 로그 미분 트릭은 미분을 정책의 로그확률 쪽으로 옮긴다."
      },
      {
        "id": "w6-policy-gradient-c2",
        "question": "REINFORCE에서 보상에서 기준선 $b$(행동과 무관한 값)를 빼도 기울기 추정의 기대값이 변하지 않는 이유는?",
        "choices": [
          "$\\mathbb{E}[b\\,\\nabla\\log\\pi] = b\\,\\nabla\\sum_a\\pi(a) = b\\,\\nabla 1 = 0$이라서",
          "$b$가 항상 0이라서",
          "분산이 줄어서",
          "PPO가 보정해 주어서"
        ],
        "answer": 0,
        "explanation": "확률의 합은 항상 1이라 그 기울기는 0이다. 그래서 $b$는 평균을 바꾸지 않고, 평균 보상 근처로 잡으면 분산만 줄인다."
      },
      {
        "id": "w6-policy-gradient-c3",
        "question": "PPO($\\varepsilon = 0.2$)에서 이점이 음수($A = -1$)인 행동의 확률비가 $\\rho = 1.5$로 커졌을 때 목적함수 항의 값은?",
        "choices": [
          "$-1.5$ (손해를 자르지 않는다)",
          "$-1.2$",
          "$-0.8$",
          "0"
        ],
        "answer": 0,
        "explanation": "$\\min(\\rho A, \\text{clip}(\\rho)A) = \\min(-1.5, -1.2) = -1.5$다. 나쁜 행동의 확률이 올라간 손해는 비관적으로 그대로 반영해 되돌리게 한다."
      }
    ],
    "quizIds": [
      "w6-q30"
    ],
    "references": [
      {
        "title": "Schulman et al. (2017) — Proximal Policy Optimization Algorithms",
        "url": "https://arxiv.org/abs/1707.06347",
        "note": "PPO 클리핑 목적함수 (영문)"
      },
      {
        "title": "OpenAI Spinning Up — Intro to Policy Optimization",
        "url": "https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html",
        "note": "정책 경사 정리와 기준선 유도 (영문)"
      },
      {
        "title": "Shao et al. (2024) — DeepSeekMath (GRPO)",
        "url": "https://arxiv.org/abs/2402.03300",
        "note": "묶음 평균을 기준선으로 쓰는 GRPO (영문)"
      }
    ]
  },
  "speculative-decoding": {
    "tier": "advanced",
    "goal": "투기적 샘플링의 수락-거절 규칙이 목표 분포를 정확히 보존함을 증명하고, 수락률 $\\alpha = \\sum\\min(p, q)$와 초안 길이·초안 비용에 따른 기대 속도 향상을 계산하며, 이득이 줄어드는 조건을 설명할 수 있다.",
    "checks": [
      {
        "id": "w6-speculative-decoding-c1",
        "question": "초안 토큰 $x \\sim q$를 확률 $\\min(1, p(x)/q(x))$로 수락하고 거절되면 $(p - q)_+$를 정규화한 분포에서 다시 뽑을 때, 최종 출력의 분포는?",
        "choices": [
          "정확히 목표 분포 $p$",
          "$p$와 $q$의 평균",
          "초안 분포 $q$",
          "$\\min(p, q)$를 정규화한 분포"
        ],
        "answer": 0,
        "explanation": "$P(x) = \\min(p(x), q(x)) + (p(x) - q(x))_+ = p(x)$다. 초안의 품질은 속도만 바꾸고 분포는 바꾸지 않는다."
      },
      {
        "id": "w6-speculative-decoding-c2",
        "question": "$p$ = [0.5, 0.2, 0.15, 0.1, 0.05], $q$ = [0.3, 0.3, 0.2, 0.1, 0.1]일 때 한 토큰의 수락률은?",
        "choices": [
          "0.80",
          "0.50",
          "0.65",
          "1.00"
        ],
        "answer": 0,
        "explanation": "$\\sum\\min(p, q) = 0.3 + 0.2 + 0.15 + 0.1 + 0.05 = 0.80$이고, 이는 $1 - \\text{TV}(p, q)$와 같다."
      },
      {
        "id": "w6-speculative-decoding-c3",
        "question": "투기적 디코딩의 이득이 가장 작아지는 상황은?",
        "choices": [
          "배치를 크게 묶어 GPU가 이미 연산 병목인 서버에서, 초안이 자주 틀리는 전문 영역을 생성할 때",
          "배치 1의 대화형 서비스에서 초안이 목표와 비슷할 때",
          "그리디 디코딩을 쓸 때",
          "초안 모델이 매우 작을 때"
        ],
        "answer": 0,
        "explanation": "검증 위치의 계산이 공짜인 것은 메모리 병목일 때뿐이다. 연산 병목이거나 수락률이 낮으면 초안 비용을 회수하지 못한다."
      }
    ],
    "quizIds": [
      "w6-q31"
    ],
    "references": [
      {
        "title": "Leviathan et al. (2023) — Fast Inference from Transformers via Speculative Decoding",
        "url": "https://arxiv.org/abs/2211.17192",
        "note": "투기적 디코딩 원 논문 (영문)"
      },
      {
        "title": "Chen et al. (2023) — Accelerating Large Language Model Decoding with Speculative Sampling",
        "url": "https://arxiv.org/abs/2302.01318",
        "note": "수락-거절 규칙의 증명 (영문)"
      },
      {
        "title": "Cai et al. (2024) — Medusa",
        "url": "https://arxiv.org/abs/2401.10774",
        "note": "여러 토큰 예측 머리를 이용한 변형 (영문)"
      }
    ]
  }
};

export default sections;
