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
        "question": "어휘 크기가 $|V| = 50{}000$일 때 One-hot 표현에서 서로 다른 두 단어 벡터의 내적은?",
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
        "explanation": "파라미터 공유 덕분에 파라미터 수가 시퀀스 길이와 무관하게 고정된다. 실습에서 길이 3과 50 모두 파라미터 336개였다."
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
        "explanation": "실습에서 16차원 $h_T$로 첫 토큰을 복원하는 $R^2$가 문장이 길어질수록 0으로 떨어졌다. Attention은 매 스텝 모든 $h_t$를 다시 조회해 이 병목을 없앤다."
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
        "explanation": "실습에서 $d_k = 512$일 때 나누지 않으면 최대 가중치 평균이 0.96까지 치솟았고, 나누면 0.3 안팎으로 유지됐다."
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
        "explanation": "마스크 없는 attention은 순열 등변이다: 입력 순서를 $P$로 섞으면 출력도 $P$로 섞일 뿐 각 토큰의 출력값은 같다($\\text{Attn}(PX) = P\\,\\text{Attn}(X)$). 그래서 순서 정보를 스스로 만들지 못하고, 실습에서 '고양이가'의 출력이 두 문장에서 같았다. 출력이 통째로 같은 순열 불변과는 구별한다."
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
        "explanation": "실습에서 forget bias를 올려 $f$를 1에 가깝게 하자 40스텝 전의 영향이 살아남았다. 반대로 $f \\approx 0.5$면 RNN보다도 빨리 사라졌다."
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
        "explanation": "실습의 파라미터 수는 GRU 1008, LSTM 1344로 3:4다. 성능 차이는 태스크마다 엇갈린다."
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
          "캐시 쪽이 근사값이라 조금 다르다",
          "수치 오차 범위에서 같다",
          "캐시 쪽이 더 정확하다",
          "완전히 다른 값이다"
        ],
        "answer": 1,
        "explanation": "실습에서 `np.allclose`가 True였다. 캐시는 근사가 아니라 같은 계산의 중복을 없앤 것이다."
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
          "$m$과 $n$ 각각의 절대값",
          "$m - n$(상대 거리)",
          "$m + n$",
          "문장 전체 길이"
        ],
        "answer": 1,
        "explanation": "회전 각도의 차이 $(m-n)\\theta$만 남는다. 실습에서 (5,3), (12,10), (102,100)의 점수가 모두 같았다."
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
