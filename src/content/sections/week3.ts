import type { SectionMeta } from "../types";

// Week 3 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "neurons-mlp": {
    "goal": "뉴런 하나의 계산과 MLP의 순전파를 행렬 모양까지 추적하고, 비선형 활성화 함수(ReLU·GELU)가 왜 반드시 필요한지 설명할 수 있다.",
    "checks": [
      {
        "id": "w3-neurons-mlp-c1",
        "question": "가중치 $w_1 = 0.5, w_2 = -1$, 편향 $b = -0.5$, 입력 $x_1 = 2, x_2 = 1$인 ReLU 뉴런의 출력은?",
        "choices": [
          "$0.5$",
          "$0$",
          "$-0.5$",
          "$1$"
        ],
        "answer": 1,
        "explanation": "$z = 1 - 1 - 0.5 = -0.5$이고 $\\mathrm{ReLU}(-0.5) = 0$이다. 이 뉴런은 \"꺼진\" 상태다."
      },
      {
        "id": "w3-neurons-mlp-c2",
        "question": "입력 3차원, 은닉 4차원인 층 $h = \\phi(W_1 x + b_1)$에서 $W_1$의 모양은?",
        "choices": [
          "$3 \\times 4$",
          "$4 \\times 3$",
          "$4 \\times 4$",
          "$1 \\times 4$"
        ],
        "answer": 1,
        "explanation": "$W_1 x$가 4차원이 되려면 $W_1$의 모양은 (출력 4, 입력 3)이어야 한다."
      },
      {
        "id": "w3-neurons-mlp-c3",
        "question": "활성화 함수 없이 선형 층을 10개 쌓은 모델의 표현력은?",
        "choices": [
          "층 수에 비례해 10배",
          "선형 층 1개와 같다",
          "무한히 크다",
          "0이 된다"
        ],
        "answer": 1,
        "explanation": "$W_{10}\\cdots W_1 x$는 결국 행렬 하나로 합쳐지므로 단일 선형 변환과 같다. 실습에서 `np.allclose`가 True로 확인되었다."
      }
    ],
    "quizIds": [
      "w3-q3",
      "w3-q17"
    ],
    "references": [
      {
        "title": "3Blue1Brown — But what is a neural network?",
        "url": "https://www.3blue1brown.com/lessons/neural-networks",
        "note": "뉴런·가중치·편향·층의 의미를 시각적으로"
      },
      {
        "title": "CS231n — Neural Networks Part 1: Setting up the Architecture",
        "url": "https://cs231n.github.io/neural-networks-1/",
        "note": "활성화 함수 비교와 층 구성"
      }
    ]
  },
  "backprop": {
    "goal": "계산 그래프의 덧셈·곱셈·max 노드 규칙으로 역전파를 손으로 수행하고, 한 층의 $\\partial L/\\partial W = \\delta x^\\top$을 수치미분으로 검산할 수 있다.",
    "checks": [
      {
        "id": "w3-backprop-c1",
        "question": "곱셈 노드 $z = a \\cdot b$에서 $a = 3$, $b = -2$이고 상류 기울기가 $\\partial L/\\partial z = 5$일 때 $\\partial L/\\partial a$는?",
        "choices": [
          "$5$",
          "$-10$",
          "$15$",
          "$-2$"
        ],
        "answer": 1,
        "explanation": "곱셈 노드는 상대방의 값을 곱해 전달한다: $5 \\times b = 5 \\times (-2) = -10$."
      },
      {
        "id": "w3-backprop-c2",
        "question": "덧셈 노드 $z = a + b$에서 상류 기울기 $g$를 받으면 $a$, $b$에 전달되는 기울기는?",
        "choices": [
          "각각 $g/2$",
          "각각 $g$",
          "$a$에만 $g$",
          "$g \\cdot a$, $g \\cdot b$"
        ],
        "answer": 1,
        "explanation": "덧셈은 두 입력의 크기에 서로 영향을 주지 않으므로 기울기를 그대로 양쪽에 복사한다."
      },
      {
        "id": "w3-backprop-c3",
        "question": "역전파가 \"혁신\"이었던 가장 큰 이유는?",
        "choices": [
          "새로운 미분 규칙을 발견해서",
          "순전파 한 번과 비슷한 비용으로 모든 파라미터의 기울기를 한꺼번에 구해서",
          "수치미분보다 덜 정확해서",
          "GPU에서만 동작해서"
        ],
        "answer": 1,
        "explanation": "연쇄법칙 자체는 오래된 도구다. 계산 그래프 위에서 중간 결과를 재사용해, 파라미터 수만큼 순전파를 반복하는 수치미분과 달리 한 번의 역방향 순회로 끝낸다."
      }
    ],
    "quizIds": [
      "w3-q1",
      "w3-q2",
      "w3-q4"
    ],
    "references": [
      {
        "title": "CS231n — Backpropagation, Intuitions",
        "url": "https://cs231n.github.io/optimization-2/",
        "note": "게이트별 기울기 흐름을 그림과 숫자로: 본문과 같은 방식"
      },
      {
        "title": "3Blue1Brown — Backpropagation calculus",
        "url": "https://www.3blue1brown.com/lessons/backpropagation-calculus",
        "note": "연쇄법칙이 층을 따라 이어지는 모습을 수식으로"
      }
    ]
  },
  "python-for-autograd": {
    "goal": "클래스와 `__init__`, 연산자 오버로딩, 클로저, 재귀, set/reversed를 읽고 써서 자동미분 엔진 코드를 이해할 준비를 한다.",
    "checks": [
      {
        "id": "w3-python-for-autograd-c1",
        "question": "파이썬에서 `a + b`를 실행하면 실제로 호출되는 것은?",
        "choices": [
          "`b.__add__(a)`",
          "`a.__add__(b)`",
          "`add(a, b)`",
          "`a.__init__(b)`"
        ],
        "answer": 1,
        "explanation": "연산자 오버로딩: 왼쪽 피연산자의 `__add__` 메서드가 호출된다. Value 클래스가 `+`로 계산 그래프를 만드는 원리다."
      },
      {
        "id": "w3-python-for-autograd-c2",
        "question": "다음 코드의 출력은? `def mk(n):` 안에 `def f(x): return x * n`을 정의하고 `return f`; `g = mk(3)`; `print(g(4))`",
        "choices": [
          "`7`",
          "`12`",
          "`3`",
          "오류"
        ],
        "answer": 1,
        "explanation": "`g`는 `n=3`을 기억하는 클로저다. `g(4)`는 `4 * 3 = 12`."
      },
      {
        "id": "w3-python-for-autograd-c3",
        "question": "재귀 함수에 반드시 있어야 하는 것은?",
        "choices": [
          "`for` 반복문",
          "더 이상 자기 자신을 부르지 않는 종료 조건(base case)",
          "클래스",
          "전역 변수"
        ],
        "answer": 1,
        "explanation": "종료 조건이 없으면 무한히 자기 자신을 호출하다 `RecursionError`가 난다."
      }
    ],
    "quizIds": [],
    "references": [
      {
        "title": "Python 공식 자습서 — 9. 클래스",
        "url": "https://docs.python.org/ko/3/tutorial/classes.html",
        "note": "클래스·인스턴스·메서드의 정식 설명(한국어)"
      },
      {
        "title": "Python 데이터 모델 — 특수 메서드",
        "url": "https://docs.python.org/ko/3/reference/datamodel.html#emulating-numeric-types",
        "note": "`__add__`, `__mul__`, `__radd__` 등 연산자 오버로딩 목록"
      }
    ]
  },
  "micrograd": {
    "goal": "Value 클래스가 계산 그래프를 기록하고 위상정렬 역순으로 `_backward`를 실행하는 원리를 설명하고, 새 연산을 추가해 gradient check로 검증할 수 있다.",
    "checks": [
      {
        "id": "w3-micrograd-c1",
        "question": "Value의 `_backward`를 연산 시점에 바로 실행하지 않고 클로저로 저장해두는 이유는?",
        "choices": [
          "메모리를 아끼려고",
          "순전파 시점에는 아직 `out.grad`(상류 기울기)를 모르기 때문에",
          "파이썬 문법상 어쩔 수 없어서",
          "속도를 높이려고"
        ],
        "answer": 1,
        "explanation": "상류 기울기는 손실이 계산된 뒤 역전파가 그 노드에 도착해야 정해진다. 그래서 \"나중에 이렇게 계산하라\"는 방법만 저장해둔다(지연 계산)."
      },
      {
        "id": "w3-micrograd-c2",
        "question": "$y = x \\cdot x + x$에서 $x = 3$일 때, `_backward`가 `+=` 대신 `=`로 기울기를 덮어쓰면 생기는 문제는?",
        "choices": [
          "아무 문제 없다",
          "$x$가 여러 경로로 쓰였는데 마지막 경로의 기울기만 남아 7이 아닌 틀린 값이 나온다",
          "프로그램이 멈춘다",
          "기울기가 항상 0이 된다"
        ],
        "answer": 1,
        "explanation": "한 변수가 여러 경로에 쓰이면 각 경로의 기울기를 더해야 한다(다변수 연쇄법칙). 덮어쓰면 일부 경로의 기여가 사라진다."
      },
      {
        "id": "w3-micrograd-c3",
        "question": "$\\tanh$ 노드의 국소 미분은? ($t = \\tanh z$)",
        "choices": [
          "$t$",
          "$1 - t^2$",
          "$1 + t^2$",
          "$\\cosh z$"
        ],
        "answer": 1,
        "explanation": "$\\frac{d}{dz}\\tanh z = 1 - \\tanh^2 z$. 실습에서 이 식으로 채운 역전파가 수치미분과 $10^{-11}$ 수준까지 일치했다."
      }
    ],
    "quizIds": [
      "w3-q7"
    ],
    "references": [
      {
        "title": "Andrej Karpathy — micrograd (GitHub)",
        "url": "https://github.com/karpathy/micrograd",
        "note": "본문 Value 클래스의 원본 저장소: engine.py가 100줄 남짓"
      },
      {
        "title": "Karpathy — Neural Networks: Zero to Hero, 1강",
        "url": "https://karpathy.ai/zero-to-hero.html",
        "note": "micrograd를 처음부터 직접 만드는 2시간 영상(필수 권장)"
      }
    ]
  },
  "optimizers": {
    "goal": "SGD·Momentum·Adam의 갱신식을 쓰고 Adam 첫 스텝을 손으로 계산하며, 최적화기의 장단점을 실험 결과로 판단할 수 있다.",
    "checks": [
      {
        "id": "w3-optimizers-c1",
        "question": "Momentum이 좁고 긴 협곡 모양의 손실에서 SGD보다 유리한 이유는?",
        "choices": [
          "기울기를 계산하지 않아서",
          "일관된 방향은 누적되어 가속되고, 부호가 바뀌는 진동 성분은 서로 상쇄되어서",
          "학습률을 자동으로 0으로 만들어서",
          "파라미터 수를 줄여서"
        ],
        "answer": 1,
        "explanation": "$v \\leftarrow \\beta v + g$로 과거 방향을 섞어 쓰기 때문에, 긴 축 방향은 속도가 붙고 좁은 축의 진동은 줄어든다."
      },
      {
        "id": "w3-optimizers-c2",
        "question": "Adam($\\beta_1 = 0.9$, $\\beta_2 = 0.999$, $\\eta = 0.1$)의 첫 스텝에서 기울기가 $g_1 = 5$일 때 이동량은?",
        "choices": [
          "$0.5$",
          "약 $0.1$",
          "$5$",
          "$0.01$"
        ],
        "answer": 1,
        "explanation": "편향 보정 후 $\\hat m_1 = 5$, $\\hat v_1 = 25$이므로 $0.1 \\times 5/\\sqrt{25} = 0.1$. 기울기가 0.01이어도 첫 스텝 이동량은 같다."
      },
      {
        "id": "w3-optimizers-c3",
        "question": "실습 결과를 바탕으로 가장 적절한 결론은?",
        "choices": [
          "Adam은 모든 문제에서 SGD보다 빠르다",
          "같은 학습률이면 Momentum이 SGD보다 유리하지만, 잘 튜닝된 SGD가 단순한 문제에서 가장 정확할 수도 있다",
          "Momentum은 항상 발산한다",
          "최적화기는 결과에 영향을 주지 않는다"
        ],
        "answer": 1,
        "explanation": "최적화기 선택은 \"정답\"이 아니라 트레이드오프다. Adam은 학습률에 덜 민감한 좋은 기본값이고, 튜닝 여유가 있으면 SGD+Momentum이 이기는 경우도 많다."
      }
    ],
    "quizIds": [
      "w3-q5"
    ],
    "references": [
      {
        "title": "Distill — Why Momentum Really Works",
        "url": "https://distill.pub/2017/momentum/",
        "note": "모멘텀의 동작을 인터랙티브 그래프로"
      },
      {
        "title": "Kingma & Ba (2014) — Adam: A Method for Stochastic Optimization",
        "url": "https://arxiv.org/abs/1412.6980",
        "note": "Adam 원 논문: Algorithm 1이 본문의 갱신식"
      }
    ]
  },
  "init-stability": {
    "goal": "기울기 소실·폭발과 죽은 ReLU를 설명하고, $\\mathrm{Var}(z) \\approx \\text{fan\\_in}\\cdot\\mathrm{Var}(w)\\cdot\\mathrm{Var}(x)$로 He·Xavier 초기화를 유도하며 대칭성 문제를 확인할 수 있다.",
    "checks": [
      {
        "id": "w3-init-stability-c1",
        "question": "fan_in = 50인 ReLU 층에 He 초기화를 쓰면 가중치의 표준편차는?",
        "choices": [
          "$1/50 = 0.02$",
          "$\\sqrt{2/50} = 0.2$",
          "$2/50 = 0.04$",
          "$\\sqrt{50} \\approx 7.07$"
        ],
        "answer": 1,
        "explanation": "He 초기화는 $\\mathrm{Var}(W) = 2/\\text{fan\\_in} = 0.04$이므로 표준편차는 $\\sqrt{0.04} = 0.2$."
      },
      {
        "id": "w3-init-stability-c2",
        "question": "층마다 활성화의 표준편차가 0.8배씩 줄어든다면 10층 뒤에는 대략?",
        "choices": [
          "0.8배",
          "0.1배",
          "8배",
          "0.5배"
        ],
        "answer": 1,
        "explanation": "$0.8^{10} \\approx 0.107$. 층 하나의 작은 오차가 깊이만큼 곱해져 지수적으로 커진다."
      },
      {
        "id": "w3-init-stability-c3",
        "question": "모든 가중치를 같은 값(예: 0.5)으로 초기화한 은닉층의 뉴런들은 학습 후 어떻게 되는가?",
        "choices": [
          "서로 다른 특징을 배운다",
          "같은 기울기를 받아 끝까지 서로의 복사본으로 남는다",
          "모두 죽는다",
          "학습률에 따라 자동으로 달라진다"
        ],
        "answer": 1,
        "explanation": "대칭성이 깨지지 않는다. 실습 2에서 200스텝 뒤에도 세 열이 완전히 같았다. 작은 무작위 값으로 시작해야 한다."
      }
    ],
    "quizIds": [
      "w3-q6",
      "w3-q8",
      "w3-q9",
      "w3-q10"
    ],
    "references": [
      {
        "title": "He et al. (2015) — Delving Deep into Rectifiers",
        "url": "https://arxiv.org/abs/1502.01852",
        "note": "He 초기화를 제안한 논문: 2.2절이 본문의 분산 유도"
      },
      {
        "title": "deeplearning.ai — Initializing neural networks",
        "url": "https://www.deeplearning.ai/ai-notes/initialization/",
        "note": "초기화 스케일에 따른 학습 차이를 인터랙티브로"
      }
    ]
  },
  "normalization": {
    "goal": "BatchNorm과 LayerNorm이 평균·분산을 계산하는 축의 차이를 작은 예제로 계산하고, Transformer가 LayerNorm을 쓰는 이유를 설명할 수 있다.",
    "checks": [
      {
        "id": "w3-normalization-c1",
        "question": "미니배치 $z = \\begin{pmatrix}1 & 3\\\\ 5 & 7\\end{pmatrix}$(행=샘플, 열=특징)에서 LayerNorm이 샘플 1에 대해 계산하는 평균은?",
        "choices": [
          "$2$",
          "$3$",
          "$4$",
          "$6$"
        ],
        "answer": 0,
        "explanation": "LayerNorm은 한 샘플 안의 특징들로 평균을 낸다: $(1 + 3)/2 = 2$. BatchNorm이라면 특징 1에 대해 $(1 + 5)/2 = 3$이다."
      },
      {
        "id": "w3-normalization-c2",
        "question": "배치 크기가 1일 때 BatchNorm의 문제는?",
        "choices": [
          "평균이 무한대가 된다",
          "배치 축의 분산이 0이라 모든 값이 0(평균)으로 뭉개진다",
          "아무 문제 없다",
          "LayerNorm으로 자동 전환된다"
        ],
        "answer": 1,
        "explanation": "샘플 하나로는 배치 통계를 낼 수 없다. 그래서 추론 때는 학습 중 모아둔 이동평균을 쓰고, 문장 길이·배치가 들쭉날쭉한 Transformer는 LayerNorm을 쓴다."
      },
      {
        "id": "w3-normalization-c3",
        "question": "정규화 뒤에 학습 가능한 $\\gamma$, $\\beta$를 다시 곱하고 더하는 이유는?",
        "choices": [
          "계산을 빠르게 하려고",
          "표준화로 잃을 수 있는 표현력을 되살려, 필요하면 원래 스케일·위치로 되돌릴 수 있게 하려고",
          "분산을 0으로 만들려고",
          "기울기를 끊으려고"
        ],
        "answer": 1,
        "explanation": "$\\gamma = \\sigma$, $\\beta = \\mu$가 되면 원래 값이 복원된다. 정규화가 \"표현을 강제로 제한\"하지 않도록 여지를 남긴다."
      }
    ],
    "quizIds": [
      "w3-q18"
    ],
    "references": [
      {
        "title": "Ioffe & Szegedy (2015) — Batch Normalization",
        "url": "https://arxiv.org/abs/1502.03167",
        "note": "BatchNorm 원 논문"
      },
      {
        "title": "Ba, Kiros & Hinton (2016) — Layer Normalization",
        "url": "https://arxiv.org/abs/1607.06450",
        "note": "LayerNorm 원 논문: 순환망·Transformer에서 배치 의존성을 없앤 이유"
      }
    ]
  },
  "pytorch-core": {
    "goal": "Tensor·Autograd·nn.Module·Optimizer·Dataset·학습 루프가 손으로 구현한 역전파·경사하강법의 어느 부분을 대신하는지 대응시키고, NumPy로 2층 신경망을 끝까지 학습시킬 수 있다.",
    "checks": [
      {
        "id": "w3-pytorch-core-c1",
        "question": "PyTorch 학습 루프의 올바른 순서는?",
        "choices": [
          "step → backward → zero_grad → forward",
          "forward → loss → zero_grad → backward → step",
          "backward → forward → step",
          "zero_grad → step → forward → backward"
        ],
        "answer": 1,
        "explanation": "기울기를 초기화한 뒤 backward로 새로 채우고 step으로 갱신한다(zero_grad는 backward 전이면 된다)."
      },
      {
        "id": "w3-pytorch-core-c2",
        "question": "`nn.Module`을 상속한 클래스에서 `backward` 메서드를 직접 작성하지 않아도 되는 이유는?",
        "choices": [
          "PyTorch가 수치미분을 쓰기 때문에",
          "`forward` 안의 텐서 연산이 autograd에 기록되어 `loss.backward()`가 자동으로 역전파하기 때문에",
          "backward가 필요 없는 모델만 만들 수 있어서",
          "GPU가 대신 계산해서"
        ],
        "answer": 1,
        "explanation": "각 연산이 `grad_fn`으로 그래프를 기록한다. 우리가 만든 Value의 `_prev`, `_backward`와 같은 원리다."
      },
      {
        "id": "w3-pytorch-core-c3",
        "question": "검증 루프에서 `model.eval()`과 `torch.no_grad()`의 역할을 올바르게 짝지은 것은?",
        "choices": [
          "eval: 계산 그래프 기록 중지 / no_grad: 드롭아웃 끄기",
          "eval: BatchNorm·Dropout을 평가 모드로 / no_grad: 계산 그래프를 기록하지 않아 메모리 절약",
          "둘 다 학습률을 0으로",
          "둘 다 같은 기능"
        ],
        "answer": 1,
        "explanation": "eval은 층의 동작 모드를, no_grad는 autograd 기록 여부를 바꾼다. 둘은 서로 다른 스위치다."
      }
    ],
    "quizIds": [
      "w3-q11",
      "w3-q12",
      "w3-q13",
      "w3-q16"
    ],
    "references": [
      {
        "title": "PyTorch Tutorials — Learn the Basics",
        "url": "https://pytorch.org/tutorials/beginner/basics/intro.html",
        "note": "Tensor → Dataset → Model → Autograd → Optimization 순서의 공식 튜토리얼"
      },
      {
        "title": "Dive into Deep Learning (한국어) — 다층 퍼셉트론",
        "url": "https://ko.d2l.ai/chapter_deep-learning-basics/mlp.html",
        "note": "MLP를 처음부터 구현하고 프레임워크로 옮기는 과정"
      }
    ]
  },
  "pytorch-practice": {
    "goal": "GPU·CUDA가 행렬 연산을 가속하는 원리와 혼합 정밀도의 underflow·loss scaling을 설명하고, 같은 모델을 NumPy와 PyTorch로 풀어 비교할 수 있다.",
    "checks": [
      {
        "id": "w3-pytorch-practice-c1",
        "question": "GPU가 행렬 곱을 CPU보다 훨씬 빠르게 처리하는 이유는?",
        "choices": [
          "코어 하나가 CPU보다 강력해서",
          "서로 독립인 수많은 곱셈-덧셈을 수천 개의 단순한 코어로 동시에 처리해서",
          "메모리를 쓰지 않아서",
          "정밀도가 항상 더 높아서"
        ],
        "answer": 1,
        "explanation": "행렬 곱의 각 원소 계산은 서로 독립이라 병렬화에 최적이다. 실습에서 벡터화만으로도 파이썬 반복문보다 수백 배 빨랐다."
      },
      {
        "id": "w3-pytorch-practice-c2",
        "question": "FP16으로 학습할 때 loss scaling이 필요한 이유는?",
        "choices": [
          "FP16은 큰 수를 표현할 수 없어서",
          "아주 작은 기울기가 0으로 반올림(underflow)되는 것을 막으려고",
          "손실을 줄이려고",
          "GPU 메모리를 늘리려고"
        ],
        "answer": 1,
        "explanation": "손실(→기울기)을 크게 키워 FP16의 표현 범위 안에서 계산한 뒤, 갱신 직전에 다시 나눈다."
      },
      {
        "id": "w3-pytorch-practice-c3",
        "question": "NumPy 수동 구현 대신 PyTorch를 쓸 때 가장 큰 이점은?",
        "choices": [
          "결과가 수학적으로 달라진다",
          "모델 구조를 바꿔도 미분 공식을 다시 유도할 필요 없이 학습 루프를 그대로 쓸 수 있다",
          "학습률이 필요 없다",
          "항상 정확도가 높아진다"
        ],
        "answer": 1,
        "explanation": "두 방법의 수학은 같다. autograd가 미분 공식 자리를, optimizer가 갱신 코드를 대신하므로 모델이 복잡해져도 루프는 그대로다."
      }
    ],
    "quizIds": [
      "w3-q14",
      "w3-q15"
    ],
    "references": [
      {
        "title": "PyTorch — Automatic Mixed Precision recipe",
        "url": "https://pytorch.org/tutorials/recipes/recipes/amp_recipe.html",
        "note": "autocast와 GradScaler(loss scaling) 사용법"
      },
      {
        "title": "Google Colab",
        "url": "https://colab.research.google.com/",
        "note": "무료 GPU로 본문의 PyTorch 코드를 실행: 런타임 유형을 GPU로 바꾸고 `torch.cuda.is_available()` 확인"
      }
    ]
  },
};

export default sections;
