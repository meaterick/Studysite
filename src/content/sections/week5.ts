import type { SectionMeta } from "../types";

// Week 5 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "sequence-embedding": {
    "tier": "core",
    "goal": "텍스트를 숫자로 바꾸는 절차(전처리·토큰화·어휘 사전)를 설명하고, One-hot의 두 한계를 Word Embedding·Word2Vec이 어떻게 해결하는지 말할 수 있다.",
    "checks": [
      {
        "id": "w5-sequence-embedding-c1",
        "question": "어휘 크기가 $|V| = 50{,}000$일 때 One-hot 표현에서 서로 다른 두 단어 벡터의 내적은?",
        "choices": [
          "항상 0",
          "항상 1",
          "두 단어의 의미가 비슷할수록 크다",
          "$50{}000$"
        ],
        "answer": 0,
        "explanation": "One-hot 벡터는 서로 다른 자리에만 1이 있으므로 내적이 항상 0이다. 그래서 어떤 두 단어도 \"비슷하다\"는 정보를 담을 수 없다."
      },
      {
        "id": "w5-sequence-embedding-c2",
        "question": "임베딩 행렬 $E \\in \\mathbb{R}^{d \\times |V|}$에 One-hot 벡터 $e_i$를 곱한 $Ee_i$는?",
        "choices": [
          "$E$의 $i$번째 행",
          "$E$의 $i$번째 열",
          "$E$의 모든 열의 평균",
          "길이 $|V|$인 벡터"
        ],
        "answer": 1,
        "explanation": "$e_i$는 $i$번째 성분만 1이므로 $Ee_i$는 $E$의 $i$번째 열을 그대로 꺼낸다. 실제 구현은 곱셈 대신 인덱싱(lookup)으로 처리한다."
      },
      {
        "id": "w5-sequence-embedding-c3",
        "question": "Word2Vec Skip-gram이 학습하는 과제는?",
        "choices": [
          "문맥 단어들로 중심 단어를 예측한다",
          "중심 단어로 주변 문맥 단어를 예측한다",
          "문장의 감정을 분류한다",
          "다음 문장을 생성한다"
        ],
        "answer": 1,
        "explanation": "Skip-gram은 중심 단어 → 문맥 단어 방향으로 예측하고, CBOW가 그 반대 방향이다. 둘 다 정답 레이블 없이 텍스트만으로 학습하는 자기지도학습이다."
      },
      {
        "id": "w5-sequence-embedding-c4",
        "question": "어휘 크기 $|V| = 10{,}000$, 임베딩 차원 $d = 300$인 임베딩 행렬 $E$의 학습 파라미터 수는?",
        "choices": [
          "300만 개",
          "1만 개",
          "300개",
          "1억 개"
        ],
        "answer": 0,
        "explanation": "$E \\in \\mathbb{R}^{d \\times |V|}$이므로 $300 \\times 10{,}000 = 3{,}000{,}000$개다. 단어마다 300개의 숫자를 학습하는 셈이다."
      },
      {
        "id": "w5-sequence-embedding-c5",
        "question": "단어 단위 토크나이저가 어휘 사전에 없는 단어를 만났을 때 보통 하는 일과 그 결과는?",
        "choices": [
          "`<unk>` 토큰으로 바꾸며, 원래 어떤 단어였는지 정보가 사라진다",
          "새 번호를 즉석에서 붙여 사전에 추가한다",
          "가장 비슷한 단어로 자동 교정한다",
          "문장 전체를 버린다"
        ],
        "answer": 0,
        "explanation": "이미 학습된 모델의 어휘 사전은 고정되어 있어 새 번호를 붙일 수 없다. 그래서 `<unk>`로 뭉뚱그리고, 이 정보 손실(OOV 문제)이 BPE 같은 부분단어 토큰화가 등장한 이유다."
      },
      {
        "id": "w5-sequence-embedding-c6",
        "question": "\"나는 고양이를 정말 좋아한다\"에서 윈도우 크기 1로 Skip-gram (중심, 문맥) 쌍을 만들면 모두 몇 쌍인가?",
        "choices": [
          "6쌍",
          "4쌍",
          "8쌍",
          "3쌍"
        ],
        "answer": 0,
        "explanation": "양 끝 두 단어는 이웃이 하나씩이라 2쌍, 가운데 두 단어는 이웃이 둘씩이라 4쌍으로 $2 + 4 = 6$쌍이다."
      }
    ],
    "quizIds": [
      "w5-q12",
      "w5-q13"
    ],
    "references": [
      {
        "title": "Jay Alammar — The Illustrated Word2vec",
        "url": "https://jalammar.github.io/illustrated-word2vec/",
        "note": "임베딩·Skip-gram·negative sampling을 그림으로 (영문)"
      },
      {
        "title": "Mikolov et al. (2013) — Efficient Estimation of Word Representations in Vector Space",
        "url": "https://arxiv.org/abs/1301.3781",
        "note": "Word2Vec 원 논문: 1~3절만 읽어도 충분하다"
      }
    ]
  },
  "rnn-bptt": {
    "tier": "core",
    "goal": "RNN의 재귀식 $h_t = f(Wx_t + Uh_{t-1} + b)$과 파라미터 공유를 설명하고, BPTT에서 야코비안이 $T-k$번 곱해져 기울기가 소실·폭발하는 이유를 말할 수 있다.",
    "checks": [
      {
        "id": "w5-rnn-bptt-c1",
        "question": "RNN이 길이가 다른 문장을 같은 모델로 처리할 수 있는 이유는?",
        "choices": [
          "문장을 항상 같은 길이로 자르기 때문에",
          "모든 시점에서 같은 $W, U, b$를 재사용하기 때문에",
          "시점마다 새 가중치를 만들기 때문에",
          "은닉 상태의 크기가 문장 길이에 비례하기 때문에"
        ],
        "answer": 1,
        "explanation": "파라미터 공유 덕분에 파라미터 수가 시퀀스 길이와 무관하게 고정된다. 예를 들어 같은 RNN은 길이 3이든 50이든 파라미터가 336개다."
      },
      {
        "id": "w5-rnn-bptt-c2",
        "question": "시점 $T=50$의 손실에서 시점 $k=10$의 은닉 상태까지 기울기를 전달하려면 $\\partial h_t/\\partial h_{t-1}$ 형태의 야코비안을 몇 번 곱해야 하는가?",
        "choices": [
          "1번",
          "10번",
          "40번",
          "50번"
        ],
        "answer": 2,
        "explanation": "$\\prod_{t=k+1}^{T}$이므로 $T-k = 40$번이다. 각 항이 1보다 조금만 작아도 40번 곱하면 거의 0이 된다."
      },
      {
        "id": "w5-rnn-bptt-c3",
        "question": "기울기 폭발과 기울기 소실에 대한 설명으로 옳은 것은?",
        "choices": [
          "둘 다 기울기 클리핑으로 해결된다",
          "폭발은 클리핑으로 억누를 수 있지만, 소실은 이미 0에 가까워진 신호라 클리핑으로 되살릴 수 없다",
          "소실은 학습률을 키우면 완전히 해결된다",
          "RNN에서는 소실만 일어나고 폭발은 일어나지 않는다"
        ],
        "answer": 1,
        "explanation": "클리핑은 너무 큰 기울기의 크기만 줄이는 기법이다. 소실은 구조(게이트, 잔차 경로 등)를 바꿔야 완화된다."
      },
      {
        "id": "w5-rnn-bptt-c4",
        "question": "입력 차원 $d_x = 10$, 은닉 차원 $d_h = 20$인 RNN($W$, $U$, $b$)의 파라미터 수는?",
        "choices": [
          "620개",
          "420개",
          "600개",
          "문장 길이에 따라 달라진다"
        ],
        "answer": 0,
        "explanation": "$W$: $20 \\times 10 = 200$, $U$: $20 \\times 20 = 400$, $b$: 20으로 합계 620개다. 모든 시점이 이 파라미터를 공유하므로 문장 길이와는 무관하다."
      },
      {
        "id": "w5-rnn-bptt-c5",
        "question": "매 스텝 곱해지는 야코비안의 크기를 0.9로 단순화하면, 50스텝을 거슬러 올라간 기울기는 원래의 약 몇 배인가?",
        "choices": [
          "약 0.005배",
          "약 0.45배",
          "약 0.9배",
          "약 0.1배"
        ],
        "answer": 0,
        "explanation": "$0.9^{50} \\approx 0.005$다. 한 스텝에 10%씩만 줄어도 거듭 곱하면 지수적으로 작아진다. 이것이 기울기 소실이다."
      }
    ],
    "quizIds": [
      "w5-q14",
      "w5-q15",
      "w5-q16"
    ],
    "references": [
      {
        "title": "Karpathy — The Unreasonable Effectiveness of Recurrent Neural Networks",
        "url": "https://karpathy.github.io/2015/05/21/rnn-effectiveness/",
        "note": "문자 단위 RNN이 무엇을 배우는지 예제로 보는 고전 블로그 (영문)"
      },
      {
        "title": "Pascanu et al. (2013) — On the difficulty of training RNNs",
        "url": "https://arxiv.org/abs/1211.5063",
        "note": "기울기 소실·폭발 분석과 gradient clipping 제안 (심화)"
      }
    ]
  },
  "seq2seq-attention": {
    "tier": "core",
    "goal": "Seq2Seq의 Encoder–Decoder 구조와 Teacher Forcing을 설명하고, 고정 크기 문맥 벡터의 병목이 Attention으로 이어진 이유와 RNN 대비 Self-Attention의 경로 길이·연산량($O(1)$ vs $O(n)$, $O(n^2)$)을 비교할 수 있다.",
    "checks": [
      {
        "id": "w5-seq2seq-attention-c1",
        "question": "Teacher Forcing에서 Decoder의 다음 스텝 입력으로 넣는 것은?",
        "choices": [
          "모델이 방금 예측한 토큰",
          "실제 정답 시퀀스의 이전 토큰",
          "Encoder의 마지막 은닉 상태만",
          "무작위 토큰"
        ],
        "answer": 1,
        "explanation": "학습 중에는 정답 토큰을 넣어 한 스텝의 오류가 다음 스텝 입력을 오염시키는 것을 막는다."
      },
      {
        "id": "w5-seq2seq-attention-c2",
        "question": "Seq2Seq의 \"병목\"에 대한 설명으로 옳은 것은?",
        "choices": [
          "Decoder가 너무 느리다",
          "입력 길이와 무관하게 고정 크기 벡터 하나에 문장 전체를 압축해야 해서, 문장이 길수록 정보가 유실된다",
          "어휘 사전이 너무 크다",
          "Encoder와 Decoder의 파라미터가 공유된다"
        ],
        "answer": 1,
        "explanation": "한 실험에서 16차원 $h_T$로 첫 토큰을 복원하는 $R^2$가 문장이 길어질수록 0으로 떨어졌다. Attention은 매 스텝 모든 $h_t$를 다시 조회해 이 병목을 없앤다."
      },
      {
        "id": "w5-seq2seq-attention-c3",
        "question": "길이 $n$인 문장에서 Self-Attention의 두 토큰 사이 정보 경로 길이와 전체 연산량은?",
        "choices": [
          "$O(n)$, $O(n)$",
          "$O(1)$, $O(n^2)$",
          "$O(n^2)$, $O(1)$",
          "$O(\\log n)$, $O(n)$"
        ],
        "answer": 1,
        "explanation": "모든 쌍을 한 번에 직접 비교하므로 경로는 1이지만, $n \\times n$ 점수표를 만들어야 하므로 연산량은 $n^2$에 비례한다."
      },
      {
        "id": "w5-seq2seq-attention-c4",
        "question": "학습 때는 Teacher Forcing으로 정답을 입력받다가 추론 때는 자기 예측을 입력받아 생기는 문제를 무엇이라 하는가?",
        "choices": [
          "노출 편향(exposure bias)",
          "기울기 폭발",
          "과소적합",
          "레이블 누출"
        ],
        "answer": 0,
        "explanation": "학습 중에는 자기 실수가 섞인 입력을 본 적이 없어서, 추론 때 한 번 틀리면 그 오류가 다음 입력으로 이어져 누적되기 쉽다. 이를 노출 편향이라 한다."
      },
      {
        "id": "w5-seq2seq-attention-c5",
        "question": "Attention을 쓰는 Seq2Seq에서 디코더가 매 출력 스텝마다 새로 만드는 것은?",
        "choices": [
          "인코더 상태들을 그 스텝의 가중치로 섞은 문맥 벡터 $c_t$",
          "새 인코더 은닉 상태",
          "새 어휘 사전",
          "고정된 문맥 벡터 $c$ 하나"
        ],
        "answer": 0,
        "explanation": "디코더 상태와 각 인코더 상태의 관련도를 softmax로 비율화해 $c_t = \\sum_j \\alpha_{tj} h_j$를 스텝마다 새로 만든다. 고정된 $c$ 하나에 의존하지 않는 것이 핵심이다."
      }
    ],
    "quizIds": [
      "w5-q20",
      "w5-q21",
      "w5-q22"
    ],
    "references": [
      {
        "title": "Jay Alammar — Visualizing A Neural Machine Translation Model",
        "url": "https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/",
        "note": "Seq2Seq와 Attention을 애니메이션으로 (영문)"
      },
      {
        "title": "Bahdanau et al. (2014) — Neural Machine Translation by Jointly Learning to Align and Translate",
        "url": "https://arxiv.org/abs/1409.0473",
        "note": "Attention을 처음 제안한 논문: 그림 1과 3절"
      }
    ]
  },
  "self-attention": {
    "tier": "core",
    "goal": "$\\text{softmax}(QK^\\top/\\sqrt{d_k})V$의 각 부분($QK^\\top$, softmax, $\\sqrt{d_k}$, Value 가중합)이 왜 필요한지 설명하고, 작은 예제를 손과 코드로 계산할 수 있다.",
    "checks": [
      {
        "id": "w5-self-attention-c1",
        "question": "토큰 $n$개, $d_k = 64$일 때 $QK^\\top$의 shape은?",
        "choices": [
          "$(n, 64)$",
          "$(64, 64)$",
          "$(n, n)$",
          "$(n, 1)$"
        ],
        "answer": 2,
        "explanation": "$(n, d_k) \\times (d_k, n) = (n, n)$. 모든 토큰 쌍의 점수표다. 그래서 문맥이 2배가 되면 점수표 원소는 4배가 된다."
      },
      {
        "id": "w5-self-attention-c2",
        "question": "$q = [1, 1, 0, 1]$, $k = [1, 1, 0, -1]$일 때 $\\sqrt{d_k}$로 나눈 점수는?",
        "choices": [
          "$1$",
          "$0.5$",
          "$0.25$",
          "$2$"
        ],
        "answer": 1,
        "explanation": "$q \\cdot k = 1 + 1 + 0 - 1 = 1$, $\\sqrt{4} = 2$로 나누면 $0.5$. 본문 예제의 \"먹었다\" 칸이다."
      },
      {
        "id": "w5-self-attention-c3",
        "question": "$\\sqrt{d_k}$로 나누지 않으면 생기는 문제는?",
        "choices": [
          "점수가 모두 0이 된다",
          "내적의 분산이 $d_k$에 비례해 커져 softmax가 한 토큰에 쏠리고 기울기가 사라진다",
          "출력 shape이 바뀐다",
          "causal mask가 작동하지 않는다"
        ],
        "answer": 1,
        "explanation": "무작위 벡터로 실험하면 $d_k = 512$일 때 나누지 않으면 최대 가중치 평균이 0.96까지 치솟고, 나누면 0.3 안팎으로 유지된다."
      },
      {
        "id": "w5-self-attention-c4",
        "question": "도서관 비유에서 최종적으로 가중합되어 출력에 담기는 것은?",
        "choices": [
          "Query(질문지)",
          "Key(색인표)",
          "Value(책 내용)",
          "점수표"
        ],
        "answer": 2,
        "explanation": "Key는 어떤 책을 펼칠지 고르는 데만 쓰이고, 실제로 가져가는 정보는 Value다."
      },
      {
        "id": "w5-self-attention-c5",
        "question": "토큰 10개, $d_k = 64$, $d_v = 32$일 때 $\\text{softmax}(QK^\\top/\\sqrt{d_k})V$의 shape은?",
        "choices": [
          "$(10, 32)$",
          "$(10, 10)$",
          "$(10, 64)$",
          "$(64, 32)$"
        ],
        "answer": 0,
        "explanation": "$QK^\\top$은 $(10, 10)$이고, 여기에 $V$ $(10, 32)$를 곱하면 $(10, 32)$다. 토큰마다 $d_v$차원의 새 표현이 하나씩 나온다."
      },
      {
        "id": "w5-self-attention-c6",
        "question": "어떤 Query의 점수 $[1, 3, 0, 1]$에 모두 10을 더해 $[11, 13, 10, 11]$로 만들면 softmax 가중치는?",
        "choices": [
          "변하지 않는다",
          "모두 10배가 된다",
          "가장 큰 값에 더 쏠린다",
          "모두 같아진다"
        ],
        "answer": 0,
        "explanation": "softmax는 점수의 차이에만 반응한다. 공통으로 더한 $e^{10}$이 분자·분모에서 약분되기 때문이다. 반대로 점수에 같은 수를 곱하면 차이가 커져 분포가 뾰족해진다."
      }
    ],
    "quizIds": [
      "w5-q1",
      "w5-q3",
      "w5-q7"
    ],
    "references": [
      {
        "title": "Jay Alammar — The Illustrated Transformer",
        "url": "https://jalammar.github.io/illustrated-transformer/",
        "note": "Q·K·V 계산을 벡터 단위로 그린 대표 자료 (영문, 한국어 번역 링크 있음)"
      },
      {
        "title": "3Blue1Brown — Attention in transformers, visually explained",
        "url": "https://www.3blue1brown.com/lessons/attention",
        "note": "약 25분 영상. 이 단계 전후로 보면 좋다"
      },
      {
        "title": "Vaswani et al. (2017) — Attention Is All You Need",
        "url": "https://arxiv.org/abs/1706.03762",
        "note": "3.2절 Scaled Dot-Product Attention (각주 4에 √dk의 이유)"
      }
    ]
  },
  "multi-head-causal": {
    "tier": "core",
    "goal": "멀티헤드 attention의 split–attention–concat–$W^O$ 과정을 shape과 함께 추적하고, causal mask가 필요한 이유와 올바르게 적용됐는지 검사하는 방법을 설명할 수 있다.",
    "checks": [
      {
        "id": "w5-multi-head-causal-c1",
        "question": "$d = 512$, head 수 $h = 8$이면 head 하나의 차원 $d_k$는?",
        "choices": [
          "$512$",
          "$64$",
          "$8$",
          "$4096$"
        ],
        "answer": 1,
        "explanation": "$d_k = d/h = 64$. 전체 차원을 나눠 쓰므로 연산량은 단일 head와 비슷하다."
      },
      {
        "id": "w5-multi-head-causal-c2",
        "question": "causal mask에서 $-\\infty$(실제로는 매우 작은 수)로 바꾸는 칸은?",
        "choices": [
          "대각선",
          "대각선 아래(과거 토큰)",
          "대각선 위(미래 토큰)",
          "첫 번째 열"
        ],
        "answer": 2,
        "explanation": "$i$번째 토큰이 $j > i$인 미래 토큰을 보지 못하게 상삼각 부분을 가린다. softmax 후 그 칸은 0이 된다."
      },
      {
        "id": "w5-multi-head-causal-c3",
        "question": "구현한 causal attention이 올바른지 확인하는 테스트로 가장 적절한 것은?",
        "choices": [
          "출력의 평균이 0인지 본다",
          "마지막(미래) 토큰을 바꿔도 앞 토큰들의 출력이 변하지 않는지 본다",
          "실행 시간을 잰다",
          "가중치 합이 $n$인지 본다"
        ],
        "answer": 1,
        "explanation": "미래 정보가 과거로 새지 않는다는 성질을 직접 확인하는 검사다. 마스크를 끄면 첫 토큰 출력까지 크게 바뀌었다."
      },
      {
        "id": "w5-multi-head-causal-c4",
        "question": "$d = 512$를 유지한 채 헤드 수를 8개에서 16개로 늘리면 Multi-Head Attention의 파라미터 수($W_q, W_k, W_v, W^O$)는?",
        "choices": [
          "변하지 않는다",
          "2배가 된다",
          "절반이 된다",
          "4배가 된다"
        ],
        "answer": 0,
        "explanation": "네 행렬은 헤드 수와 관계없이 모두 $d \\times d$라 합계 $4d^2$다. 헤드 수는 $d$를 몇 조각($d_k = d/h$)으로 나눠 쓰는지만 바꾼다."
      },
      {
        "id": "w5-multi-head-causal-c5",
        "question": "causal mask를 쓴 attention에서 **첫 번째** 토큰의 attention 가중치는?",
        "choices": [
          "자기 자신에게 1(100%), 나머지는 0",
          "모든 토큰에 고르게 나뉜다",
          "모두 0이다",
          "마지막 토큰에 1이다"
        ],
        "answer": 0,
        "explanation": "첫 토큰은 앞에 아무것도 없어 볼 수 있는 것이 자기 자신뿐이다. 나머지 칸은 $-\\infty$ → 0이 되므로 softmax 결과는 자기 자신에게 1이다."
      }
    ],
    "quizIds": [
      "w5-q2",
      "w5-q4"
    ],
    "references": [
      {
        "title": "The Annotated Transformer (Harvard NLP)",
        "url": "https://nlp.seas.harvard.edu/annotated-transformer/",
        "note": "논문을 한 줄씩 PyTorch 코드로 옮긴 자료: MultiHeadedAttention·subsequent_mask 부분"
      },
      {
        "title": "Karpathy — Let's build GPT: from scratch, in code, spelled out",
        "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY",
        "note": "약 2시간. causal self-attention을 직접 짜는 과정 (과제 선택 항목에 직결)"
      }
    ]
  },
  "transformer-block": {
    "tier": "core",
    "goal": "마스크 없는 Self-Attention이 순열 등변(불변이 아니다) 연산이라 위치 인코딩이 필요한 이유와 causal mask가 이를 어떻게 바꾸는지 설명하고, 사인·코사인 위치 인코딩과 GPT형 디코더 블록(Attention + MLP, 잔차·정규화)의 역할 분담을 말할 수 있다.",
    "checks": [
      {
        "id": "w5-transformer-block-c1",
        "question": "위치 인코딩 없이 마스크 없는 Self-Attention에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면?",
        "choices": [
          "두 문장에서 각 단어의 출력 벡터가 똑같다(자리만 바뀜)",
          "항상 오류가 난다",
          "두 번째 문장의 출력이 모두 0이 된다",
          "첫 단어의 출력만 같다"
        ],
        "answer": 0,
        "explanation": "마스크 없는 attention은 순열 등변이다: 입력 순서를 $P$로 섞으면 출력도 $P$로 섞일 뿐 각 토큰의 출력값은 같다($\\text{Attn}(PX) = P\\,\\text{Attn}(X)$). 그래서 순서 정보를 스스로 만들지 못한다. 예를 들어 위치 정보 없이는 '고양이가 쥐를 쫓는다'와 '쥐를 고양이가 쫓는다'에서 '고양이가'의 출력이 같다. 출력이 통째로 같은 순열 불변과는 구별한다."
      },
      {
        "id": "w5-transformer-block-c2",
        "question": "Transformer 블록의 MLP에 대한 설명으로 옳은 것은?",
        "choices": [
          "토큰끼리 정보를 주고받는다",
          "각 토큰을 독립적으로 처리하며, 보통 $d \\to 4d \\to d$ 구조로 블록 파라미터의 약 2/3를 차지한다",
          "위치 인코딩을 계산한다",
          "softmax로 가중치를 만든다"
        ],
        "answer": 1,
        "explanation": "토큰 사이 정보 교환은 Attention이, 각 토큰의 표현 가공은 MLP가 맡는다. $d = 768$에서 MLP 비중은 약 67%였다."
      },
      {
        "id": "w5-transformer-block-c3",
        "question": "GPT 계열이 원래 Transformer에서 사용하는 부분은?",
        "choices": [
          "인코더만",
          "디코더만(causal self-attention 블록을 쌓음)",
          "인코더와 디코더 모두",
          "임베딩 층만"
        ],
        "answer": 1,
        "explanation": "GPT는 디코더 절반, BERT는 인코더 절반을 쓴다."
      },
      {
        "id": "w5-transformer-block-c4",
        "question": "위치 인코딩 없이 **causal mask**를 쓴 디코더에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면 '고양이가'의 출력은?",
        "choices": [
          "마스크가 없을 때처럼 두 문장에서 똑같다",
          "달라진다. 첫 문장에서는 자기 자신만, 둘째 문장에서는 세 단어를 모두 보기 때문이다",
          "두 문장 모두 0이 된다",
          "causal mask는 위치 인코딩이 있어야만 동작한다"
        ],
        "answer": 1,
        "explanation": "causal mask는 각 토큰이 볼 수 있는 범위를 위치에 따라 다르게 만들어 순열 등변성을 깬다. 그래서 위치 인코딩이 없는(NoPE) 디코더도 위치 정보를 어느 정도 알아낼 수 있다. 그래도 대부분의 모델은 안정성과 긴 문맥 성능 때문에 위치 인코딩(요즘은 주로 RoPE)을 쓴다."
      },
      {
        "id": "w5-transformer-block-c5",
        "question": "LayerNorm이 평균과 분산을 계산하는 범위는?",
        "choices": [
          "토큰 하나의 $d$개 성분",
          "배치 안의 모든 샘플",
          "문장 안의 모든 토큰",
          "모델의 모든 파라미터"
        ],
        "answer": 0,
        "explanation": "LayerNorm은 토큰마다 자기 $d$개 성분만으로 정규화한다. 배치에 걸쳐 평균을 내는 배치 정규화와 달리 배치 크기·문장 길이에 영향을 받지 않는다."
      },
      {
        "id": "w5-transformer-block-c6",
        "question": "Transformer 블록의 $h = x + \\text{Attention}(\\text{LN}(x))$에서 $x$를 더하는(잔차 연결) 주된 이유는?",
        "choices": [
          "역전파 때 기울기가 더하기 경로로 그대로 흘러 깊게 쌓아도 학습되게 하려고",
          "파라미터 수를 줄이려고",
          "미래 토큰을 가리려고",
          "출력을 확률로 만들려고"
        ],
        "answer": 0,
        "explanation": "잔차 연결은 부품이 \"수정분\"만 배우게 하고, 기울기가 지름길로 흐르게 해 수십 층을 쌓아도 기울기 소실을 막는다. 4주차 ResNet과 같은 원리다."
      },
      {
        "id": "w5-transformer-block-c7",
        "question": "사인 위치 인코딩에서 위치 $pos = 0$의 첫 두 성분 $(\\sin(0), \\cos(0))$은?",
        "choices": [
          "$(0, 1)$",
          "$(1, 0)$",
          "$(0, 0)$",
          "$(1, 1)$"
        ],
        "answer": 0,
        "explanation": "$\\sin 0 = 0$, $\\cos 0 = 1$이다. 실제로 위치 0의 위치 인코딩은 짝수 성분이 모두 0, 홀수 성분이 모두 1인 $[0, 1, 0, 1, \\dots]$이다."
      }
    ],
    "quizIds": [
      "w5-q6",
      "w5-q8"
    ],
    "references": [
      {
        "title": "Amirhossein Kazemnejad — Transformer Architecture: The Positional Encoding",
        "url": "https://kazemnejad.com/blog/transformer_architecture_positional_encoding/",
        "note": "사인·코사인 위치 인코딩의 직관과 성질 (영문)"
      },
      {
        "title": "Jay Alammar — The Illustrated GPT-2",
        "url": "https://jalammar.github.io/illustrated-gpt2/",
        "note": "디코더 전용 블록과 masked self-attention을 그림으로"
      }
    ]
  },
  "bpe": {
    "tier": "core",
    "goal": "BPE가 가장 잦은 쌍을 반복 병합해 어휘를 만드는 과정을 직접 따라가고, 이 방식이 OOV 완화·한국어 토큰 수·철자 세기 약점으로 이어지는 이유를 설명할 수 있다.",
    "checks": [
      {
        "id": "w5-bpe-c1",
        "question": "BPE 학습의 한 단계에서 하는 일은?",
        "choices": [
          "가장 드문 글자를 삭제한다",
          "말뭉치에서 가장 자주 붙어 나오는 조각 쌍을 하나로 합친다",
          "단어를 공백 기준으로 자른다",
          "모든 단어를 소문자로 바꾼다"
        ],
        "answer": 1,
        "explanation": "이 병합을 정해진 횟수만큼 반복한 기록이 곧 토크나이저의 병합 규칙(merges)이다."
      },
      {
        "id": "w5-bpe-c2",
        "question": "학습 데이터에 없던 단어 \"slow\"가 `['s', 'low</w>']`로 토큰화된 것이 보여주는 것은?",
        "choices": [
          "BPE는 새 단어를 처리하지 못한다",
          "학습된 조각을 재사용해 본 적 없는 단어도 처리한다(OOV 완화)",
          "\"slow\"가 어휘 사전에 있었다",
          "글자 단위 토큰화와 같다"
        ],
        "answer": 1,
        "explanation": "자주 나온 조각은 크게, 처음 보는 조합은 잘게 쪼개진다."
      },
      {
        "id": "w5-bpe-c3",
        "question": "LLM이 \"strawberry에 r이 몇 개인가?\"에 자주 틀리는 이유와 가장 관련 있는 것은?",
        "choices": [
          "모델이 영어를 모르기 때문에",
          "모델은 글자 대신 여러 글자가 뭉친 토큰 단위로 입력을 보기 때문에",
          "r이 특수문자라서",
          "문장이 너무 길어서"
        ],
        "answer": 1,
        "explanation": "토큰 경계 안의 글자 구성은 모델에게 직접 보이지 않는다. 숫자 연산이 약한 이유의 일부도 같다."
      },
      {
        "id": "w5-bpe-c4",
        "question": "바이트 수준 BPE가 기본 어휘 256개에서 시작해 병합을 50,000번 했다면 어휘 크기는 약?",
        "choices": [
          "50,256개",
          "50,000개",
          "256개",
          "100,000개"
        ],
        "answer": 0,
        "explanation": "병합 한 번마다 새 토큰이 하나 생기므로 $256 + 50{,}000 = 50{,}256$개다. GPT-2의 어휘 크기 50,257은 여기에 특수 토큰 하나를 더한 값이다."
      },
      {
        "id": "w5-bpe-c5",
        "question": "학습된 BPE로 새 단어를 토큰화하는 방법은?",
        "choices": [
          "글자로 쪼갠 뒤 학습 때 생긴 순서대로 병합 규칙을 적용한다",
          "어휘 사전에서 가장 긴 단어를 찾아 통째로 매칭한다",
          "새 단어를 보고 병합 규칙을 다시 학습한다",
          "사전에 없으면 `<unk>`로 바꾼다"
        ],
        "answer": 0,
        "explanation": "BPE 학습의 결과물은 순서가 있는 병합 규칙 목록이다. 토큰화는 그 규칙을 같은 순서로 재생할 뿐이라, 처음 보는 단어도 아는 조각들로 표현된다."
      }
    ],
    "quizIds": [
      "w5-q5"
    ],
    "references": [
      {
        "title": "Sennrich et al. (2016) — Neural Machine Translation of Rare Words with Subword Units",
        "url": "https://arxiv.org/abs/1508.07909",
        "note": "BPE를 NLP에 도입한 논문: 알고리즘 1이 본문 코드와 같다"
      },
      {
        "title": "Karpathy — Let's build the GPT Tokenizer",
        "url": "https://www.youtube.com/watch?v=zduSFxRajkE",
        "note": "byte-level BPE를 처음부터 구현하는 영상 (과제 선택 항목에 직결)"
      },
      {
        "title": "Tiktokenizer",
        "url": "https://tiktokenizer.vercel.app/",
        "note": "문장을 넣으면 GPT 토크나이저의 토큰 경계를 바로 보여주는 웹 도구: 한국어·영어를 비교해 보자"
      }
    ]
  },
  "lstm-gru": {
    "tier": "supplement",
    "goal": "LSTM의 forget·input·output 게이트와 셀 상태, GRU의 update·reset 게이트를 설명하고, $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$가 기울기 소실을 완화하는 이유를 말할 수 있다.",
    "checks": [
      {
        "id": "w5-lstm-gru-c1",
        "question": "LSTM에서 \"이전 셀 상태 $c_{t-1}$ 중 얼마를 계속 기억할지\"를 정하는 것은?",
        "choices": [
          "input gate $i_t$",
          "forget gate $f_t$",
          "output gate $o_t$",
          "후보 $\\tilde{c}_t$"
        ],
        "answer": 1,
        "explanation": "forget gate가 0에 가까우면 그 성분의 기억을 지우고, 1에 가까우면 유지한다."
      },
      {
        "id": "w5-lstm-gru-c2",
        "question": "LSTM 셀 상태 경로가 RNN보다 기울기 소실에 강한 핵심 이유는?",
        "choices": [
          "게이트가 많아 파라미터가 많기 때문에",
          "셀 상태가 행렬곱·tanh 대신 성분별 곱과 덧셈으로 갱신되어, $f_t \\approx 1$이면 기울기가 거의 그대로 전달되기 때문에",
          "시그모이드가 항상 1을 출력하기 때문에",
          "은닉 상태를 사용하지 않기 때문에"
        ],
        "answer": 1,
        "explanation": "forget bias를 올려 $f$를 1에 가깝게 하면 40스텝 전의 영향이 살아남는다. 반대로 $f \\approx 0.5$면 RNN보다도 빨리 사라진다."
      },
      {
        "id": "w5-lstm-gru-c3",
        "question": "GRU와 LSTM의 비교로 옳은 것은?",
        "choices": [
          "GRU는 게이트 3개, 상태 2개를 쓴다",
          "GRU는 게이트 2개(update, reset)와 상태 1개로, 같은 크기에서 파라미터가 LSTM의 약 3/4이다",
          "GRU는 게이트가 없다",
          "GRU가 항상 LSTM보다 정확하다"
        ],
        "answer": 1,
        "explanation": "같은 크기라면 예컨대 GRU 1008개, LSTM 1344개로 파라미터가 3:4다. 성능 차이는 태스크마다 엇갈린다."
      },
      {
        "id": "w5-lstm-gru-c4",
        "question": "입력 차원 $d_x = 10$, 은닉 차원 $d_h = 20$인 LSTM의 파라미터 수는? (게이트·후보 4개, 편향 포함)",
        "choices": [
          "2,480개",
          "620개",
          "1,860개",
          "2,400개"
        ],
        "answer": 0,
        "explanation": "하나당 $20 \\times (10 + 20) + 20 = 620$개이고 4개라 2,480개다. 같은 크기의 RNN(620개)의 4배, GRU(3개, 1,860개)의 4/3배다."
      },
      {
        "id": "w5-lstm-gru-c5",
        "question": "LSTM에서 $f_t = 0$, $i_t = 1$이면 새 셀 상태 $c_t$는?",
        "choices": [
          "과거 기억을 모두 지우고 새 후보 $\\tilde{c}_t$로 채워진다",
          "이전 셀 상태 $c_{t-1}$이 그대로 유지된다",
          "0이 된다",
          "$c_{t-1} + \\tilde{c}_t$가 된다"
        ],
        "answer": 0,
        "explanation": "$c_t = 0 \\cdot c_{t-1} + 1 \\cdot \\tilde{c}_t = \\tilde{c}_t$다. 반대로 $f_t = 1$, $i_t = 0$이면 $c_t = c_{t-1}$로 기억이 그대로 보존된다."
      }
    ],
    "quizIds": [
      "w5-q17",
      "w5-q18",
      "w5-q19"
    ],
    "references": [
      {
        "title": "Chris Olah — Understanding LSTM Networks",
        "url": "https://colah.github.io/posts/2015-08-Understanding-LSTMs/",
        "note": "LSTM 게이트를 그림으로 설명하는 가장 유명한 글 (영문)"
      },
      {
        "title": "d2l.ai — Long Short-Term Memory (LSTM)",
        "url": "https://d2l.ai/chapter_recurrent-modern/lstm.html",
        "note": "수식과 구현을 함께 (한국어판: ko.d2l.ai)"
      },
      {
        "title": "Jozefowicz et al. (2015) — An Empirical Exploration of Recurrent Network Architectures",
        "url": "https://proceedings.mlr.press/v37/jozefowicz15.pdf",
        "note": "forget bias를 1로 초기화하는 관행의 근거 (심화)"
      }
    ]
  },
  "kv-cache-rope": {
    "tier": "supplement",
    "goal": "생성 시 KV 캐시가 무엇을 저장하고 무엇을 새로 계산하는지, 왜 결과가 같은지 설명하고, 메모리 비용을 계산하며, RoPE가 회전으로 상대 거리만 반영하는 원리를 말할 수 있다.",
    "checks": [
      {
        "id": "w5-kv-cache-rope-c1",
        "question": "KV 캐시를 쓸 때 매 생성 스텝에 새로 계산하는 것은?",
        "choices": [
          "지금까지 모든 토큰의 Q, K, V",
          "새 토큰 하나의 Q, K, V (과거 K, V는 캐시에서 읽음)",
          "과거 토큰의 Q만",
          "아무것도 새로 계산하지 않는다"
        ],
        "answer": 1,
        "explanation": "causal mask 때문에 과거 토큰의 K, V는 새 토큰이 와도 변하지 않으므로 저장해 두고 재사용한다."
      },
      {
        "id": "w5-kv-cache-rope-c2",
        "question": "KV 캐시로 계산한 출력과 전체를 한 번에 계산한 출력의 관계는?",
        "choices": [
          "캐시 쪽이 근삿값이라 조금 다르다",
          "수치 오차 범위에서 같다",
          "캐시 쪽이 더 정확하다",
          "완전히 다른 값이다"
        ],
        "answer": 1,
        "explanation": "캐시를 쓴 결과와 쓰지 않은 결과를 비교하면 `np.allclose`가 True다. 캐시는 근사가 아니라 같은 계산의 중복을 없앤 것이다."
      },
      {
        "id": "w5-kv-cache-rope-c3",
        "question": "레이어 32, head 32, head 차원 128, 시퀀스 2048, 배치 1, fp16일 때 KV 캐시 메모리는 약?",
        "choices": [
          "약 67MB",
          "약 1.07GB",
          "약 8.6GB",
          "약 17GB"
        ],
        "answer": 1,
        "explanation": "$32 \\times 32 \\times 128 \\times 2048 \\times 2 \\approx 5.37 \\times 10^8$개에 원소당 2바이트를 곱하면 약 1.07GB. 배치 8이면 8배가 된다."
      },
      {
        "id": "w5-kv-cache-rope-c4",
        "question": "RoPE로 회전한 $q$(위치 $m$)와 $k$(위치 $n$)의 내적이 의존하는 것은?",
        "choices": [
          "$m$과 $n$ 각각의 절댓값",
          "$m - n$(상대 거리)",
          "$m + n$",
          "문장 전체 길이"
        ],
        "answer": 1,
        "explanation": "회전 각도의 차이 $(m-n)\\theta$만 남는다. 그래서 위치 쌍 (5,3), (12,10), (102,100)의 점수가 모두 같다."
      },
      {
        "id": "w5-kv-cache-rope-c5",
        "question": "Query 헤드 32개는 그대로 두고 K·V 헤드를 8개로 줄인 GQA를 쓰면, KV 캐시 메모리는 원래의 몇 배가 되는가?",
        "choices": [
          "1/4배",
          "1/32배",
          "변하지 않는다",
          "1/8배"
        ],
        "answer": 0,
        "explanation": "KV 캐시는 저장하는 K·V 헤드 수에 비례한다. 32개에서 8개로 줄면 1/4이 된다. Query 헤드 수는 캐시 크기와 무관하다."
      },
      {
        "id": "w5-kv-cache-rope-c6",
        "question": "생성의 프리필(prefill) 단계에서 일어나는 일은?",
        "choices": [
          "프롬프트 전체를 한 번에 병렬 처리해 KV 캐시를 채운다",
          "토큰을 하나씩 만들며 캐시에 덧붙인다",
          "KV 캐시를 비운다",
          "모델 가중치를 프롬프트에 맞게 갱신한다"
        ],
        "answer": 0,
        "explanation": "프리필은 이미 주어진 프롬프트를 학습 때처럼 병렬로 처리해 캐시를 채우는 단계다. 그 뒤 디코드 단계에서 토큰을 하나씩 생성한다."
      }
    ],
    "quizIds": [
      "w5-q9",
      "w5-q10",
      "w5-q11"
    ],
    "references": [
      {
        "title": "Hugging Face Transformers — Caching (KV cache)",
        "url": "https://huggingface.co/docs/transformers/main/en/cache_explanation",
        "note": "실제 라이브러리에서 KV 캐시가 동작하는 방식 (영문)"
      },
      {
        "title": "EleutherAI — Rotary Embeddings: A Relative Revolution",
        "url": "https://blog.eleuther.ai/rotary-embeddings/",
        "note": "RoPE의 직관과 수식 (영문)"
      },
      {
        "title": "Su et al. (2021) — RoFormer: Enhanced Transformer with Rotary Position Embedding",
        "url": "https://arxiv.org/abs/2104.09864",
        "note": "RoPE 원 논문 (심화)"
      }
    ]
  },
  "transformer-params": {
    "tier": "supplement",
    "goal": "디코더 블록의 파라미터가 약 $12d^2$인 이유를 부품별로 세고, 토큰당 연산량 $2N$·학습 연산량 $6ND$, 추론 가중치·학습 상태·KV 캐시 메모리를 계산할 수 있다.",
    "checks": [
      {
        "id": "w5-transformer-params-c1",
        "question": "은닉 차원 $d$인 디코더 블록 하나에서 MLP($d \\to 4d \\to d$)의 가중치 수는? (편향 제외)",
        "choices": [
          "$8d^2$",
          "$4d^2$",
          "$12d^2$",
          "$16d^2$"
        ],
        "answer": 0,
        "explanation": "$d \\times 4d$와 $4d \\times d$ 두 행렬이라 $8d^2$다. attention은 $Q, K, V, W^O$ 네 개로 $4d^2$이므로 블록 파라미터의 3분의 2가 MLP에 있다."
      },
      {
        "id": "w5-transformer-params-c2",
        "question": "파라미터 70억 개 모델을 1조 토큰으로 학습하는 데 드는 연산량은 대략?",
        "choices": [
          "$4.2\\times10^{22}$ FLOPs",
          "$7\\times10^{21}$ FLOPs",
          "$1.4\\times10^{22}$ FLOPs",
          "$7\\times10^{12}$ FLOPs"
        ],
        "answer": 0,
        "explanation": "학습은 토큰당 약 $6N$ FLOPs이므로 $6 \\times 7\\times10^9 \\times 10^{12} = 4.2\\times10^{22}$이다."
      },
      {
        "id": "w5-transformer-params-c3",
        "question": "7B 모델을 fp16으로 추론할 때 가중치만의 메모리는 대략?",
        "choices": [
          "14GB",
          "7GB",
          "28GB",
          "112GB"
        ],
        "answer": 0,
        "explanation": "파라미터당 2바이트이므로 약 14GB다. 학습(혼합 정밀도 Adam)이면 파라미터당 약 16바이트로 약 112GB가 된다."
      },
      {
        "id": "w5-transformer-params-c4",
        "question": "$d = 4096$, 층 $L = 32$인 디코더 본체의 파라미터는 $12Ld^2$로 대략?",
        "choices": [
          "약 64억",
          "약 6억",
          "약 640억",
          "약 1.6억"
        ],
        "answer": 0,
        "explanation": "$12 \\times 32 \\times 4096^2 \\approx 6.4 \\times 10^9$이다. 여기에 임베딩이 더해져 흔히 말하는 7B 모델 규모가 된다."
      },
      {
        "id": "w5-transformer-params-c5",
        "question": "파라미터 70억 개 모델이 토큰 하나를 생성(순전파)하는 데 드는 연산량은 대략?",
        "choices": [
          "$1.4 \\times 10^{13}$ FLOPs",
          "$7 \\times 10^{9}$ FLOPs",
          "$4.2 \\times 10^{10}$ FLOPs",
          "$1.4 \\times 10^{22}$ FLOPs"
        ],
        "answer": 0,
        "explanation": "순전파는 토큰당 약 $2N$ FLOPs이므로 $2 \\times 7 \\times 10^9 = 1.4 \\times 10^{13}$이다. 학습은 역전파까지 더해 토큰당 약 $6N$이다."
      }
    ],
    "quizIds": [
      "w5-q23"
    ],
    "references": [
      {
        "title": "Kaplan et al. (2020) — Scaling Laws for Neural Language Models, 2.1절",
        "url": "https://arxiv.org/abs/2001.08361",
        "note": "파라미터 수와 FLOPs 계산의 표준 근사 (영문)"
      },
      {
        "title": "EleutherAI — Transformer Math 101",
        "url": "https://blog.eleuther.ai/transformer-math/",
        "note": "학습 메모리·연산량 계산 정리 (영문)"
      }
    ]
  },
  "efficient-attention": {
    "tier": "advanced",
    "goal": "최댓값을 빼는 안전한 softmax와 온라인 softmax 갱신식을 유도·구현하고, FlashAttention이 GPU 메모리 계층에서 HBM 왕복을 줄여 빨라지는 이유와 한계를 설명할 수 있다.",
    "checks": [
      {
        "id": "w5-efficient-attention-c1",
        "question": "softmax를 계산할 때 점수에서 최댓값을 빼는 이유는?",
        "choices": [
          "값은 같으면서 $\\exp$가 넘치지 않게(지수가 0 이하가 되게) 하려고",
          "확률의 합을 1로 만들려고",
          "기울기를 크게 하려고",
          "온도를 낮추려고"
        ],
        "answer": 0,
        "explanation": "$e^{s_i - m}/\\sum_j e^{s_j - m}$은 분자·분모에 같은 $e^{-m}$을 곱한 것이라 값이 같고, 지수가 모두 0 이하라 오버플로가 없다."
      },
      {
        "id": "w5-efficient-attention-c2",
        "question": "온라인 softmax에서 새 블록의 최댓값 $m'$이 이전 최댓값 $m$보다 클 때 이전 누적값 $\\ell$, $a$에 곱하는 값은?",
        "choices": [
          "$e^{m - m'}$",
          "$e^{m' - m}$",
          "$m/m'$",
          "1"
        ],
        "answer": 0,
        "explanation": "이전 값들은 $e^{s_j - m}$ 기준이었으므로 새 기준 $e^{s_j - m'}$으로 바꾸려면 $e^{m - m'}$을 곱한다. 이 보정 덕분에 결과가 정확하다."
      },
      {
        "id": "w5-efficient-attention-c3",
        "question": "FlashAttention이 표준 attention보다 빠른 주된 이유는?",
        "choices": [
          "점수 행렬을 HBM에 쓰고 읽는 왕복을 없애 메모리 병목을 줄이기 때문",
          "FLOPs를 $O(n)$으로 줄이기 때문",
          "근사 계산을 하기 때문",
          "softmax를 생략하기 때문"
        ],
        "answer": 0,
        "explanation": "attention은 메모리 대역폭에 묶이는 연산이다. 타일을 SRAM에서만 처리해 $n\\times n$ 행렬을 HBM에 만들지 않는다. FLOPs와 결과는 그대로다."
      },
      {
        "id": "w5-efficient-attention-c4",
        "question": "문맥 길이가 4배가 되면 표준 attention이 만드는 점수 행렬($n \\times n$)의 메모리는 몇 배가 되는가?",
        "choices": [
          "16배",
          "4배",
          "2배",
          "변하지 않는다"
        ],
        "answer": 0,
        "explanation": "$n \\times n$ 행렬이라 $n$이 4배면 $4^2 = 16$배다. FlashAttention은 이 행렬을 메모리에 만들지 않아 메모리를 $O(n)$으로 줄인다."
      },
      {
        "id": "w5-efficient-attention-c5",
        "question": "온라인 softmax로 계산한 attention 출력과 점수를 전부 보고 계산한 출력의 관계는?",
        "choices": [
          "(부동소수점 오차를 빼면) 정확히 같다",
          "근삿값이라 조금 다르다",
          "블록 크기가 클수록만 같아진다",
          "최댓값 토큰만 같다"
        ],
        "answer": 0,
        "explanation": "최댓값이 바뀔 때마다 $e^{m - m'}$로 과거 누적값을 정확히 보정하므로 근사가 전혀 없다. FlashAttention이 \"정확한(exact) attention\"이라 불리는 이유다."
      }
    ],
    "quizIds": [
      "w5-q24"
    ],
    "references": [
      {
        "title": "Dao et al. (2022) — FlashAttention",
        "url": "https://arxiv.org/abs/2205.14135",
        "note": "IO를 고려한 정확한 attention (영문)"
      },
      {
        "title": "Milakov & Gimelshein (2018) — Online normalizer calculation for softmax",
        "url": "https://arxiv.org/abs/1805.02867",
        "note": "온라인 softmax (영문)"
      }
    ]
  },
  "linear-attention": {
    "tier": "advanced",
    "goal": "attention을 커널 가중평균으로 쓰고 결합법칙으로 선형 어텐션을 유도하며, 인과적 선형 어텐션이 고정 크기 상태의 RNN과 같아짐을 구현으로 확인하고 그 대가를 설명할 수 있다.",
    "checks": [
      {
        "id": "w5-linear-attention-c1",
        "question": "커널을 $\\phi(q)^\\top\\phi(k)$로 쪼갤 수 있을 때 선형 어텐션이 연산량을 줄이는 핵심 아이디어는?",
        "choices": [
          "$(\\phi(Q)\\phi(K)^\\top)V$ 대신 $\\phi(Q)(\\phi(K)^\\top V)$로 결합 순서를 바꾼다",
          "softmax를 근사 없이 계산한다",
          "토큰 수를 줄인다",
          "헤드 수를 늘린다"
        ],
        "answer": 0,
        "explanation": "$\\phi(K)^\\top V$는 $d\\times d$로 모든 query가 공유한다. 연산량이 $O(n^2d)$에서 $O(nd^2)$가 된다."
      },
      {
        "id": "w5-linear-attention-c2",
        "question": "인과적 선형 어텐션을 생성할 때 토큰마다 저장·갱신하는 것은?",
        "choices": [
          "$S_t = S_{t-1} + \\phi(k_t)v_t^\\top$와 $z_t$라는 고정 크기 상태",
          "지금까지의 모든 K, V(KV 캐시)",
          "$n\\times n$ 점수 행렬",
          "아무것도 없다"
        ],
        "answer": 0,
        "explanation": "고정 크기 상태를 누적하는 RNN이다. KV 캐시처럼 문맥 길이에 비례해 커지지 않는다."
      },
      {
        "id": "w5-linear-attention-c3",
        "question": "선형 어텐션이 softmax attention보다 약한 과제로 가장 알맞은 것은?",
        "choices": [
          "먼 과거의 특정 토큰을 정확히 복사·검색하는 과제",
          "짧은 문장 분류",
          "단어 임베딩 학습",
          "덧셈 두 자리"
        ],
        "answer": 0,
        "explanation": "과거 전체를 $d\\times d$ 상태에 압축하므로 Seq2Seq와 같은 정보 병목이 생긴다. softmax attention은 모든 K, V를 그대로 들고 있어 정확히 다시 꺼낼 수 있다."
      },
      {
        "id": "w5-linear-attention-c4",
        "question": "문맥 $n = 100{,}000$, 차원 $d = 100$일 때 softmax attention의 $O(n^2 d)$와 선형 어텐션의 $O(nd^2)$ 연산량 비율은?",
        "choices": [
          "약 1,000배",
          "약 100배",
          "약 10배",
          "같다"
        ],
        "answer": 0,
        "explanation": "$n^2 d / (n d^2) = n/d = 100{,}000 / 100 = 1{,}000$이다. 문맥이 차원보다 훨씬 길 때 선형 어텐션이 유리하다."
      },
      {
        "id": "w5-linear-attention-c5",
        "question": "인과적 선형 어텐션으로 토큰을 생성할 때, 문맥이 길어지면 들고 다녀야 하는 메모리는?",
        "choices": [
          "일정하다($d \\times d$ 상태)",
          "문맥 길이에 비례해 커진다",
          "문맥 길이의 제곱으로 커진다",
          "토큰마다 0으로 초기화된다"
        ],
        "answer": 0,
        "explanation": "상태 $S_t$($d \\times d$)와 $z_t$($d$)만 갱신하므로 문맥 길이와 무관하다. 문맥 길이에 비례해 커지는 KV 캐시와 대조적이다."
      }
    ],
    "quizIds": [
      "w5-q25"
    ],
    "references": [
      {
        "title": "Katharopoulos et al. (2020) — Transformers are RNNs",
        "url": "https://arxiv.org/abs/2006.16236",
        "note": "선형 어텐션과 RNN의 등가성 (영문)"
      },
      {
        "title": "Gu & Dao (2023) — Mamba",
        "url": "https://arxiv.org/abs/2312.00752",
        "note": "선택적 상태공간 모델: 게이트 있는 순환 구조의 현대판 (영문)"
      }
    ]
  },
  "position-extrapolation": {
    "tier": "advanced",
    "goal": "사인파 위치 인코딩의 회전 성질을 덧셈 정리로 증명하고, RoPE가 학습 길이를 넘어 실패하는 이유를 성분별 파장으로 설명하며, 위치 보간의 원리와 대가를 계산할 수 있다.",
    "checks": [
      {
        "id": "w5-position-extrapolation-c1",
        "question": "사인파 위치 인코딩에서 $PE(p+k)$와 $PE(p)$의 관계로 옳은 것은?",
        "choices": [
          "$k$에만 의존하는 회전 행렬로 $PE(p+k) = R_k\\,PE(p)$",
          "$PE(p+k) = PE(p) + PE(k)$",
          "$PE(p+k) = k\\,PE(p)$",
          "관계가 없다"
        ],
        "answer": 0,
        "explanation": "삼각함수 덧셈 정리로 성분 쌍마다 각도 $k\\theta_i$만큼 회전한다. 모델이 선형 변환으로 상대 거리를 읽을 수 있는 이유다."
      },
      {
        "id": "w5-position-extrapolation-c2",
        "question": "학습 길이 2048인 RoPE 모델에서 파장이 47,000 위치인 성분이 문제를 일으키는 이유는?",
        "choices": [
          "학습 중 한 바퀴도 돌지 못해, 2048을 넘는 위치에서 처음 보는 각도가 나오기 때문",
          "너무 빨리 돌아서",
          "파장이 짧아서",
          "그 성분은 쓰이지 않아서"
        ],
        "answer": 0,
        "explanation": "그 성분이 학습 중 본 각도는 $[0, 2048\\theta_i)$뿐이다. 그 너머의 각도에 대한 $q\\cdot k$ 패턴은 배운 적이 없다."
      },
      {
        "id": "w5-position-extrapolation-c3",
        "question": "문맥을 2048에서 8192로 늘리며 위치 보간(PI)을 할 때의 대가는?",
        "choices": [
          "이웃한 위치의 각도 차이가 4분의 1로 줄어 가까운 토큰의 위치 구별이 흐려진다",
          "파라미터 수가 4배가 된다",
          "KV 캐시가 사라진다",
          "상대 위치 성질이 깨진다"
        ],
        "answer": 0,
        "explanation": "모든 위치를 $L/L'$배로 줄이므로 해상도도 같은 배율로 준다. NTK-aware·YaRN은 주파수마다 다르게 늘려 이 대가를 줄인다."
      },
      {
        "id": "w5-position-extrapolation-c4",
        "question": "학습 길이 2048인 모델을 위치 보간으로 8192까지 늘릴 때, 위치 6000은 몇으로 옮겨지는가?",
        "choices": [
          "1500",
          "6000",
          "24000",
          "2048"
        ],
        "answer": 0,
        "explanation": "모든 위치에 $L/L' = 2048/8192 = 1/4$을 곱하므로 $6000/4 = 1500$이다. 이렇게 모든 위치가 학습 때 본 범위 $[0, 2048)$ 안으로 들어온다."
      },
      {
        "id": "w5-position-extrapolation-c5",
        "question": "회전 속도가 $\\theta = 1$(라디안/위치)인 성분의 파장은?",
        "choices": [
          "약 6.28 위치($2\\pi$)",
          "1 위치",
          "약 3.14 위치($\\pi$)",
          "10,000 위치"
        ],
        "answer": 0,
        "explanation": "파장은 $2\\pi/\\theta$이므로 $\\theta = 1$이면 $2\\pi \\approx 6.28$ 위치마다 한 바퀴를 돈다. 가장 빠른 성분이 이 정도라 학습 중 모든 각도를 수없이 본다."
      }
    ],
    "quizIds": [
      "w5-q26"
    ],
    "references": [
      {
        "title": "Su et al. (2021) — RoFormer: Enhanced Transformer with Rotary Position Embedding",
        "url": "https://arxiv.org/abs/2104.09864",
        "note": "RoPE 원 논문 (영문)"
      },
      {
        "title": "Chen et al. (2023) — Extending Context Window of Large Language Models via Positional Interpolation",
        "url": "https://arxiv.org/abs/2306.15595",
        "note": "위치 보간 (영문)"
      },
      {
        "title": "Peng et al. (2023) — YaRN",
        "url": "https://arxiv.org/abs/2309.00071",
        "note": "주파수별 보간으로 문맥 확장 (영문)"
      }
    ]
  }
};

export default sections;
