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
      },
      {
        "id": "w1-ai-landscape-c5",
        "question": "데이터 $(1, 2), (2, 4), (3, 7)$과 모델 $f_\\theta(x) = \\theta x$에서 $\\theta = 1$일 때 평균제곱오차(MSE)는?",
        "choices": [
          "7",
          "21",
          "3",
          "1"
        ],
        "answer": 0,
        "explanation": "예측은 1, 2, 3이고 오차는 $-1, -2, -4$다. 제곱하면 $1 + 4 + 16 = 21$이고, 데이터 3개로 나누면 MSE는 7이다."
      },
      {
        "id": "w1-ai-landscape-c6",
        "question": "\"입력 + 정답(출력) → 규칙\"으로 요약되는 방식은?",
        "choices": [
          "머신러닝",
          "규칙 기반(전통적) 프로그래밍",
          "하드웨어 설계",
          "데이터베이스 검색"
        ],
        "answer": 0,
        "explanation": "전통적 프로그래밍은 사람이 규칙을 적어 입력을 출력으로 바꾸고, 머신러닝은 입력과 정답을 보고 규칙(파라미터)을 찾아낸다."
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
      },
      {
        "id": "w1-ai-terms-c4",
        "question": "다음 중 **하이퍼파라미터**인 것은?",
        "choices": [
          "학습률 $\\eta$",
          "선형회귀 직선의 기울기",
          "신경망의 가중치",
          "데이터의 레이블"
        ],
        "answer": 0,
        "explanation": "학습률은 학습을 시작하기 전에 사람이 정하는 값이다. 기울기와 가중치는 학습이 데이터에서 찾아내는 파라미터이고, 레이블은 데이터의 정답이다."
      },
      {
        "id": "w1-ai-terms-c5",
        "question": "\"이 집은 얼마에 팔릴까?\"를 예측하는 문제의 유형은?",
        "choices": [
          "회귀",
          "분류",
          "생성",
          "비지도학습"
        ],
        "answer": 0,
        "explanation": "답이 연속된 숫자 하나(가격)이므로 회귀다. 답이 정해진 보기 중 하나라면 분류, 새 결과물이면 생성이다."
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
        "note": "1장 지도학습 도입부: 같은 용어를 수학적으로 정의 (영문, 수식 중심)"
      }
    ]
  },
  "python-basics": {
    "tier": "core",
    "goal": "변수·자료형·제어문·함수·리스트/튜플/집합/딕셔너리·리스트 컴프리헨션을 읽고, 짧은 함수를 직접 작성할 수 있다.",
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
      },
      {
        "id": "w1-python-basics-c4",
        "question": "`print(list(range(1, 5)))`의 출력은?",
        "choices": [
          "`[1, 2, 3, 4]`",
          "`[1, 2, 3, 4, 5]`",
          "`[0, 1, 2, 3, 4]`",
          "`[2, 3, 4, 5]`"
        ],
        "answer": 0,
        "explanation": "`range(시작, 끝)`은 시작부터 끝 **직전**까지 만든다. 슬라이싱 `[1:3]`에서 3번이 빠지는 것과 같은 규칙이다."
      },
      {
        "id": "w1-python-basics-c5",
        "question": "`print(\"점수: \" + 90)`을 실행하면 어떤 오류가 나고, 어떻게 고치는가?",
        "choices": [
          "`TypeError`: 문자열과 정수는 `+`로 이을 수 없으니 `f\"점수: {90}\"`처럼 쓴다",
          "`NameError`: 90을 정의해야 한다",
          "`IndexError`: 문자열 범위를 벗어났다",
          "오류 없이 `점수: 90`이 출력된다"
        ],
        "answer": 0,
        "explanation": "`+`는 문자열끼리는 이어 붙이고 숫자끼리는 더한다. 둘을 섞으면 어느 쪽인지 정할 수 없어 `TypeError`가 난다. f-string이나 `str(90)`으로 자료형을 맞춘다."
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
    "goal": "NumPy 배열을 만들고 원소별 연산·shape·axis·브로드캐스팅의 결과를 실행 전에 예측할 수 있다.",
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
        "id": "w1-dev-tools-c4",
        "question": "`a = np.array([1, 2, 3])`일 때 `a * a`의 결과는?",
        "choices": [
          "`[1, 4, 9]`",
          "`14`",
          "`[2, 4, 6]`",
          "`[1, 2, 3, 1, 2, 3]`"
        ],
        "answer": 0,
        "explanation": "NumPy 배열끼리의 `*`는 같은 자리끼리 곱하는 원소별 연산이다. 같은 자리끼리 곱해 **모두 더한** 내적은 `a @ a = 14`로 따로 쓴다. 리스트의 `*`(반복)와도 다르다."
      },
      {
        "id": "w1-dev-tools-c5",
        "question": "shape이 `(2, 3)`인 배열과 shape이 `(2, 1)`인 배열을 더한 결과의 shape은?",
        "choices": [
          "`(2, 3)`",
          "`(2, 1)`",
          "`(2, 4)`",
          "오류가 난다"
        ],
        "answer": 0,
        "explanation": "오른쪽 끝부터 비교하면 3과 1(1이므로 복제), 2와 2(같음)라 맞춰진다. $(2, 1)$ 배열이 열 방향으로 복제되어 $(2, 3)$이 된다."
      },
      {
        "id": "w1-dev-tools-c6",
        "question": "shape `(2, 3)` 배열 `x`의 각 **행**에서 그 행의 평균을 빼는 올바른 코드는?",
        "choices": [
          "`x - x.mean(axis=1, keepdims=True)`",
          "`x - x.mean(axis=1)`",
          "`x - x.mean(axis=0, keepdims=True)`",
          "`x - x.mean()`"
        ],
        "answer": 0,
        "explanation": "`x.mean(axis=1)`은 shape `(2,)`라 `(2, 3)`과 오른쪽 끝(3과 2)이 맞지 않는다. `keepdims=True`로 `(2, 1)`을 만들어야 행마다 빠진다. `axis=0`은 열 평균이다."
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
        "note": "브로드캐스팅 규칙을 그림으로 설명: shape 오류의 원인을 확인할 때"
      }
    ]
  },
  "vectors": {
    "tier": "core",
    "goal": "내적·코사인 유사도를 손으로 계산하고, 코사인 유사도가 방향의 비슷함만 재는 이유와 행렬-벡터 곱이 \"행마다 내적\"임을 설명할 수 있다.",
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
      },
      {
        "id": "w1-vectors-c4",
        "question": "$W = \\begin{bmatrix}1 & 0\\\\ 2 & 1\\end{bmatrix}$, $x = [3, 4]$일 때 $Wx$는?",
        "choices": [
          "$[3, 10]$",
          "$[11, 4]$",
          "$[3, 4]$",
          "$[7, 7]$"
        ],
        "answer": 0,
        "explanation": "$Wx$는 $W$의 각 행과 $x$의 내적이다. 첫 행 $[1, 0]\\cdot[3, 4] = 3$, 둘째 행 $[2, 1]\\cdot[3, 4] = 10$. 열과 내적한 $[11, 4]$는 $W^\\top x$다."
      },
      {
        "id": "w1-vectors-c5",
        "question": "벡터 $[6, 8]$의 길이 $|a|$는?",
        "choices": [
          "10",
          "14",
          "48",
          "100"
        ],
        "answer": 0,
        "explanation": "$\\sqrt{6^2 + 8^2} = \\sqrt{100} = 10$이다. 성분을 그냥 더한 14는 L1 노름이고, 제곱근을 씌우기 전의 100은 길이의 제곱이다."
      },
      {
        "id": "w1-vectors-c6",
        "question": "$a = [1, 2]$, $b = [2, -1]$의 내적과, 두 벡터의 관계로 옳은 것은?",
        "choices": [
          "내적 0, 서로 직교한다",
          "내적 4, 같은 방향이다",
          "내적 −4, 반대 방향이다",
          "내적 0, 같은 벡터다"
        ],
        "answer": 0,
        "explanation": "$1 \\cdot 2 + 2 \\cdot (-1) = 0$이다. 내적이 0이면 $\\cos\\theta = 0$, 즉 두 벡터는 90도를 이루어 서로 직교한다."
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
  "probability": {
    "tier": "core",
    "goal": "조건부확률과 베이즈 정리로 \"양성일 때 실제 병일 확률\"을 계산하고, 기댓값·분산의 정의를 숫자 예로 설명할 수 있다.",
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
        "question": "공정한 주사위 한 개의 기댓값 $E[X]$는?",
        "choices": [
          "3",
          "3.5",
          "4",
          "21"
        ],
        "answer": 1,
        "explanation": "$E[X] = (1+2+3+4+5+6)/6 = 21/6 = 3.5$. 기댓값은 실제로 나올 수 없는 값일 수도 있다."
      },
      {
        "id": "w1-probability-c4",
        "question": "공정한 동전을 두 번 던질 때, 두 번 모두 앞면이 나올 확률은?",
        "choices": [
          "$1/4$",
          "$1/2$",
          "$1/3$",
          "$1$"
        ],
        "answer": 0,
        "explanation": "두 번의 던지기는 서로 독립이므로 확률을 곱한다: $\\frac12 \\times \\frac12 = \\frac14$. 가능한 결과(앞앞, 앞뒤, 뒤앞, 뒤뒤) 넷 중 하나라고 세어도 같다."
      },
      {
        "id": "w1-probability-c5",
        "question": "1만 명 중 환자가 10%이고 민감도 99%, 위양성률 5%인 검사에서 양성이 나왔을 때 실제 환자일 확률에 가장 가까운 것은?",
        "choices": [
          "약 69%",
          "약 17%",
          "약 99%",
          "약 10%"
        ],
        "answer": 0,
        "explanation": "환자 1,000명 중 양성 990명, 건강한 9,000명 중 양성 450명이다. 양성 1,440명 중 환자는 990명이므로 $990/1440 \\approx 68.8\\%$다."
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
  "gradient-descent": {
    "tier": "core",
    "goal": "미분·기울기의 의미를 설명하고, 연쇄법칙으로 손실의 기울기를 구해 경사하강법 갱신을 손과 코드로 계산하며, 학습률에 따른 수렴·진동·발산을 배율 $(1-2\\eta)$로 설명할 수 있다.",
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
      },
      {
        "id": "w1-gradient-descent-c4",
        "question": "$L(w) = (wx - y)^2$에서 $x = 2$, $y = 6$, $w = 1$일 때 $dL/dw$는?",
        "choices": [
          "$-16$",
          "$-8$",
          "$16$",
          "$-4$"
        ],
        "answer": 0,
        "explanation": "연쇄법칙: $dL/dw = 2(wx - y)\\cdot x = 2 \\times (2 - 6) \\times 2 = -16$. 바깥(제곱)의 미분 $2(wx-y)$에 안쪽 $wx - y$의 미분 $x$를 곱한다. $x$를 곱하는 것을 빠뜨리면 $-8$이 된다."
      },
      {
        "id": "w1-gradient-descent-c5",
        "question": "$L(w) = 3w^2 + 2w$에서 $w = 1$일 때 $\\dfrac{dL}{dw}$는?",
        "choices": [
          "8",
          "5",
          "6",
          "11"
        ],
        "answer": 0,
        "explanation": "$\\frac{d}{dw}3w^2 = 6w$, $\\frac{d}{dw}2w = 2$이므로 $\\frac{dL}{dw} = 6w + 2$이고, $w = 1$을 넣으면 8이다."
      },
      {
        "id": "w1-gradient-descent-c6",
        "question": "경사하강법으로 갱신하다가 $\\frac{dL}{dw} = 0$인 지점에 도착하면 어떻게 되는가?",
        "choices": [
          "갱신량이 0이 되어 멈춘다. 그 지점은 최솟값일 수도, 극소점이나 안장점일 수도 있다",
          "반드시 전체 최솟값에 도착한 것이다",
          "학습률이 자동으로 커져 계속 움직인다",
          "손실이 무한대가 된다"
        ],
        "answer": 0,
        "explanation": "$w \\leftarrow w - \\eta \\cdot 0$이므로 더 이상 움직이지 않는다. 볼록 함수라면 그곳이 최솟값이지만, 일반적인 손실에서는 극소점이나 안장점에서도 기울기가 0이다."
      }
    ],
    "quizIds": [
      "w1-q3",
      "w1-q4",
      "w1-q31"
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
      }
    ]
  },
  "python-advanced": {
    "tier": "supplement",
    "goal": "클래스로 상태와 동작을 묶고 `self`의 의미를 설명하며, `raise`·`try`/`except`로 오류를 일으키고 다룰 수 있다.",
    "checks": [
      {
        "id": "w1-python-advanced-c1",
        "question": "`class Perceptron:` 안에 정의한 `def predict(self, x):`를 `p.predict(3)`으로 호출할 때 `self`가 가리키는 것은?",
        "choices": [
          "메서드를 호출한 객체 `p` 자신",
          "클래스 이름 `Perceptron`이라는 문자열",
          "첫 번째 인자 `3`",
          "모든 객체가 함께 쓰는 전역 변수"
        ],
        "answer": 0,
        "explanation": "파이썬은 `p.predict(3)`을 `Perceptron.predict(p, 3)`처럼 실행한다. 그래서 `self`는 호출한 객체이고, `self.w`는 그 객체만의 속성이다."
      },
      {
        "id": "w1-python-advanced-c2",
        "question": "`p1 = Perceptron(w=2, b=1)`, `p2 = Perceptron(w=5, b=0)`일 때 `print(p1.predict(1), p2.predict(1))`의 출력은? (`predict`는 `self.w * x + self.b`)",
        "choices": [
          "`3 5`",
          "`3 3`",
          "`5 5`",
          "`7 5`"
        ],
        "answer": 0,
        "explanation": "같은 클래스로 만든 객체라도 속성은 각자 따로 가진다. $2 \\cdot 1 + 1 = 3$, $5 \\cdot 1 + 0 = 5$."
      },
      {
        "id": "w1-python-advanced-c3",
        "question": "`try:` 블록에서 `ZeroDivisionError`가 발생했는데 `except KeyError:`만 있다면 어떻게 되는가?",
        "choices": [
          "예외가 잡히지 않고 프로그램이 멈춘다(호출한 쪽으로 전달된다)",
          "`except KeyError:` 블록이 실행된다",
          "오류를 무시하고 다음 줄을 실행한다",
          "`None`이 자동으로 반환된다"
        ],
        "answer": 0,
        "explanation": "`except` 뒤에 적은 종류의 예외만 잡는다. 종류가 다르면 예외는 그대로 위로 전달되어, 아무도 잡지 않으면 프로그램이 멈춘다."
      },
      {
        "id": "w1-python-advanced-c4",
        "question": "위 `RunningMean`에 `add(2)`, `add(4)`, `add(9)`를 차례로 호출한 뒤 `result()`의 값은?",
        "choices": [
          "5.0",
          "15",
          "9",
          "3"
        ],
        "answer": 0,
        "explanation": "세 값의 평균 $(2 + 4 + 9)/3 = 5$다. 갱신식은 값을 저장하지 않고도 매 단계 정확한 평균(2 → 3 → 5)을 유지한다."
      },
      {
        "id": "w1-python-advanced-c5",
        "question": "함수 안에서 `raise ValueError(\"빈 리스트\")`를 실행했고, 호출한 쪽이 `try:`와 `except ValueError as e: print(e)`로 감쌌다면?",
        "choices": [
          "`빈 리스트`가 출력되고 프로그램은 계속 실행된다",
          "프로그램이 즉시 멈춘다",
          "`ValueError`라는 글자만 출력된다",
          "아무 일도 일어나지 않는다"
        ],
        "answer": 0,
        "explanation": "`raise`한 예외는 호출한 쪽으로 전달되고, 종류가 맞는 `except`가 잡는다. `e`에는 예외를 만들 때 넣은 메시지가 들어 있다."
      }
    ],
    "quizIds": [
      "w1-q28"
    ],
    "references": [
      {
        "title": "Python 자습서 — 클래스",
        "url": "https://docs.python.org/ko/3/tutorial/classes.html",
        "note": "9.3 \"클래스와의 첫 만남\"까지만 읽어도 충분"
      },
      {
        "title": "Python 자습서 — 에러와 예외",
        "url": "https://docs.python.org/ko/3/tutorial/errors.html",
        "note": "try/except/raise와 예외 종류"
      }
    ]
  },
  "dev-env": {
    "tier": "supplement",
    "goal": "모듈·패키지·가상환경, Jupyter·Colab, Git의 add·commit·push 흐름이 각각 어떤 문제를 해결하는지 설명할 수 있다.",
    "checks": [
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
      },
      {
        "id": "w1-dev-env-c2",
        "question": "작업한 내용을 GitHub 원격 저장소에 올리기까지의 올바른 순서는?",
        "choices": [
          "`git add` → `git commit` → `git push`",
          "`git push` → `git add` → `git commit`",
          "`git commit` → `git push` → `git add`",
          "`git clone` → `git push` → `git add`"
        ],
        "answer": 0,
        "explanation": "`add`로 기록할 변경을 고르고(스테이징), `commit`으로 하나의 기록으로 저장한 뒤, `push`로 원격 저장소에 올린다."
      },
      {
        "id": "w1-dev-env-c3",
        "question": "이 사이트의 브라우저 실행 환경보다 Google Colab을 쓰는 편이 나은 경우는?",
        "choices": [
          "GPU가 필요하거나 그래프를 화면에 그려 보고 싶을 때",
          "짧은 코드 셀 하나를 바로 실행해 볼 때",
          "설치 없이 파이썬을 써 보고 싶을 때",
          "NumPy 배열 연산을 연습할 때"
        ],
        "answer": 0,
        "explanation": "이 사이트의 코드는 브라우저(Pyodide) 안에서 화면 없이 실행되고 GPU를 쓰지 않는다. 큰 모델 학습이나 그래프 시각화는 Colab이 적합하다."
      },
      {
        "id": "w1-dev-env-c4",
        "question": "Git 저장소에 **올리지 말고** `.gitignore`에 넣어야 하는 것으로 가장 알맞은 것은?",
        "choices": [
          "API 키가 들어 있는 `.env` 파일",
          "`requirements.txt`",
          "분석 코드가 담긴 `.py` 파일",
          "프로젝트 설명 `README.md`"
        ],
        "answer": 0,
        "explanation": "비밀값은 공개되면 즉시 악용될 수 있고, 한 번 올라가면 기록에 남는다. `requirements.txt`와 코드, README는 공유해야 하는 파일이다."
      },
      {
        "id": "w1-dev-env-c5",
        "question": "`pip install -r requirements.txt`가 하는 일은?",
        "choices": [
          "파일에 적힌 패키지(와 버전)를 한 번에 설치한다",
          "설치된 패키지를 모두 지운다",
          "가상환경을 새로 만든다",
          "코드를 GitHub에 올린다"
        ],
        "answer": 0,
        "explanation": "`pip freeze > requirements.txt`로 저장해 둔 목록을 다른 컴퓨터에서 그대로 설치해, 같은 환경에서 코드를 재현할 수 있게 한다."
      }
    ],
    "quizIds": [
      "w1-q29"
    ],
    "references": [
      {
        "title": "Pro Git (한국어판)",
        "url": "https://git-scm.com/book/ko/v2",
        "note": "2장 Git의 기초만 읽어도 과제 제출에 충분"
      },
      {
        "title": "Python 문서 — venv: 가상 환경 만들기",
        "url": "https://docs.python.org/ko/3/library/venv.html",
        "note": "가상환경 생성·활성화 방법"
      },
      {
        "title": "Google Colab 소개",
        "url": "https://colab.research.google.com/notebooks/intro.ipynb",
        "note": "셀 실행, GPU 런타임 설정"
      }
    ]
  },
  "basis-matrix": {
    "tier": "supplement",
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
      },
      {
        "id": "w1-basis-matrix-c4",
        "question": "$2 \\times 3$ 행렬과 $3 \\times 4$ 행렬을 곱한 결과의 모양은?",
        "choices": [
          "$2 \\times 4$",
          "$3 \\times 3$",
          "$2 \\times 3$",
          "곱할 수 없다"
        ],
        "answer": 0,
        "explanation": "안쪽 차원 3이 같아 곱할 수 있고, 바깥 차원 2와 4가 결과의 모양이 된다: $(2 \\times 3)(3 \\times 4) = (2 \\times 4)$."
      },
      {
        "id": "w1-basis-matrix-c5",
        "question": "$A = \\begin{bmatrix}1 & 2\\\\ 3 & 4\\end{bmatrix}$, $B = \\begin{bmatrix}5 & 6\\\\ 7 & 8\\end{bmatrix}$일 때 $AB$의 1행 1열 성분은?",
        "choices": [
          "19",
          "5",
          "22",
          "23"
        ],
        "answer": 0,
        "explanation": "$A$의 1행 $[1, 2]$와 $B$의 1열 $[5, 7]$의 내적이다: $1 \\cdot 5 + 2 \\cdot 7 = 19$. (1행 2열은 $1 \\cdot 6 + 2 \\cdot 8 = 22$.)"
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
  "distributions": {
    "tier": "supplement",
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
        "explanation": "측정 오차처럼 여러 작은 원인이 더해진 결과가 종 모양이 되는 이유다. 예를 들어 0~1 균등분포 12개를 더하면 그 합이 $\\mathcal{N}(6, 1)$에 가까워진다."
      },
      {
        "id": "w1-distributions-c4",
        "question": "평균 170cm, 표준편차 6cm인 분포에서 키 176cm의 z-점수는?",
        "choices": [
          "1",
          "6",
          "0.5",
          "−1"
        ],
        "answer": 0,
        "explanation": "$z = (176 - 170)/6 = 1$이다. 평균보다 표준편차 한 개만큼 크다는 뜻이다."
      },
      {
        "id": "w1-distributions-c5",
        "question": "정규분포를 따르는 키 $X$에 대해 $P(X = 170)$은?",
        "choices": [
          "0. 연속분포에서는 구간의 넓이로만 확률을 잰다",
          "$f(170)$의 값과 같다",
          "항상 0.5다",
          "68%다"
        ],
        "answer": 0,
        "explanation": "한 점은 넓이가 0이다. $f(170)$은 확률밀도로, 확률이 아니며 1보다 클 수도 있다. 확률은 $P(169.5 \\le X \\le 170.5)$처럼 구간으로 묻는다."
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
  "rank-eigen": {
    "tier": "advanced",
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
        "explanation": "두 번째 행이 첫 번째 행의 3배라 선형독립인 행이 1개뿐이다. full rank가 아니면 변환이 공간을 낮은 차원으로 찌그러뜨려 되돌릴 수 없으므로 역행렬이 없다(행렬식 $1\\cdot6 - 2\\cdot3 = 0$)."
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
      },
      {
        "id": "w1-rank-eigen-c4",
        "question": "어떤 행렬을 SVD해 특이값이 $[10, 3, 0.01]$로 나왔다. 이 행렬에 대한 설명으로 가장 알맞은 것은?",
        "choices": [
          "큰 특이값 2개만 남긴 rank-2 근사가 원래 행렬과 거의 같다",
          "세 방향의 정보량이 모두 같다",
          "이 행렬은 역행렬이 없다(rank 1)",
          "특이값이 작을수록 중요한 방향이다"
        ],
        "answer": 0,
        "explanation": "특이값은 각 방향이 담은 크기다. 0.01인 방향은 거의 기여하지 않으므로 버려도 오차가 작다(가장 좋은 rank-2 근사). 0이 아니므로 엄밀히는 rank 3이다."
      },
      {
        "id": "w1-rank-eigen-c5",
        "question": "고유벡터 $v$와 고유값 $\\lambda$의 정의 $Av = \\lambda v$가 뜻하는 것은?",
        "choices": [
          "$A$를 곱해도 방향은 그대로이고 길이만 $\\lambda$배가 되는 벡터",
          "$A$를 곱하면 항상 0이 되는 벡터",
          "$A$의 첫 번째 열",
          "$A$를 곱하면 90도 회전하는 벡터"
        ],
        "answer": 0,
        "explanation": "고유벡터는 변환 뒤에도 같은 직선 위에 남는 특별한 방향이고, 고유값은 그 방향의 배율이다(음수면 방향이 뒤집힌다)."
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
        "note": "rank·노름·고유값분해·대칭행렬 정리 (영문, 수식 중심)"
      }
    ]
  },
  "mle-map": {
    "tier": "advanced",
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
      },
      {
        "id": "w1-mle-map-c4",
        "question": "가능도를 계산할 때 확률들을 곱하는 대신 로그의 합을 쓰는 가장 실용적인 이유는?",
        "choices": [
          "작은 확률을 수천 번 곱하면 컴퓨터에서 0이 되어 버리는(언더플로) 문제를 피하려고",
          "로그를 취하면 최댓값의 위치가 바뀌어 더 정확해져서",
          "로그가 확률을 1보다 크게 만들어서",
          "곱셈이 정의되지 않아서"
        ],
        "answer": 0,
        "explanation": "$0.5^{1100}$은 float64에서 0이 되지만 $1100\\log 0.5 \\approx -762$는 문제없이 계산된다. 로그는 단조증가라 최댓값의 위치는 그대로다."
      },
      {
        "id": "w1-mle-map-c5",
        "question": "분류 모델이 정답 클래스에 확률 $q$를 줄 때 음의 로그가능도 $-\\log q$를 최소화하는 것과 같은 것은?",
        "choices": [
          "교차 엔트로피 손실을 최소화하는 것",
          "평균제곱오차를 최대화하는 것",
          "정확도를 최소화하는 것",
          "사전분포를 균등하게 바꾸는 것"
        ],
        "answer": 0,
        "explanation": "정답이 원-핫인 분포 $p$와 예측 $q$의 교차 엔트로피 $-\\sum p\\log q$는 정답 클래스의 $-\\log q$와 같다. 그래서 교차 엔트로피 최소화는 MLE다."
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
        "note": "확률변수·분포·기댓값·MLE의 정식 정리 (영문)"
      },
      {
        "title": "Seeing Theory — Bayesian Inference",
        "url": "https://seeing-theory.brown.edu/bayesian-inference/index.html",
        "note": "사전분포가 데이터에 따라 사후분포로 바뀌는 과정을 슬라이더로"
      }
    ]
  },
  "entropy": {
    "tier": "advanced",
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
        "explanation": "KL 발산은 비대칭이다. 한 예로 공정한 분포와 치우친 분포 사이에서 $D_{\\mathrm{KL}}(\\text{fair}\\parallel\\text{biased}) \\approx 0.737$, $D_{\\mathrm{KL}}(\\text{biased}\\parallel\\text{fair}) \\approx 0.531$로 서로 다르다."
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
      },
      {
        "id": "w1-entropy-c4",
        "question": "정답 클래스에 확률 0.5를 준 예측의 교차 엔트로피 손실은 비트와 냇으로 각각 얼마인가?",
        "choices": [
          "1비트, 약 0.693냇",
          "0.5비트, 0.5냇",
          "약 0.693비트, 1냇",
          "2비트, 약 1.386냇"
        ],
        "answer": 0,
        "explanation": "$-\\log_2 0.5 = 1$비트, $-\\ln 0.5 = \\ln 2 \\approx 0.693$냇이다. 단위만 다르고 같은 양이다."
      },
      {
        "id": "w1-entropy-c5",
        "question": "모델의 예측 분포 $q$가 정답 분포 $p$와 완전히 같아지면 교차 엔트로피 $H(p, q)$는?",
        "choices": [
          "$p$의 엔트로피 $H(p)$와 같아지고 KL 발산은 0이 된다",
          "0이 된다",
          "무한대가 된다",
          "1비트가 된다"
        ],
        "answer": 0,
        "explanation": "$H(p, q) = H(p) + D_{\\mathrm{KL}}(p\\parallel q)$이고 $q = p$면 KL이 0이다. 정답 분포 자체가 불확실하면 $H(p) > 0$이라 손실이 0까지 내려가지는 않는다."
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
  "gd-convergence": {
    "tier": "advanced",
    "goal": "곡률로부터 학습률의 안정 조건 $0 < \\eta < 2/a$를 유도하고, 조건수 $\\kappa$가 경사하강법의 수렴 속도를 정하는 이유와 뉴턴 방법의 장단점을 설명할 수 있다.",
    "checks": [
      {
        "id": "w1-gd-convergence-c1",
        "question": "곡률이 $a = 8$인 이차 손실 $\\frac{a}{2}(w - w^*)^2$에서 경사하강법이 수렴하는 학습률의 범위는?",
        "choices": [
          "$0 < \\eta < 0.25$",
          "$0 < \\eta < 0.125$",
          "$0 < \\eta < 1$",
          "$0 < \\eta < 2$"
        ],
        "answer": 0,
        "explanation": "오차가 매 스텝 $(1 - \\eta a)$배가 되므로 $|1 - 8\\eta| < 1$, 즉 $0 < \\eta < 2/8 = 0.25$다. $\\eta = 1/8$이면 한 스텝에 도착한다."
      },
      {
        "id": "w1-gd-convergence-c2",
        "question": "두 방향의 곡률이 100과 1인 이차 손실에 고정 학습률 경사하강법을 쓸 때 가장 큰 문제는?",
        "choices": [
          "안정하려면 학습률을 $2/100$ 아래로 잡아야 해서, 곡률 1인 방향이 매우 느리게 수렴한다",
          "곡률이 큰 방향이 먼저 발산하므로 학습률을 키워야 한다",
          "두 방향의 기울기가 서로 상쇄되어 움직이지 않는다",
          "곡률과 학습률은 관계가 없다"
        ],
        "answer": 0,
        "explanation": "가장 가파른 방향이 학습률의 상한을 정하고($\\eta < 2/a_{\\max}$), 그 작은 학습률로는 완만한 방향의 배율 $1 - \\eta a_{\\min}$이 1에 가깝다. 조건수 $\\kappa = 100$이 클수록 느려진다."
      },
      {
        "id": "w1-gd-convergence-c3",
        "question": "뉴턴 방법을 수억 개 파라미터의 신경망 학습에 그대로 쓰지 않는 가장 큰 이유는?",
        "choices": [
          "헤세 행렬이 $n \\times n$이라 저장과 역행렬 계산 비용이 감당할 수 없이 크다",
          "이차 함수에서도 수렴하지 않는다",
          "기울기를 계산할 수 없다",
          "학습률을 아주 크게 잡아야 한다"
        ],
        "answer": 0,
        "explanation": "뉴턴 방법은 곡률을 써서 조건수의 영향을 없애지만, 파라미터 $n$개의 헤세 행렬은 원소가 $n^2$개다. $n = 10^8$이면 $10^{16}$개라 불가능하다. 그래서 딥러닝은 Adam 같은 근사적 방법을 쓴다."
      },
      {
        "id": "w1-gd-convergence-c4",
        "question": "두 방향의 곡률 비가 $\\kappa = 10$일 때, 최선의 고정 학습률로 경사하강법을 하면 오차가 스텝마다 약 몇 배로 줄어드는가?",
        "choices": [
          "약 0.82배",
          "약 0.1배",
          "약 0.98배",
          "0배(한 번에 도착)"
        ],
        "answer": 0,
        "explanation": "배율은 $\\frac{\\kappa - 1}{\\kappa + 1} = \\frac{9}{11} \\approx 0.818$이다. $\\kappa = 100$이면 $\\frac{99}{101} \\approx 0.98$로 훨씬 느리다."
      },
      {
        "id": "w1-gd-convergence-c5",
        "question": "특징의 스케일을 표준화하면 경사하강법이 빨라지는 이유로 가장 알맞은 것은?",
        "choices": [
          "방향마다 곡률이 비슷해져 조건수 $\\kappa$가 작아지기 때문",
          "손실의 최솟값이 0이 되기 때문",
          "학습률이 자동으로 커지기 때문",
          "파라미터 수가 줄기 때문"
        ],
        "answer": 0,
        "explanation": "스케일이 크게 다른 특징은 손실을 길쭉한 계곡으로 만든다(큰 $\\kappa$). 표준화하면 등고선이 원에 가까워져 같은 학습률로 모든 방향이 비슷한 속도로 수렴한다."
      }
    ],
    "quizIds": [
      "w1-q30"
    ],
    "references": [
      {
        "title": "Distill — Why Momentum Really Works",
        "url": "https://distill.pub/2017/momentum/",
        "note": "\"방향마다 가파름이 다른\" 문제와 모멘텀을 인터랙티브로 확인"
      },
      {
        "title": "Boyd & Vandenberghe — Convex Optimization",
        "url": "https://web.stanford.edu/~boyd/cvxbook/",
        "note": "9.3절 경사하강법의 수렴 분석, 9.5절 뉴턴 방법"
      }
    ]
  }
};

export default sections;
