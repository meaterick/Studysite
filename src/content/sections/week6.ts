import type { SectionMeta } from "../types";

// Week 6 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "pretraining": {
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
    "goal": "$L(N, D) \\approx E + A/N^\\alpha + B/D^\\beta$, $C \\approx 6ND$, $D \\approx 20N$을 이용해 컴퓨트 예산에서 최적 모델 크기와 데이터 양을 계산하고, 실무의 과잉학습(overtraining)을 설명할 수 있다.",
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
        "explanation": "학습은 한 번이지만 추론은 계속된다. 실습에서 8B 모델은 최적점보다 손실이 약 0.02 높을 뿐이었다."
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
        "note": "실습에 쓴 수정 상수의 출처 (심화)"
      }
    ]
  },
  "finetuning-efficiency": {
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
        "explanation": "$2 \\times 4096 \\times 16 = 131{,}072$개, 원래는 $4096^2 \\approx 1{,}678$만 개이므로 $4096 / (2 \\times 16) = 128$분의 1."
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
        "explanation": "실습에서 상대 오차가 INT8 약 1%에서 INT4 약 16%로 커졌다. 블록 단위 스케일 등으로 이 오차를 줄인다."
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
  "rl-basics": {
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
        "explanation": "한 칸 전: 1, 두 칸 전: $0 + 0.9 \\times 1 = 0.9$. 실습의 복도에서 칸 2의 값이다."
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
  "rlhf-dpo": {
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
        "explanation": "$\\beta$는 KL 페널티 계수와 같은 역할이다. 최적 정책 $\\pi^* \\propto \\pi_{ref}\\,e^{r/\\beta}$에서 $\\beta$가 클수록 $\\pi^*$가 $\\pi_{ref}$에 가깝다."
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
        "explanation": "실습에서 그리디는 \"나는 그냥 그냥…\"(0.021), 빔 서치는 \"오늘 밥을 먹었다\"(0.342)를 골랐다."
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
    "goal": "다음 토큰 예측 목적함수에 사실 검증 항이 없다는 점에서 환각의 원인을 설명하고, 지식 빈틈·보정 부족·컨텍스트 창·지식 컷오프·평가 방식의 영향과 완화책을 구분할 수 있다.",
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
        "explanation": "\"X 는 Y 의 수도 이다\"라는 패턴은 모두 확률이 높다. 사실 여부는 손실함수에 들어 있지 않다."
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
};

export default sections;
