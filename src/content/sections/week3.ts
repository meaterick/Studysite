import type { SectionMeta } from "../types";

// Week 3 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "neurons-mlp": {
    "tier": "core",
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
        "explanation": "$W_{10}\\cdots W_1 x$는 결국 행렬 하나로 합쳐지므로 단일 선형 변환과 같다. 코드로 두 결과를 비교하면 `np.allclose`가 True다."
      },
      {
        "id": "w3-neurons-mlp-c4",
        "question": "위 XOR 신경망($h_1 = \\mathrm{ReLU}(x_1 + x_2)$, $h_2 = \\mathrm{ReLU}(x_1 + x_2 - 1)$, 출력 $h_1 - 2h_2$)에 $(1, 1)$을 넣으면 출력은?",
        "choices": [
          "0",
          "1",
          "2",
          "−1"
        ],
        "answer": 0,
        "explanation": "$h_1 = \\mathrm{ReLU}(2) = 2$, $h_2 = \\mathrm{ReLU}(1) = 1$이므로 출력은 $2 - 2 \\cdot 1 = 0$이다. 두 입력이 모두 1이면 XOR은 0이다."
      },
      {
        "id": "w3-neurons-mlp-c5",
        "question": "입력 3 → 은닉 4 → 출력 1인 MLP(편향 포함)의 파라미터 수는?",
        "choices": [
          "21",
          "12",
          "16",
          "19"
        ],
        "answer": 0,
        "explanation": "$W_1$ 12개 + $b_1$ 4개 + $W_2$ 4개 + $b_2$ 1개 = 21개다. 층마다 입력 수와 출력 수의 곱에 편향(출력 수)을 더한다."
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
    "tier": "core",
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
      },
      {
        "id": "w3-backprop-c4",
        "question": "$z = e^a$ 노드에서 $a = 0$이고 상류 기울기가 $g = 3$이면 $\\partial L/\\partial a$는?",
        "choices": [
          "3",
          "0",
          "1",
          "$e^3$"
        ],
        "answer": 0,
        "explanation": "지수 함수의 국소 미분은 자기 자신 $e^a$이고, $a = 0$이면 $e^0 = 1$이다. 상류 기울기 3을 곱하면 3이다."
      },
      {
        "id": "w3-backprop-c5",
        "question": "시그모이드 노드의 출력이 $z = 0.5$일 때 국소 미분 $\\partial z/\\partial a$는?",
        "choices": [
          "0.25",
          "0.5",
          "1",
          "0"
        ],
        "answer": 0,
        "explanation": "$z(1 - z) = 0.5 \\times 0.5 = 0.25$로, 이것이 시그모이드 국소 미분의 최댓값이다. 그래서 시그모이드를 깊게 쌓으면 기울기가 빠르게 줄어든다."
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
    "tier": "core",
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
      },
      {
        "id": "w3-python-for-autograd-c4",
        "question": "`f = lambda x, y: x * y + 1`일 때 `f(3, 4)`의 결과는?",
        "choices": [
          "13",
          "12",
          "7",
          "오류"
        ],
        "answer": 0,
        "explanation": "`lambda x, y: x * y + 1`은 `def f(x, y): return x * y + 1`과 같다. $3 \\times 4 + 1 = 13$이다."
      },
      {
        "id": "w3-python-for-autograd-c5",
        "question": "Value의 `__add__`에서 `o = o if isinstance(o, Value) else Value(o)`를 쓰는 이유는?",
        "choices": [
          "`Value(2.0) + 3`처럼 일반 숫자가 들어와도 Value로 감싸 같은 방식으로 계산하려고",
          "덧셈을 빠르게 하려고",
          "기울기를 0으로 초기화하려고",
          "재귀를 멈추려고"
        ],
        "answer": 0,
        "explanation": "일반 숫자에는 `.data`, `.grad`가 없다. 숫자를 Value로 감싸 두면 덧셈과 역전파 코드를 한 가지로 쓸 수 있다."
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
    "tier": "core",
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
        "explanation": "$\\frac{d}{dz}\\tanh z = 1 - \\tanh^2 z$. 이 식으로 채운 역전파는 수치미분과 $10^{-11}$ 수준까지 일치한다."
      },
      {
        "id": "w3-micrograd-c4",
        "question": "Value로 만든 학습 루프에서 매 스텝 `w.grad = 0.0`으로 되돌리지 않으면 어떻게 되는가?",
        "choices": [
          "기울기가 `+=`로 이전 스텝 값 위에 쌓여 갈수록 커지고 학습이 불안정해진다",
          "기울기가 항상 0이 된다",
          "아무 차이가 없다",
          "순전파가 계산되지 않는다"
        ],
        "answer": 0,
        "explanation": "`_backward`는 기울기를 누적한다(여러 경로를 합치기 위해). 스텝이 바뀌면 지난 기울기는 버려야 하므로 0으로 초기화한다. PyTorch의 `zero_grad()`와 같은 역할이다."
      },
      {
        "id": "w3-micrograd-c5",
        "question": "`loss.backward()`를 호출한 직후 채워지는 것은?",
        "choices": [
          "그래프에 있는 모든 Value의 `.grad`(손실에 대한 기울기)",
          "모든 Value의 `.data`",
          "갱신된 파라미터 값",
          "새 계산 그래프"
        ],
        "answer": 0,
        "explanation": "`backward()`는 기울기만 계산한다. 파라미터를 바꾸는 것은 그 뒤의 갱신 코드(`w.data -= lr * w.grad`)이고, PyTorch에서는 `optimizer.step()`이 맡는다."
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
    "tier": "core",
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
        "question": "SGD·Momentum·Adam을 비교할 때 가장 적절한 결론은?",
        "choices": [
          "Adam은 모든 문제에서 SGD보다 빠르다",
          "같은 학습률이면 Momentum이 SGD보다 유리하지만, 잘 튜닝된 SGD가 단순한 문제에서 가장 정확할 수도 있다",
          "Momentum은 항상 발산한다",
          "최적화기는 결과에 영향을 주지 않는다"
        ],
        "answer": 1,
        "explanation": "최적화기 선택은 \"정답\"이 아니라 트레이드오프다. Adam은 학습률에 덜 민감한 좋은 기본값이고, 튜닝 여유가 있으면 SGD+Momentum이 이기는 경우도 많다."
      },
      {
        "id": "w3-optimizers-c4",
        "question": "데이터가 2,000개이고 배치 크기가 50이면 한 에폭은 몇 번의 반복(갱신)인가?",
        "choices": [
          "40번",
          "50번",
          "2,000번",
          "1번"
        ],
        "answer": 0,
        "explanation": "한 에폭은 데이터를 한 바퀴 보는 것이므로 $2000 / 50 = 40$번의 미니배치 갱신이다."
      },
      {
        "id": "w3-optimizers-c5",
        "question": "Momentum($\\beta = 0.9$, $v_0 = 0$, $v \\leftarrow \\beta v + g$)에서 기울기가 세 번 연속 $g = 1$이면 $v_3$은?",
        "choices": [
          "2.71",
          "3",
          "1",
          "0.729"
        ],
        "answer": 0,
        "explanation": "$v_1 = 1$, $v_2 = 0.9 + 1 = 1.9$, $v_3 = 1.71 + 1 = 2.71$이다. 같은 방향이 계속되면 최대 $1/(1 - \\beta) = 10$배까지 커진다."
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
    "tier": "core",
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
        "explanation": "대칭성이 깨지지 않는다. 실제로 200스텝을 학습해도 세 열이 완전히 같게 남는다. 작은 무작위 값으로 시작해야 한다."
      },
      {
        "id": "w3-init-stability-c4",
        "question": "fan_in = 256, fan_out = 256인 tanh 층에 Xavier 초기화 $\\mathrm{Var}(W) = 2/(\\text{fan\\_in} + \\text{fan\\_out})$를 쓰면 가중치의 표준편차는?",
        "choices": [
          "0.0625",
          "0.125",
          "0.0039",
          "0.088"
        ],
        "answer": 0,
        "explanation": "$\\mathrm{Var}(W) = 2/512 = 1/256$이므로 표준편차는 $1/16 = 0.0625$다. 0.088은 같은 층의 He 초기화($\\sqrt{2/256}$) 값이다."
      },
      {
        "id": "w3-init-stability-c5",
        "question": "폭 256인 ReLU 층 10개를 표준편차 1인 가중치로 초기화하면 마지막 층 활성화의 크기는 대략 어떻게 되는가?",
        "choices": [
          "층마다 약 11배씩 커져 천문학적으로 커진다",
          "1 근처로 유지된다",
          "정확히 0이 된다",
          "층마다 절반으로 줄어든다"
        ],
        "answer": 0,
        "explanation": "$\\mathrm{Var}(z) \\approx \\text{fan\\_in} \\cdot \\mathrm{Var}(w) \\cdot \\mathrm{Var}(x)$이고 ReLU가 절반을 깎으므로 분산이 층마다 약 128배, 표준편차는 약 11배가 된다. 10층이면 $10^{10}$ 규모다."
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
  "pytorch-core": {
    "tier": "core",
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
      },
      {
        "id": "w3-pytorch-core-c4",
        "question": "예측 `pred`의 shape이 `(64, 1)`이고 정답 `y`의 shape이 `(64,)`일 때 `((pred - y) ** 2).mean()`의 문제는?",
        "choices": [
          "브로드캐스팅으로 `(64, 64)` 차이 행렬이 만들어져 엉뚱한 값을 평균 낸다",
          "오류가 나서 실행이 멈춘다",
          "정확히 원하는 MSE가 계산된다",
          "기울기가 계산되지 않는다"
        ],
        "answer": 0,
        "explanation": "오른쪽부터 비교하면 1과 64(1이 복제), 64와 없음이라 `(64, 64)`가 된다. 오류 없이 틀린 손실이 계산되는 조용한 버그라 shape을 맞춰야 한다."
      },
      {
        "id": "w3-pytorch-core-c5",
        "question": "학습 중 손실을 기록할 때 `losses.append(loss)` 대신 `losses.append(loss.item())`을 쓰는 이유는?",
        "choices": [
          "텐서를 그대로 모으면 계산 그래프가 해제되지 않아 메모리가 계속 늘어나기 때문",
          "`.item()`이 손실을 더 정확하게 만들기 때문",
          "`.item()`이 역전파를 실행하기 때문",
          "리스트에는 텐서를 넣을 수 없기 때문"
        ],
        "answer": 0,
        "explanation": "손실 텐서는 자신을 만든 계산 그래프를 참조한다. `.item()`은 파이썬 숫자만 꺼내 그래프와의 연결을 끊는다."
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
  "normalization": {
    "tier": "supplement",
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
      },
      {
        "id": "w3-normalization-c4",
        "question": "Transformer의 은닉 상태 텐서 모양이 (배치 $B$, 길이 $T$, $d_{model}$)일 때, LayerNorm은 평균·분산을 어떻게 계산하는가?",
        "choices": [
          "문장 하나의 모든 토큰($T$개)을 모아 특징마다 계산한다",
          "배치 전체($B \\times T$개 토큰)를 모아 특징마다 계산한다",
          "토큰마다 따로, 그 토큰 벡터의 $d_{model}$개 값으로 계산한다",
          "배치의 첫 토큰으로 계산한 통계를 모든 토큰에 쓴다"
        ],
        "answer": 2,
        "explanation": "LayerNorm은 마지막 축($d_{model}$)만 본다. 같은 문장의 다른 토큰도 참고하지 않으므로, 문장 길이·패딩·배치 구성이 바뀌어도, 생성 중에 토큰이 추가되어도 기존 토큰의 결과가 변하지 않는다. 두 번째 선택지는 BatchNorm을 시퀀스에 적용한 방식에 가깝다."
      },
      {
        "id": "w3-normalization-c5",
        "question": "$z = \\begin{pmatrix}2 & 4\\\\ 6 & 8\\end{pmatrix}$(행 = 샘플)에서 BatchNorm이 특징 2(둘째 열)에 대해 계산하는 평균과 분산은?",
        "choices": [
          "평균 6, 분산 4",
          "평균 7, 분산 1",
          "평균 5, 분산 5",
          "평균 3, 분산 1"
        ],
        "answer": 0,
        "explanation": "BN은 같은 특징의 샘플들(4와 8)로 계산한다: 평균 6, 분산 $\\frac{(4-6)^2 + (8-6)^2}{2} = 4$. 평균 7·분산 1은 LN의 샘플 2 통계다."
      },
      {
        "id": "w3-normalization-c6",
        "question": "NumPy에서 shape `(B, d)`인 배열에 LayerNorm의 평균을 구하는 코드는?",
        "choices": [
          "`z.mean(axis=1, keepdims=True)`",
          "`z.mean(axis=0)`",
          "`z.mean()`",
          "`z.mean(axis=0, keepdims=True)`"
        ],
        "answer": 0,
        "explanation": "LN은 샘플(행)마다 특징 축으로 평균을 낸다. `axis=1`이고, 각 행에서 빼려면 `keepdims=True`로 `(B, 1)` 모양을 남긴다. `axis=0`은 BatchNorm 쪽이다."
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
  "pytorch-practice": {
    "tier": "supplement",
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
        "explanation": "행렬 곱의 각 원소 계산은 서로 독립이라 병렬화에 최적이다. 벡터화만으로도 파이썬 반복문보다 수백 배 빨라질 수 있다."
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
      },
      {
        "id": "w3-pytorch-practice-c4",
        "question": "BF16이 FP16보다 대형 모델 학습에서 선호되는 주된 이유는?",
        "choices": [
          "FP32와 같은 지수 범위를 가져 loss scaling 없이도 underflow·overflow가 드물기 때문",
          "FP16보다 유효숫자가 많아 더 정밀하기 때문",
          "메모리를 FP16의 절반만 쓰기 때문",
          "CPU에서만 동작하기 때문"
        ],
        "answer": 0,
        "explanation": "BF16은 지수 8비트(FP32와 같음), 가수 7비트로 범위가 넓고 정밀도가 낮다. FP16은 정밀도는 더 높지만 범위가 좁아 작은 기울기가 사라지기 쉽다. 둘 다 16비트라 메모리는 같다."
      },
      {
        "id": "w3-pytorch-practice-c5",
        "question": "FP16에서 기울기 $10^{-8}$은 0이 된다. loss scaling으로 손실을 1024배 키우면 이 기울기는?",
        "choices": [
          "약 $10^{-5}$가 되어 FP16에서 살아남고, 갱신 전에 1024로 다시 나눈다",
          "여전히 0이다",
          "inf가 된다",
          "1024가 된다"
        ],
        "answer": 0,
        "explanation": "기울기도 손실과 같은 배율로 커져 약 $1.02 \\times 10^{-5}$가 되고, 이는 FP16이 (비정규수로) 표현할 수 있다. 갱신 직전에 배율을 되돌린다."
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
  "dl-regularization": {
    "tier": "supplement",
    "goal": "가중치 감쇠를 갱신식으로 설명하고, 역드롭아웃·조기 종료·워밍업+코사인 학습률 스케줄을 구현하며, 신경망의 과적합이 검증 손실에서 먼저 드러나는 이유를 설명할 수 있다.",
    "checks": [
      {
        "id": "w3-dl-regularization-c1",
        "question": "학습 중 드롭아웃 확률 $p = 0.2$로 뉴런을 끌 때 역드롭아웃(inverted dropout)은 살아남은 값을 어떻게 하는가?",
        "choices": [
          "$1/(1-0.2) = 1.25$배 한다",
          "$0.8$배 한다",
          "그대로 둔다",
          "평가 때 $0.8$배 한다"
        ],
        "answer": 0,
        "explanation": "학습 중 평균이 $(1-p)$배로 줄어드는 것을 $1/(1-p)$배로 되돌려 평균을 유지한다. 그러면 평가 때는 드롭아웃을 끄기만 하면 되고 아무 보정도 필요 없다."
      },
      {
        "id": "w3-dl-regularization-c2",
        "question": "훈련 정확도는 계속 오르고 검증 정확도는 그대로인데, 검증 손실(교차 엔트로피)만 크게 오르고 있다. 가장 알맞은 해석은?",
        "choices": [
          "모델이 틀린 검증 샘플에 대해 점점 더 확신하고 있다(과신, 과적합의 신호)",
          "모델이 더 좋아지고 있다",
          "학습률이 너무 작다",
          "검증 데이터에 버그가 있다"
        ],
        "answer": 0,
        "explanation": "교차 엔트로피는 확신하며 틀린 예측에 큰 벌점을 준다. 예를 들어 정확도는 0.87 그대로인데 검증 손실이 0.32에서 0.95로 오를 수 있다. 조기 종료·가중치 감쇠·드롭아웃이 이를 막는다."
      },
      {
        "id": "w3-dl-regularization-c3",
        "question": "SGD에서 학습률 $\\eta = 0.1$, 가중치 감쇠 $\\lambda = 0.01$이면 기울기 항과 별도로 매 스텝 가중치에 곱해지는 값은?",
        "choices": [
          "$0.999$",
          "$0.99$",
          "$0.9$",
          "$1.001$"
        ],
        "answer": 0,
        "explanation": "$w \\leftarrow (1 - \\eta\\lambda)w - \\eta g$이므로 $1 - 0.1 \\times 0.01 = 0.999$배다."
      },
      {
        "id": "w3-dl-regularization-c4",
        "question": "조기 종료(patience = 3)로 학습 중 검증 손실이 에폭별로 $0.50, 0.42, 0.40, 0.41, 0.43, 0.44$였다. 어느 시점의 모델을 최종으로 쓰는가?",
        "choices": [
          "3번째 에폭(검증 손실 0.40)",
          "6번째 에폭(마지막)",
          "1번째 에폭",
          "4번째 에폭"
        ],
        "answer": 0,
        "explanation": "0.40 이후 세 번(0.41, 0.43, 0.44) 연속 개선이 없어 6번째 에폭 뒤에 멈추고, 검증 손실이 가장 낮았던 3번째 에폭의 체크포인트를 쓴다."
      },
      {
        "id": "w3-dl-regularization-c5",
        "question": "역드롭아웃($p = 0.5$)을 쓴 모델을 평가할 때 해야 할 일은?",
        "choices": [
          "아무것도 하지 않는다. 드롭아웃을 끄고 전체 망을 그대로 쓴다(`model.eval()`)",
          "모든 활성화를 0.5배 한다",
          "모든 활성화를 2배 한다",
          "평가 때도 절반을 끈다"
        ],
        "answer": 0,
        "explanation": "학습 중 살아남은 값을 이미 $1/(1-p) = 2$배 해 평균을 맞췄으므로, 평가 때는 보정 없이 전체 뉴런을 쓴다."
      }
    ],
    "quizIds": [
      "w3-q19"
    ],
    "references": [
      {
        "title": "Srivastava et al. (2014) — Dropout",
        "url": "https://jmlr.org/papers/v15/srivastava14a.html",
        "note": "드롭아웃 원 논문 (영문)"
      },
      {
        "title": "Dive into Deep Learning — 5.6 Dropout, 12.11 Learning Rate Scheduling",
        "url": "https://d2l.ai/",
        "note": "드롭아웃·학습률 스케줄을 코드와 함께 (영문, 무료)"
      }
    ]
  },
  "autodiff-theory": {
    "tier": "advanced",
    "goal": "야코비안-벡터 곱(JVP)과 벡터-야코비안 곱(VJP)으로 순방향·역방향 자동미분의 비용을 비교하고, 이원수로 순방향 모드를 구현하며, 그레이디언트 체크포인팅의 메모리·계산 거래를 설명할 수 있다.",
    "checks": [
      {
        "id": "w3-autodiff-theory-c1",
        "question": "파라미터 100만 개, 출력(손실) 1개인 신경망의 기울기 전체를 구할 때 각 모드가 지나가야 하는 횟수는?",
        "choices": [
          "순방향 100만 번, 역방향 1번",
          "순방향 1번, 역방향 100만 번",
          "둘 다 1번",
          "둘 다 100만 번"
        ],
        "answer": 0,
        "explanation": "순방향 모드(JVP)는 입력 방향마다 한 번, 역방향 모드(VJP)는 출력마다 한 번 지나간다. 손실이 스칼라라서 역방향이 압도적으로 유리하다."
      },
      {
        "id": "w3-autodiff-theory-c2",
        "question": "이원수 $a + b\\varepsilon$($\\varepsilon^2 = 0$)으로 $f(x) = x^2$을 $x = 3$에서 계산하면 $(3 + \\varepsilon)^2$의 $\\varepsilon$ 계수는?",
        "choices": [
          "6",
          "9",
          "3",
          "1"
        ],
        "answer": 0,
        "explanation": "$(3+\\varepsilon)^2 = 9 + 6\\varepsilon + \\varepsilon^2 = 9 + 6\\varepsilon$. $\\varepsilon$ 계수가 $f'(3) = 6$이다. 근사가 아닌 정확한 미분이다."
      },
      {
        "id": "w3-autodiff-theory-c3",
        "question": "층 400개인 망에서 그레이디언트 체크포인팅을 20층 간격으로 하면 얻는 것과 잃는 것은?",
        "choices": [
          "저장할 활성화가 약 400개에서 40개 수준으로 줄고, 순전파를 대략 한 번 더 계산한다",
          "메모리와 계산이 모두 준다",
          "기울기가 근사값이 된다",
          "메모리는 같고 계산만 준다"
        ],
        "answer": 0,
        "explanation": "체크포인트 $L/k$개와 다시 계산하는 구간 $k$개만 메모리에 두므로 $k = \\sqrt{L}$에서 $O(\\sqrt{L})$이다. 대가는 구간마다 순전파를 다시 하는 계산이고, 기울기는 정확히 같다."
      },
      {
        "id": "w3-autodiff-theory-c4",
        "question": "이원수로 $f(x) = 2x^2$을 $x = 1$에서 계산할 때, $x = 1 + \\varepsilon$을 넣은 결과는?",
        "choices": [
          "$2 + 4\\varepsilon$",
          "$2 + 2\\varepsilon$",
          "$4 + 2\\varepsilon$",
          "$2 + \\varepsilon$"
        ],
        "answer": 0,
        "explanation": "$2(1 + \\varepsilon)^2 = 2(1 + 2\\varepsilon + \\varepsilon^2) = 2 + 4\\varepsilon$($\\varepsilon^2 = 0$). 값 2와 미분 $f'(1) = 4$를 함께 얻는다."
      },
      {
        "id": "w3-autodiff-theory-c5",
        "question": "입력 1개, 출력 1,000개인 함수의 모든 출력에 대한 미분을 구할 때 유리한 자동미분 모드는?",
        "choices": [
          "순방향 모드(1번이면 된다)",
          "역방향 모드(1번이면 된다)",
          "둘 다 1,000번 필요하다",
          "수치미분만 가능하다"
        ],
        "answer": 0,
        "explanation": "순방향은 입력 차원만큼, 역방향은 출력 차원만큼 지나간다. 입력이 1개면 순방향 한 번으로 출력 1,000개의 미분을 모두 얻는다."
      }
    ],
    "quizIds": [
      "w3-q20"
    ],
    "references": [
      {
        "title": "Baydin et al. (2018) — Automatic Differentiation in Machine Learning: a Survey",
        "url": "https://jmlr.org/papers/v18/17-468.html",
        "note": "순방향·역방향 모드의 표준 정리 (영문)"
      },
      {
        "title": "Chen et al. (2016) — Training Deep Nets with Sublinear Memory Cost",
        "url": "https://arxiv.org/abs/1604.06174",
        "note": "그레이디언트 체크포인팅 (영문, 연구 논문)"
      }
    ]
  },
  "adam-theory": {
    "tier": "advanced",
    "goal": "Adam 편향 보정을 $\\mathbb{E}[m_t] = (1-\\beta_1^t)\\mathbb{E}[g]$로 유도하고, Adam에서 L2 정규화와 가중치 감쇠가 달라지는 이유와 AdamW, 학습률 워밍업의 필요성을 설명할 수 있다.",
    "checks": [
      {
        "id": "w3-adam-theory-c1",
        "question": "$\\beta_1 = 0.9$, 기울기가 항상 $g$일 때 $t = 2$의 $m_2$는? ($m_0 = 0$)",
        "choices": [
          "$0.19g$",
          "$0.1g$",
          "$0.81g$",
          "$g$"
        ],
        "answer": 0,
        "explanation": "$m_1 = 0.1g$, $m_2 = 0.9 \\times 0.1g + 0.1g = 0.19g = (1 - 0.9^2)g$. 그래서 $1 - \\beta_1^t$로 나누면 정확히 $g$가 된다."
      },
      {
        "id": "w3-adam-theory-c2",
        "question": "Adam에 L2 항 $\\lambda w$를 기울기로 더할 때 생기는 문제로 옳은 것은?",
        "choices": [
          "감쇠 항도 $\\sqrt{\\hat v}$로 나눠져 파라미터마다 감쇠 강도가 달라지고 $\\lambda$의 의미가 흐려진다",
          "Adam이 SGD와 똑같아진다",
          "학습률이 자동으로 0이 된다",
          "편향 보정이 불가능해진다"
        ],
        "answer": 0,
        "explanation": "기울기가 큰 파라미터는 감쇠가 약해지고, 데이터 기울기가 0인 파라미터는 $\\lambda$와 무관하게 약 $\\eta$씩 줄어든다(예: $\\lambda$를 1만 배 바꿔도 이동량이 같다). AdamW는 감쇠를 갱신에서 따로 적용한다."
      },
      {
        "id": "w3-adam-theory-c3",
        "question": "Transformer 학습에서 처음 수천 스텝 동안 학습률을 0 근처에서 서서히 올리는(워밍업) 주된 이유는?",
        "choices": [
          "초반 $\\hat v$ 추정이 불안정해 일부 파라미터의 유효 학습률이 폭주할 수 있어서",
          "GPU 예열이 필요해서",
          "데이터를 섞는 데 시간이 걸려서",
          "손실이 처음에 0이라서"
        ],
        "answer": 0,
        "explanation": "몇 개의 기울기로 추정한 $\\hat v$는 분산이 커서 $\\eta/\\sqrt{\\hat v}$가 매우 커질 수 있다(RAdam의 분석). 워밍업은 그동안 걸음을 작게 유지한다."
      },
      {
        "id": "w3-adam-theory-c4",
        "question": "$\\beta_2 = 0.999$에서 편향 보정 없이 Adam을 쓰면 $t = 100$에서 $v_t$는 실제의 약 몇 배로 작게 잡히는가?",
        "choices": [
          "약 0.095배",
          "약 0.65배",
          "거의 1배",
          "약 0.001배"
        ],
        "answer": 0,
        "explanation": "$\\mathbb{E}[v_t] = (1 - \\beta_2^t)\\mathbb{E}[g^2]$이고 $1 - 0.999^{100} \\approx 0.095$다. $\\sqrt{v}$가 약 0.31배라 걸음이 약 3배로 부풀려진다."
      },
      {
        "id": "w3-adam-theory-c5",
        "question": "AdamW에서 가중치 감쇠가 적용되는 방식으로 옳은 것은?",
        "choices": [
          "기울기와 분리해 갱신 단계에서 모든 파라미터에 같은 비율 $(1 - \\eta\\lambda)$로 건다",
          "기울기에 $\\lambda w$를 더한 뒤 $\\sqrt{\\hat v}$로 나눈다",
          "학습률을 매 스텝 $\\lambda$배 줄인다",
          "편향 보정 분모에 $\\lambda$를 더한다"
        ],
        "answer": 0,
        "explanation": "Adam에 L2를 기울기로 넣으면 $\\sqrt{\\hat v}$로 나눠져 감쇠 강도가 파라미터마다 달라진다. AdamW는 감쇠를 기울기에서 떼어 내 같은 비율로 적용한다."
      }
    ],
    "quizIds": [
      "w3-q21"
    ],
    "references": [
      {
        "title": "Kingma & Ba (2015) — Adam: A Method for Stochastic Optimization",
        "url": "https://arxiv.org/abs/1412.6980",
        "note": "편향 보정 유도가 2~3절에 있다 (영문)"
      },
      {
        "title": "Loshchilov & Hutter (2019) — Decoupled Weight Decay Regularization",
        "url": "https://arxiv.org/abs/1711.05101",
        "note": "AdamW (영문, 연구 논문)"
      },
      {
        "title": "Liu et al. (2020) — On the Variance of the Adaptive Learning Rate and Beyond",
        "url": "https://arxiv.org/abs/1908.03265",
        "note": "워밍업이 필요한 이유와 RAdam (영문)"
      }
    ]
  },
  "gradient-flow": {
    "tier": "advanced",
    "goal": "역전파되는 기울기를 야코비안 전치의 곱으로 쓰고 소실·폭발을 특이값으로 설명하며, 잔차 연결이 기울기 경로를 보존하는 이유와 노름 기준 기울기 클리핑을 구현할 수 있다.",
    "checks": [
      {
        "id": "w3-gradient-flow-c1",
        "question": "층마다 기울기 노름을 평균 0.8배로 줄이는 망에서 50층을 거슬러 내려가면 기울기는 대략?",
        "choices": [
          "$10^{-5}$배",
          "$0.4$배",
          "$10^{-2}$배",
          "그대로"
        ],
        "answer": 0,
        "explanation": "$0.8^{50} \\approx 1.4 \\times 10^{-5}$. 행렬 곱의 사슬에서는 작은 비율 차이가 지수적으로 누적된다."
      },
      {
        "id": "w3-gradient-flow-c2",
        "question": "잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$에서 $h_{l-1}$에 대한 야코비안은?",
        "choices": [
          "$I + \\partial F/\\partial h$",
          "$\\partial F/\\partial h$",
          "$I$",
          "$2I$"
        ],
        "answer": 0,
        "explanation": "항등 경로의 야코비안 $I$가 더해지므로, 기울기는 층마다 원래 값이 그대로 전달되는 길을 가진다. 같은 작은 초기화라도 잔차 망은 50층에서 기울기가 사라지지 않는다."
      },
      {
        "id": "w3-gradient-flow-c3",
        "question": "전체 기울기 노름이 130이고 클리핑 임계값이 5일 때 노름 기준 클리핑의 결과로 옳은 것은?",
        "choices": [
          "모든 기울기에 $5/130$을 곱해 방향은 유지하고 노름만 5로 만든다",
          "각 원소를 $[-5, 5]$로 자른다",
          "기울기를 0으로 만든다",
          "학습률을 5로 바꾼다"
        ],
        "answer": 0,
        "explanation": "$g \\leftarrow g \\cdot c/\\lVert g\\rVert$. 원소별 자르기와 달리 방향이 왜곡되지 않는다."
      },
      {
        "id": "w3-gradient-flow-c4",
        "question": "클리핑 임계값이 5인데 전체 기울기 노름이 3이라면 노름 기준 클리핑의 결과는?",
        "choices": [
          "아무것도 바꾸지 않는다",
          "노름을 5로 키운다",
          "모든 기울기에 $5/3$을 곱한다",
          "기울기를 0으로 만든다"
        ],
        "answer": 0,
        "explanation": "클리핑은 노름이 임계값을 **넘을 때만** 줄이는 안전장치다. 임계값 이하의 기울기는 그대로 둔다."
      },
      {
        "id": "w3-gradient-flow-c5",
        "question": "기울기 $[30, 40]$(노름 50)을 원소마다 $[-5, 5]$로 자르는 방식과 노름 5로 클리핑하는 방식의 결과를 바르게 짝지은 것은?",
        "choices": [
          "원소별: $[5, 5]$(방향이 바뀜) / 노름: $[3, 4]$(방향 유지)",
          "원소별: $[3, 4]$ / 노름: $[5, 5]$",
          "둘 다 $[3, 4]$",
          "둘 다 $[5, 5]$"
        ],
        "answer": 0,
        "explanation": "원소별 자르기는 각 성분을 5로 잘라 $[5, 5]$가 되어 방향이 45도로 바뀐다. 노름 클리핑은 $50 \\to 5$, 즉 0.1배를 곱해 $[3, 4]$로 방향을 유지한다."
      }
    ],
    "quizIds": [
      "w3-q22"
    ],
    "references": [
      {
        "title": "Pascanu, Mikolov & Bengio (2013) — On the difficulty of training recurrent neural networks",
        "url": "https://arxiv.org/abs/1211.5063",
        "note": "기울기 소실·폭발의 분석과 노름 클리핑 (영문)"
      },
      {
        "title": "He et al. (2016) — Identity Mappings in Deep Residual Networks",
        "url": "https://arxiv.org/abs/1603.05027",
        "note": "잔차 연결이 기울기를 직접 전달하는 이유 (영문)"
      }
    ]
  }
};

export default sections;
