import type { SectionMeta } from "../types";

// Week 1 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "ai-landscape": {
    "tier": "core",
    "goal": "AI ⊃ 머신러닝 ⊃ 딥러닝의 포함관계와, 생성형 AI·파운데이션 모델이 이들과 겹치는 방식을 설명하고, 학습을 \"손실 $L(\\theta)$를 줄이는 $\\theta$ 찾기\"로 정의할 수 있다.",
    "checks": [
      {
        "id": "w1-ai-landscape-c1",
        "question": "다음 중 **머신러닝에 속하지 않는** AI 시스템은?",
        "choices": [
          "사람이 작성한 if-else 규칙만으로 스팸을 거르는 필터",
          "스팸/정상 메일 데이터로 학습한 로지스틱 회귀 필터",
          "ImageNet으로 학습한 CNN 분류기",
          "다음 토큰 예측으로 사전학습한 LLM"
        ],
        "answer": 0,
        "explanation": "머신러닝의 정의적 특징은 규칙을 사람이 직접 코딩하지 않고 **데이터로부터 파라미터를 학습**한다는 점이다. 손으로 짠 규칙 시스템은 AI이지만 머신러닝은 아니다."
      },
      {
        "id": "w1-ai-landscape-c2",
        "question": "\"머신러닝 = 손실 $L(\\theta)$를 최소화하는 $\\theta$를 찾는 최적화 문제\"라는 정의에서 $\\theta$가 가리키는 것은?",
        "choices": [
          "사람이 학습 전에 정하는 학습률",
          "모델 함수 안에서 데이터로부터 값이 정해지는 파라미터",
          "정답 레이블 $y$",
          "입력 피처 $x$"
        ],
        "answer": 1,
        "explanation": "$\\theta$는 모델 $f_\\theta$ 안의 조절 가능한 숫자(파라미터)다. 학습률처럼 사람이 정하는 값은 하이퍼파라미터, $x$와 $y$는 데이터다."
      },
      {
        "id": "w1-ai-landscape-c3",
        "question": "CLIP 이미지 인코더처럼 대규모 사전학습된 범용 모델이지만 새 이미지를 **만들어내지 않고** 표현(벡터)만 추출하는 모델은 어떻게 분류하는 것이 가장 정확한가?",
        "choices": [
          "생성형 AI이지만 파운데이션 모델은 아니다",
          "파운데이션 모델이지만 생성형 AI는 아니다",
          "머신러닝이 아니다",
          "LLM의 한 종류다"
        ],
        "answer": 1,
        "explanation": "파운데이션 모델의 핵심은 \"대규모·범용·사전학습·재사용\"이다. 생성 능력이 없으면 생성형 AI로 분류되지 않는다. 파운데이션 모델과 생성형 AI는 포함관계가 아니라 겹치는 관계다."
      },
      {
        "id": "w1-ai-landscape-c4",
        "question": "\"생성형 AI는 딥러닝의 부분집합이다\"라는 주장에 대한 가장 정확한 평가는?",
        "choices": [
          "옳다. 모든 생성 모델은 다층 신경망이다",
          "틀리다. 생성형 AI는 기능(새 데이터 생성) 기준의 분류라서, n-gram 언어모델처럼 신경망이 아닌 생성 모델도 있다",
          "옳다. 딥러닝 모델은 모두 무언가를 생성한다",
          "틀리다. 생성형 AI는 머신러닝이 아니다"
        ],
        "answer": 1,
        "explanation": "AI ⊃ ML ⊃ DL은 방법 기준의 포함관계이고, 생성형 AI는 기능 기준의 범주라 두 분류가 겹친다. 오늘날의 생성형 AI는 대부분 딥러닝이지만, n-gram·HMM 같은 통계 모델도 새 문장을 생성하고, CNN 분류기처럼 생성하지 않는 딥러닝 모델도 많다."
      }
    ],
    "quizIds": [
      "w1-q5",
      "w1-q6",
      "w1-q10"
    ],
    "references": [
      {
        "title": "Google Machine Learning Crash Course — Intro to Machine Learning",
        "url": "https://developers.google.com/machine-learning/intro-to-ml",
        "note": "머신러닝이 무엇이고 어떤 문제에 쓰는지 짧은 읽기 자료로 정리 (영문)"
      },
      {
        "title": "3Blue1Brown — But what is a neural network?",
        "url": "https://www.3blue1brown.com/lessons/neural-networks",
        "note": "\"파라미터를 가진 함수\"로서의 신경망을 시각적으로 보여주는 20분 영상"
      }
    ]
  },
  "ai-terms": {
    "tier": "core",
    "goal": "모델·파라미터·하이퍼파라미터, 학습·추론, 분류·회귀·생성, 판별·생성 모델, 4대 학습 패러다임을 정확한 정의로 구분할 수 있다.",
    "checks": [
      {
        "id": "w1-ai-terms-c1",
        "question": "인터넷 문장에서 \"다음 단어\"를 정답으로 삼아 LLM을 사전학습하는 방식은 어떤 학습 패러다임인가?",
        "choices": [
          "지도학습: 사람이 정답을 붙였으므로",
          "비지도학습: 정답이 전혀 없으므로",
          "자기지도학습: 데이터 자체에서 정답을 만들어내므로",
          "강화학습: 보상을 받으므로"
        ],
        "answer": 2,
        "explanation": "레이블(다음 단어)은 사람이 붙인 것이 아니라 원래 텍스트 안에 이미 있던 것을 가려서 맞히게 만든 것이다. 그래서 사람의 라벨링 비용이 데이터 규모의 병목이 되지 않는다."
      },
      {
        "id": "w1-ai-terms-c2",
        "question": "판별 모델과 생성 모델이 추정하는 대상을 올바르게 짝지은 것은?",
        "choices": [
          "판별: $P(x)$ / 생성: $P(y|x)$",
          "판별: $P(y|x)$ / 생성: $P(x)$ 또는 $P(x,y)$",
          "판별: $P(x,y)$ / 생성: $P(y)$",
          "둘 다 $P(y|x)$를 추정하고 크기만 다르다"
        ],
        "answer": 1,
        "explanation": "판별 모델은 입력이 주어졌을 때의 정답 확률 $P(y|x)$만 추정한다. 생성 모델은 데이터 자체의 분포를 추정하므로 새 표본을 뽑아낼 수 있다."
      },
      {
        "id": "w1-ai-terms-c3",
        "question": "같은 모델에서 학습(training)과 추론(inference)의 결정적 차이는?",
        "choices": [
          "추론 때만 손실을 계산한다",
          "학습 중에는 파라미터가 갱신되고, 추론 중에는 파라미터가 고정된다",
          "학습은 GPU, 추론은 CPU에서만 가능하다",
          "추론 때 하이퍼파라미터가 파라미터로 바뀐다"
        ],
        "answer": 1,
        "explanation": "추론은 학습이 끝나 고정된 파라미터로 새 입력의 출력을 계산하는 과정이다. ChatGPT에 질문할 때 서버에서 일어나는 일이 추론이다."
      }
    ],
    "quizIds": [
      "w1-q11",
      "w1-q12",
      "w1-q13",
      "w1-q14",
      "w1-q15"
    ],
    "references": [
      {
        "title": "Google ML Crash Course — Supervised Learning",
        "url": "https://developers.google.com/machine-learning/intro-to-ml/supervised",
        "note": "피처·레이블·모델·학습·추론 용어를 예시와 함께 정리"
      },
      {
        "title": "Stanford CS229 Lecture Notes",
        "url": "https://cs229.stanford.edu/main_notes.pdf",
        "note": "1장 지도학습 도입부: 같은 용어를 수학적으로 정의 (영문, 심화)"
      }
    ]
  },
  "python-basics": {
    "tier": "core",
    "goal": "변수·자료형·제어문·함수·리스트/튜플/집합/딕셔너리·클래스·예외 처리를 읽고, 짧은 함수를 직접 작성할 수 있다.",
    "checks": [
      {
        "id": "w1-python-basics-c1",
        "question": "`scores = [90, 85, 77, 60]`일 때 `scores[1:3]`의 결과는?",
        "choices": [
          "`[90, 85, 77]`",
          "`[85, 77]`",
          "`[85, 77, 60]`",
          "`[90, 85]`"
        ],
        "answer": 1,
        "explanation": "슬라이싱 `[시작:끝]`은 시작 인덱스는 포함하고 끝 인덱스는 **포함하지 않는다**. 인덱스는 0부터 세므로 1번(85), 2번(77)만 나온다."
      },
      {
        "id": "w1-python-basics-c2",
        "question": "중복을 자동으로 없애고 \"포함 여부\"를 빠르게 검사하고 싶을 때 가장 알맞은 자료구조는?",
        "choices": [
          "List",
          "Tuple",
          "Set",
          "문자열"
        ],
        "answer": 2,
        "explanation": "Set은 순서가 없고 중복을 허용하지 않는다. 중복 제거와 멤버십 검사가 주 용도다."
      },
      {
        "id": "w1-python-basics-c3",
        "question": "`a = [1, 2]; b = a; b.append(3)`을 실행한 뒤 `print(a)`의 결과는?",
        "choices": [
          "`[1, 2]`",
          "`[1, 2, 3]`",
          "`[3]`",
          "오류가 난다"
        ],
        "answer": 1,
        "explanation": "`b = a`는 복사본을 만드는 것이 아니라 같은 리스트 객체에 이름표를 하나 더 붙인다. 복사본이 필요하면 `a.copy()`를 쓴다."
      }
    ],
    "quizIds": [
      "w1-q27"
    ],
    "references": [
      {
        "title": "점프 투 파이썬 (위키독스)",
        "url": "https://wikidocs.net/book/1",
        "note": "한국어로 된 가장 널리 쓰이는 무료 파이썬 입문서: 2~5장이 이 단계 범위"
      },
      {
        "title": "Python 공식 자습서 (한국어)",
        "url": "https://docs.python.org/ko/3/tutorial/index.html",
        "note": "3~5장(자료구조), 8장(예외), 9장(클래스)을 필요할 때 찾아보기"
      }
    ]
  },
  "dev-tools": {
    "tier": "core",
    "goal": "가상환경·Colab·Git의 역할을 구분하고, NumPy 배열의 shape·axis·브로드캐스팅을 예측해 계산할 수 있다.",
    "checks": [
      {
        "id": "w1-dev-tools-c1",
        "question": "`x = np.array([[1, 2, 3], [4, 5, 6]])`일 때 `x.sum(axis=0)`의 결과는?",
        "choices": [
          "`[6, 15]`",
          "`[5, 7, 9]`",
          "`21`",
          "`[[5, 7, 9]]`"
        ],
        "answer": 1,
        "explanation": "`axis=0`은 첫 번째 축(행)이 합쳐져 사라진다. 같은 열끼리 더해 길이 3짜리 결과 `[1+4, 2+5, 3+6]`이 된다."
      },
      {
        "id": "w1-dev-tools-c2",
        "question": "shape이 `(4, 3)`인 배열에서 shape `(3,)`인 배열을 빼면 어떻게 되는가?",
        "choices": [
          "오류가 난다",
          "각 **행**에서 같은 `(3,)` 배열이 빼진다(브로드캐스팅)",
          "첫 번째 행에서만 빼진다",
          "결과 shape이 `(3, 4)`가 된다"
        ],
        "answer": 1,
        "explanation": "브로드캐스팅은 뒤쪽 축부터 크기를 비교한다. 3과 3이 맞으므로 `(3,)`이 4개 행 모두에 복제되어 적용된다. 반대로 `(4,)`를 빼려 하면 3≠4라 오류가 난다."
      },
      {
        "id": "w1-dev-tools-c3",
        "question": "프로젝트 A와 B가 서로 다른 버전의 라이브러리를 필요로 할 때 충돌을 막아주는 도구는?",
        "choices": [
          "Git",
          "가상환경(venv)",
          "Jupyter Notebook",
          "Matplotlib"
        ],
        "answer": 1,
        "explanation": "가상환경은 프로젝트마다 독립된 패키지 설치 공간을 만든다. Git은 코드 변경 이력 관리, Jupyter는 셀 단위 대화형 실행 환경이다."
      }
    ],
    "quizIds": [],
    "references": [
      {
        "title": "NumPy: the absolute basics for beginners",
        "url": "https://numpy.org/doc/stable/user/absolute_beginners.html",
        "note": "배열 생성·shape·인덱싱·축 연산 공식 입문서"
      },
      {
        "title": "NumPy Broadcasting",
        "url": "https://numpy.org/doc/stable/user/basics.broadcasting.html",
        "note": "브로드캐스팅 규칙을 그림으로 설명: 실습의 오류 원인을 확인할 때"
      },
      {
        "title": "Pro Git (한국어판)",
        "url": "https://git-scm.com/book/ko/v2",
        "note": "2장 Git의 기초만 읽어도 과제 제출에 충분"
      }
    ]
  },
  "vectors": {
    "tier": "core",
    "goal": "내적과 코사인 유사도를 손으로 계산하고, 코사인 유사도가 \"방향의 비슷함\"만 재는 이유를 설명할 수 있다.",
    "checks": [
      {
        "id": "w1-vectors-c1",
        "question": "$a = [2, 0]$, $b = [3, 4]$일 때 $a \\cdot b$와 $\\cos(a, b)$는?",
        "choices": [
          "$6$, $0.6$",
          "$6$, $0.8$",
          "$8$, $0.6$",
          "$14$, $1$"
        ],
        "answer": 0,
        "explanation": "$a\\cdot b = 2\\times3 + 0\\times4 = 6$, $|a|=2$, $|b|=5$이므로 $\\cos = 6/(2\\times5) = 0.6$."
      },
      {
        "id": "w1-vectors-c2",
        "question": "두 벡터의 코사인 유사도가 $-1$이라는 것은 무슨 뜻인가?",
        "choices": [
          "두 벡터가 직교한다",
          "두 벡터의 길이가 같다",
          "두 벡터가 정반대 방향을 향한다",
          "두 벡터 중 하나가 영벡터다"
        ],
        "answer": 2,
        "explanation": "$\\cos\\theta = -1$은 사잇각이 180°, 즉 완전히 반대 방향이라는 뜻이다. 직교(90°)는 0이다."
      },
      {
        "id": "w1-vectors-c3",
        "question": "벡터 $b$를 10배로 늘리면 $a\\cdot b$와 $\\cos(a, b)$는 각각 어떻게 되는가?",
        "choices": [
          "둘 다 10배가 된다",
          "내적은 10배, 코사인 유사도는 그대로",
          "내적은 그대로, 코사인 유사도는 10배",
          "둘 다 그대로"
        ],
        "answer": 1,
        "explanation": "코사인 유사도는 내적을 두 벡터의 길이로 나누므로 크기의 영향이 사라진다. 그래서 문서 길이가 달라도 주제의 유사도를 공정하게 비교할 수 있다."
      }
    ],
    "quizIds": [
      "w1-q1",
      "w1-q7"
    ],
    "references": [
      {
        "title": "3Blue1Brown — Dot products and duality",
        "url": "https://www.3blue1brown.com/lessons/dot-products",
        "note": "내적의 기하학적 의미(투영)를 시각적으로"
      },
      {
        "title": "Mathematics for Machine Learning (무료 PDF)",
        "url": "https://mml-book.github.io/",
        "note": "3장 해석기하: 내적·노름·각도의 정식 정의"
      }
    ]
  },
  "basis-matrix": {
    "tier": "core",
    "goal": "선형독립·기저·좌표의 관계를 설명하고, 행렬 곱이 함수 합성이라 순서를 바꾸면 결과가 달라지는 이유를 계산으로 보일 수 있다.",
    "checks": [
      {
        "id": "w1-basis-matrix-c1",
        "question": "기저 $b_1 = [1, 1]$, $b_2 = [1, -1]$로 벡터 $[5, 1]$을 나타낸 좌표 $(c_1, c_2)$는?",
        "choices": [
          "$(5, 1)$",
          "$(3, 2)$",
          "$(2, 3)$",
          "$(4, 1)$"
        ],
        "answer": 1,
        "explanation": "$c_1 + c_2 = 5$, $c_1 - c_2 = 1$을 풀면 $c_1 = 3$, $c_2 = 2$. 검산: $3[1,1] + 2[1,-1] = [5, 1]$."
      },
      {
        "id": "w1-basis-matrix-c2",
        "question": "다음 중 $\\mathbb{R}^2$의 기저가 **될 수 없는** 벡터 쌍은?",
        "choices": [
          "$[1, 0], [0, 1]$",
          "$[1, 1], [1, -1]$",
          "$[1, 2], [2, 4]$",
          "$[2, 0], [1, 3]$"
        ],
        "answer": 2,
        "explanation": "$[2,4] = 2[1,2]$이므로 두 벡터가 선형종속이다. 같은 직선 위의 벡터만으로는 평면 전체를 표현할 수 없다."
      },
      {
        "id": "w1-basis-matrix-c3",
        "question": "$(AB)x$를 계산할 때 $x$에 먼저 적용되는 변환과, $(AB)^\\top$을 올바르게 쓴 것은?",
        "choices": [
          "$A$가 먼저 / $A^\\top B^\\top$",
          "$B$가 먼저 / $B^\\top A^\\top$",
          "$A$가 먼저 / $B^\\top A^\\top$",
          "$B$가 먼저 / $A^\\top B^\\top$"
        ],
        "answer": 1,
        "explanation": "$(AB)x = A(Bx)$이므로 오른쪽의 $B$가 먼저 적용된다(함수 합성). 전치하면 순서가 뒤집혀 $(AB)^\\top = B^\\top A^\\top$이 되고, 이는 3주차 역전파에서 기울기가 거꾸로 흐르는 모양과 같다."
      }
    ],
    "quizIds": [
      "w1-q16",
      "w1-q8"
    ],
    "references": [
      {
        "title": "3Blue1Brown — Linear combinations, span, and basis vectors",
        "url": "https://www.3blue1brown.com/lessons/span",
        "note": "기저가 좌표계라는 말의 의미를 애니메이션으로"
      },
      {
        "title": "3Blue1Brown — Matrix multiplication as composition",
        "url": "https://www.3blue1brown.com/lessons/matrix-multiplication",
        "note": "행렬 곱 = 변환의 합성, 순서가 중요한 이유"
      }
    ]
  },
  "rank-eigen": {
    "tier": "core",
    "goal": "rank와 L1/L2 노름을 계산하고, 고유값·고유벡터를 특성방정식으로 구하며 SVD가 PCA로 이어지는 흐름을 설명할 수 있다.",
    "checks": [
      {
        "id": "w1-rank-eigen-c1",
        "question": "행렬 $\\begin{bmatrix}1 & 2\\\\ 3 & 6\\end{bmatrix}$의 rank와 역행렬 존재 여부는?",
        "choices": [
          "rank 2, 역행렬 있음",
          "rank 1, 역행렬 없음",
          "rank 1, 역행렬 있음",
          "rank 0, 역행렬 없음"
        ],
        "answer": 1,
        "explanation": "두 번째 행이 첫 번째 행의 3배라 선형독립인 행이 1개뿐이다. full rank가 아니면 변환이 정보를 짜부라뜨리므로 역행렬이 없다(행렬식 $1\\cdot6 - 2\\cdot3 = 0$)."
      },
      {
        "id": "w1-rank-eigen-c2",
        "question": "$A = \\begin{bmatrix}2 & 1\\\\ 1 & 2\\end{bmatrix}$에서 고유값 3에 대응하는 고유벡터는?",
        "choices": [
          "$[1, -1]$",
          "$[1, 1]$",
          "$[1, 0]$",
          "$[2, 1]$"
        ],
        "answer": 1,
        "explanation": "$A[1,1]^\\top = [3, 3]^\\top = 3[1,1]^\\top$. 참고로 $[1,-1]$은 고유값 1에 대응한다."
      },
      {
        "id": "w1-rank-eigen-c3",
        "question": "$a = [-3, 4]$의 L1 노름과 L2 노름은?",
        "choices": [
          "L1 $= 1$, L2 $= 5$",
          "L1 $= 7$, L2 $= 5$",
          "L1 $= 7$, L2 $= 25$",
          "L1 $= 5$, L2 $= 7$"
        ],
        "answer": 1,
        "explanation": "L1은 절댓값의 합 $|-3| + |4| = 7$, L2는 $\\sqrt{9 + 16} = 5$. 부호는 절댓값·제곱 때문에 영향이 없다."
      }
    ],
    "quizIds": [
      "w1-q17",
      "w1-q18",
      "w1-q19",
      "w1-q20"
    ],
    "references": [
      {
        "title": "3Blue1Brown — Eigenvectors and eigenvalues",
        "url": "https://www.3blue1brown.com/lessons/eigenvalues",
        "note": "변환 후에도 방향이 유지되는 벡터를 시각적으로"
      },
      {
        "title": "CS229 Linear Algebra Review",
        "url": "https://cs229.stanford.edu/section/cs229-linalg.pdf",
        "note": "rank·노름·고유값분해·대칭행렬 정리 (영문, 심화)"
      }
    ]
  },
  "probability": {
    "tier": "core",
    "goal": "조건부확률과 베이즈 정리로 \"양성일 때 실제 병일 확률\"을 계산하고, 기대값·분산의 정의를 숫자 예로 설명할 수 있다.",
    "checks": [
      {
        "id": "w1-probability-c1",
        "question": "유병률 1%, 민감도 99%, 위양성률 5%인 검사에서 양성이 나왔을 때 실제로 병에 걸렸을 확률에 가장 가까운 값은?",
        "choices": [
          "99%",
          "95%",
          "약 17%",
          "1%"
        ],
        "answer": 2,
        "explanation": "$0.99\\times0.01 / (0.99\\times0.01 + 0.05\\times0.99) = 0.0099/0.0594 \\approx 16.7\\%$. 환자가 드물어 위양성의 절대 수가 실제 환자 수보다 훨씬 많기 때문이다(기저율 무시)."
      },
      {
        "id": "w1-probability-c2",
        "question": "다른 조건은 그대로 두고 유병률만 1%에서 10%로 올리면 $P(\\text{병}|\\text{양성})$은?",
        "choices": [
          "그대로다. 검사 정확도가 같으므로",
          "크게 올라간다",
          "오히려 내려간다",
          "정확히 10배가 된다"
        ],
        "answer": 1,
        "explanation": "$0.99\\times0.1/(0.99\\times0.1 + 0.05\\times0.9) = 0.099/0.144 \\approx 68.8\\%$. 사전확률(기저율)이 사후확률을 크게 좌우한다."
      },
      {
        "id": "w1-probability-c3",
        "question": "공정한 주사위 한 개의 기대값 $E[X]$는?",
        "choices": [
          "3",
          "3.5",
          "4",
          "21"
        ],
        "answer": 1,
        "explanation": "$E[X] = (1+2+3+4+5+6)/6 = 21/6 = 3.5$. 기대값은 실제로 나올 수 없는 값일 수도 있다."
      }
    ],
    "quizIds": [
      "w1-q2"
    ],
    "references": [
      {
        "title": "3Blue1Brown — Bayes theorem, the geometry of changing beliefs",
        "url": "https://www.3blue1brown.com/lessons/bayes-theorem",
        "note": "넓이로 보는 베이즈 정리: 본문 예제와 같은 구조의 의료 검사 사례"
      },
      {
        "title": "Seeing Theory — Compound Probability & Bayesian Inference",
        "url": "https://seeing-theory.brown.edu/",
        "note": "브라운대의 인터랙티브 확률 시각화"
      }
    ]
  },
  "mle-map": {
    "tier": "core",
    "goal": "베르누이·이항분포를 구분하고, 확률과 가능도의 차이를 설명하며 로그가능도 미분으로 MLE를, 사전분포를 더해 MAP를 구할 수 있다.",
    "checks": [
      {
        "id": "w1-mle-map-c1",
        "question": "확률과 가능도의 차이를 가장 정확히 설명한 것은?",
        "choices": [
          "확률은 0~1 사이, 가능도는 항상 1보다 크다",
          "같은 함수 $P(\\text{데이터}|p)$를 두고, 확률은 $p$를 고정해 데이터를 보고, 가능도는 데이터를 고정해 $p$의 함수로 본다",
          "가능도는 사전분포가 있을 때만 정의된다",
          "확률은 이산, 가능도는 연속에서만 쓴다"
        ],
        "answer": 1,
        "explanation": "수식은 같고 무엇을 변수로 보느냐만 다르다. MLE는 관측 데이터를 고정하고 그 데이터를 가장 잘 설명하는 $p$를 찾는다."
      },
      {
        "id": "w1-mle-map-c2",
        "question": "동전을 20번 던져 앞면이 14번 나왔다. $\\hat p_{\\text{MLE}}$는?",
        "choices": [
          "0.5",
          "0.65",
          "0.7",
          "14"
        ],
        "answer": 2,
        "explanation": "로그가능도 $14\\log p + 6\\log(1-p)$를 미분해 0으로 두면 $14/p = 6/(1-p)$, $\\hat p = 14/20 = 0.7$."
      },
      {
        "id": "w1-mle-map-c3",
        "question": "같은 데이터(20번 중 14번)에 사전분포 $\\mathrm{Beta}(2,2)$를 반영한 MAP 추정치는?",
        "choices": [
          "$15/22 \\approx 0.682$",
          "$14/20 = 0.7$",
          "$16/24 \\approx 0.667$",
          "$0.5$"
        ],
        "answer": 0,
        "explanation": "사후 로그밀도는 $15\\log p + 7\\log(1-p)$가 되어 $\\hat p_{\\text{MAP}} = 15/22 \\approx 0.682$. MLE보다 0.5 쪽으로 조금 당겨지고, 데이터가 많아질수록 그 차이는 줄어든다."
      }
    ],
    "quizIds": [
      "w1-q21",
      "w1-q22",
      "w1-q23",
      "w1-q24"
    ],
    "references": [
      {
        "title": "CS229 Probability Theory Review",
        "url": "https://cs229.stanford.edu/section/cs229-prob.pdf",
        "note": "확률변수·분포·기대값·MLE의 정식 정리 (영문)"
      },
      {
        "title": "Seeing Theory — Bayesian Inference",
        "url": "https://seeing-theory.brown.edu/bayesian-inference/index.html",
        "note": "사전분포가 데이터에 따라 사후분포로 바뀌는 과정을 슬라이더로"
      }
    ]
  },
  "distributions": {
    "tier": "core",
    "goal": "균등분포와 정규분포의 모양을 비교하고, $\\mu$·$\\sigma$의 역할과 68-95-99.7 규칙, 중심극한정리의 직관을 설명할 수 있다.",
    "checks": [
      {
        "id": "w1-distributions-c1",
        "question": "정규분포 $\\mathcal{N}(\\mu, \\sigma^2)$에서 $\\sigma$만 두 배로 키우면?",
        "choices": [
          "종의 중심이 오른쪽으로 이동한다",
          "종이 더 넓고 완만해진다",
          "종이 더 좁고 뾰족해진다",
          "균등분포로 바뀐다"
        ],
        "answer": 1,
        "explanation": "$\\mu$는 중심의 위치, $\\sigma$는 퍼짐의 정도를 정한다. $\\sigma$가 커지면 값이 넓게 흩어진다."
      },
      {
        "id": "w1-distributions-c2",
        "question": "평균 170cm, 표준편차 6cm인 정규분포를 따르는 키에서, 158cm~182cm 사이에 드는 비율은 약 몇 %인가?",
        "choices": [
          "약 68%",
          "약 95%",
          "약 99.7%",
          "약 50%"
        ],
        "answer": 1,
        "explanation": "158~182cm는 $\\mu \\pm 2\\sigma$(170 ± 12)이므로 68-95-99.7 규칙에 따라 약 95%다."
      },
      {
        "id": "w1-distributions-c3",
        "question": "중심극한정리가 말하는 것과 가장 가까운 것은?",
        "choices": [
          "모든 데이터는 원래 정규분포를 따른다",
          "서로 독립인 여러 작은 요인을 더한 값은, 각 요인의 분포와 상관없이 정규분포에 가까워진다",
          "표본을 많이 모으면 분산이 0이 된다",
          "균등분포와 정규분포는 같은 분포다"
        ],
        "answer": 1,
        "explanation": "측정 오차처럼 여러 작은 원인이 더해진 결과가 종 모양이 되는 이유다. 실습에서 균등분포 12개의 합이 $\\mathcal{N}(6, 1)$에 가까워지는 것을 확인했다."
      }
    ],
    "quizIds": [
      "w1-q9"
    ],
    "references": [
      {
        "title": "3Blue1Brown — But what is the Central Limit Theorem?",
        "url": "https://www.3blue1brown.com/lessons/clt",
        "note": "주사위 합이 종 모양이 되는 과정을 시각적으로"
      },
      {
        "title": "Seeing Theory — Probability Distributions",
        "url": "https://seeing-theory.brown.edu/probability-distributions/index.html",
        "note": "여러 분포의 모양을 파라미터를 바꾸며 직접 보기"
      }
    ]
  },
  "entropy": {
    "tier": "core",
    "goal": "엔트로피·교차 엔트로피·KL 발산을 동전 예제로 계산하고, 교차 엔트로피가 분류 손실로 쓰이는 이유와 KL의 비대칭성을 설명할 수 있다.",
    "checks": [
      {
        "id": "w1-entropy-c1",
        "question": "결과가 네 가지이고 모두 확률 $1/4$로 같은 분포의 엔트로피(밑 2)는?",
        "choices": [
          "1 비트",
          "2 비트",
          "4 비트",
          "0.25 비트"
        ],
        "answer": 1,
        "explanation": "$H = -4 \\times \\frac14 \\log_2 \\frac14 = \\log_2 4 = 2$ 비트. 균등한 $k$개 결과의 엔트로피는 $\\log_2 k$로, 가능한 최댓값이다."
      },
      {
        "id": "w1-entropy-c2",
        "question": "KL 발산 $D_{\\mathrm{KL}}(p\\parallel q)$에 대한 설명으로 **틀린** 것은?",
        "choices": [
          "항상 0 이상이다",
          "$p = q$일 때만 0이다",
          "$H(p,q) - H(p)$와 같다",
          "항상 $D_{\\mathrm{KL}}(q\\parallel p)$와 같다"
        ],
        "answer": 3,
        "explanation": "KL 발산은 비대칭이다. 실습에서 $D_{\\mathrm{KL}}(\\text{fair}\\parallel\\text{biased}) \\approx 0.737$, $D_{\\mathrm{KL}}(\\text{biased}\\parallel\\text{fair}) \\approx 0.531$로 서로 달랐다."
      },
      {
        "id": "w1-entropy-c3",
        "question": "정답이 0번 클래스일 때, 모델이 0번 클래스에 준 확률 $q_0$가 0.9에서 0.5로 떨어지면 교차 엔트로피 손실은?",
        "choices": [
          "줄어든다",
          "늘어난다 (약 0.15 → 1 비트)",
          "변하지 않는다",
          "음수가 된다"
        ],
        "answer": 1,
        "explanation": "정답이 원-핫 $[1, 0]$이면 손실은 $-\\log_2 q_0$이다. $q_0$가 작아질수록 손실이 커지므로, 이 손실을 줄이는 학습은 정답 클래스의 확률을 높인다."
      }
    ],
    "quizIds": [
      "w1-q25",
      "w1-q26"
    ],
    "references": [
      {
        "title": "Chris Olah — Visual Information Theory",
        "url": "https://colah.github.io/posts/2015-09-Visual-Information/",
        "note": "엔트로피·교차 엔트로피·KL을 그림으로 설명한 대표적인 글 (영문)"
      }
    ]
  },
  "gradient-descent": {
    "tier": "core",
    "goal": "미분·기울기의 의미를 설명하고, 경사하강법 갱신을 손과 코드로 계산하며 학습률에 따른 수렴·진동·발산을 배율 $(1-2\\eta)$로 설명할 수 있다.",
    "checks": [
      {
        "id": "w1-gradient-descent-c1",
        "question": "$L(w) = (w-3)^2$, $w_0 = 0$, $\\eta = 0.1$일 때 첫 스텝 후의 $w_1$은?",
        "choices": [
          "$0.3$",
          "$0.6$",
          "$-0.6$",
          "$3$"
        ],
        "answer": 1,
        "explanation": "$dL/dw = 2(w-3) = -6$이므로 $w_1 = 0 - 0.1\\times(-6) = 0.6$."
      },
      {
        "id": "w1-gradient-descent-c2",
        "question": "$L(w) = (w-3)^2$에서 $\\eta = 0.5$로 경사하강법을 하면?",
        "choices": [
          "발산한다",
          "한 스텝 만에 정확히 $w = 3$에 도착한다",
          "3의 양쪽을 영원히 진동한다",
          "전혀 움직이지 않는다"
        ],
        "answer": 1,
        "explanation": "오차 $w-3$이 매 스텝 $(1-2\\eta) = 0$배가 되므로 한 번에 0이 된다. 실제 문제에서는 최적 학습률을 모르므로 이런 일은 드물다."
      },
      {
        "id": "w1-gradient-descent-c3",
        "question": "기울기 벡터 $\\nabla L$에 대한 설명으로 옳은 것은?",
        "choices": [
          "함수가 가장 가파르게 **감소**하는 방향을 가리킨다",
          "함수가 가장 가파르게 **증가**하는 방향을 가리키므로, 경사하강법은 $-\\nabla L$ 방향으로 움직인다",
          "항상 길이가 1이다",
          "파라미터가 하나일 때만 정의된다"
        ],
        "answer": 1,
        "explanation": "기울기는 가장 가파른 증가 방향이다. 손실을 줄이려면 그 반대 방향으로 이동한다: $\\theta \\leftarrow \\theta - \\eta\\nabla_\\theta L$."
      }
    ],
    "quizIds": [
      "w1-q3",
      "w1-q4"
    ],
    "references": [
      {
        "title": "3Blue1Brown — Gradient descent, how neural networks learn",
        "url": "https://www.3blue1brown.com/lessons/gradient-descent",
        "note": "신경망 학습 관점에서 본 경사하강법"
      },
      {
        "title": "Dive into Deep Learning — Gradient Descent",
        "url": "https://d2l.ai/chapter_optimization/gd.html",
        "note": "학습률과 수렴을 코드와 그래프로 (영문, 한국어판은 ko.d2l.ai)"
      },
      {
        "title": "Distill — Why Momentum Really Works",
        "url": "https://distill.pub/2017/momentum/",
        "note": "실습 2의 \"방향마다 가파름이 다른\" 문제를 인터랙티브로 (심화)"
      }
    ]
  },
};

export default sections;
