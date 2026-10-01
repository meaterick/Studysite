import type { SectionMeta } from "../types";

// Week 2 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "data-cleaning": {
    "tier": "core",
    "goal": "수집·정제·전처리를 구분하고, 결측값 처리 전략의 트레이드오프와 IQR·Z-score 이상치 판정이 엇갈리는 이유를 설명할 수 있다.",
    "checks": [
      {
        "id": "w2-data-cleaning-c1",
        "question": "소득이 높은 사람일수록 소득 항목을 비워두는 설문 데이터에서, 결측 행을 삭제하면 생기는 가장 큰 문제는?",
        "choices": [
          "계산 속도가 느려진다",
          "남은 데이터가 고소득층을 덜 대표하게 되어 편향이 생긴다",
          "평균이 항상 0이 된다",
          "아무 문제도 없다"
        ],
        "answer": 1,
        "explanation": "결측이 무작위가 아니면 삭제 자체가 특정 집단을 체계적으로 빼버려 편향을 만든다. 이럴 때는 결측 여부를 특징으로 남기는 방법도 함께 고려한다."
      },
      {
        "id": "w2-data-cleaning-c2",
        "question": "극단적인 이상치 하나가 섞인 작은 표본에서 Z-score($|z|>3$) 방법이 그 이상치를 놓칠 수 있는 이유는?",
        "choices": [
          "Z-score는 음수 값만 검사하므로",
          "이상치 자신이 평균과 표준편차를 부풀려 자신의 $z$ 값을 작게 만들기 때문에(masking)",
          "IQR보다 계산이 부정확해서",
          "표본 크기와 무관하게 항상 이상치를 놓친다"
        ],
        "answer": 1,
        "explanation": "본문 예제에서 95가 평균을 24로, 표준편차를 약 26.9로 끌어올려 $z \\approx 2.64$에 그쳤다. 사분위수는 극단값 하나에 거의 흔들리지 않는다."
      },
      {
        "id": "w2-data-cleaning-c3",
        "question": "이상치(예: 입력 오류 5000)가 있는 열의 결측값을 채울 때 더 안전한 기본 선택은?",
        "choices": [
          "평균 대체",
          "중앙값 대체",
          "최댓값 대체",
          "0으로 대체"
        ],
        "answer": 1,
        "explanation": "평균은 이상치에 끌려가지만 중앙값은 거의 영향을 받지 않는다. 예를 들어 소득처럼 꼬리가 긴 열에서 평균 대체값이 약 1022일 때 중앙값 대체값은 235에 그칠 수 있다."
      },
      {
        "id": "w2-data-cleaning-c4",
        "question": "pandas에서 `df.isna().sum()`이 돌려주는 것은?",
        "choices": [
          "열마다 결측값(NaN)의 개수",
          "행마다 결측값의 개수",
          "결측값을 0으로 채운 표",
          "전체 원소의 합"
        ],
        "answer": 0,
        "explanation": "`isna()`는 결측이면 True인 표를 만들고, `sum()`은 열마다 True의 개수를 센다. 정제를 시작할 때 가장 먼저 보는 숫자다."
      },
      {
        "id": "w2-data-cleaning-c5",
        "question": "\"서울\", \"Seoul\", \"서울 \"(끝에 공백)이 섞인 열에서 중복 행을 지우기 전에 해야 할 일은?",
        "choices": [
          "표기를 하나로 통일한다(공백 제거, 같은 뜻의 값 치환)",
          "결측값을 먼저 평균으로 채운다",
          "열 전체를 삭제한다",
          "아무것도 하지 않아도 같은 값으로 인식된다"
        ],
        "answer": 0,
        "explanation": "컴퓨터에게 \"서울\"과 \"서울 \"은 다른 문자열이다. 표기를 통일해야 같은 행이 중복으로 잡히고, 범주별 개수도 바르게 센다."
      }
    ],
    "quizIds": [
      "w2-q11",
      "w2-q12"
    ],
    "references": [
      {
        "title": "Google ML Crash Course — Working with numerical data",
        "url": "https://developers.google.com/machine-learning/crash-course/numerical-data",
        "note": "이상치·스케일링·구간화를 짧게 정리"
      },
      {
        "title": "pandas — Working with missing data",
        "url": "https://pandas.pydata.org/docs/user_guide/missing_data.html",
        "note": "isna·dropna·fillna 공식 문서"
      }
    ]
  },
  "features": {
    "tier": "core",
    "goal": "명목형·순서형 변수에 맞는 인코딩을 고르고, Min-Max와 Z-score 스케일링을 계산하며 \"훈련 데이터로만 fit\" 원칙을 지킬 수 있다.",
    "checks": [
      {
        "id": "w2-features-c1",
        "question": "'도시(서울/부산/대구)' 변수에 알맞은 인코딩은?",
        "choices": [
          "Label Encoding: 서울=0, 부산=1, 대구=2",
          "One-hot Encoding: 도시마다 0/1 열 하나씩",
          "Min-Max 정규화",
          "인코딩 없이 문자열 그대로"
        ],
        "answer": 1,
        "explanation": "순서가 없는 명목형 변수에 정수를 붙이면 모델이 \"대구(2)가 부산(1)의 2배\" 같은 없는 크기 관계를 배울 수 있다."
      },
      {
        "id": "w2-features-c2",
        "question": "$x = [2, 4, 6, 8]$을 Min-Max 정규화하면 6은 얼마가 되는가?",
        "choices": [
          "0.5",
          "0.667",
          "0.75",
          "6"
        ],
        "answer": 1,
        "explanation": "$(6 - 2)/(8 - 2) = 4/6 \\approx 0.667$."
      },
      {
        "id": "w2-features-c3",
        "question": "스케일러를 올바르게 쓰는 순서는?",
        "choices": [
          "전체 데이터로 fit → 그다음 훈련/테스트 분할",
          "훈련 데이터로 fit → 훈련·테스트 모두에 transform",
          "테스트 데이터로 fit → 훈련 데이터에 transform",
          "훈련·테스트 각각 따로 fit"
        ],
        "answer": 1,
        "explanation": "테스트 통계가 학습에 섞이면 누수가 된다. 테스트를 각자 따로 fit하는 것도 훈련과 다른 잣대로 변환하게 되어 틀린 방법이다."
      },
      {
        "id": "w2-features-c4",
        "question": "범주가 4개(봄·여름·가을·겨울)인 명목형 변수를 원-핫 인코딩하면 열이 몇 개 생기는가?",
        "choices": [
          "4개",
          "1개",
          "2개",
          "16개"
        ],
        "answer": 0,
        "explanation": "범주마다 0/1 열이 하나씩 생긴다. 각 행은 자기 계절 열에만 1을 갖는다."
      },
      {
        "id": "w2-features-c5",
        "question": "$x = [2, 4, 6, 8]$을 Z-score로 표준화했을 때 8의 값에 가장 가까운 것은? ($\\sigma = \\sqrt5 \\approx 2.236$)",
        "choices": [
          "1.342",
          "1",
          "0.75",
          "3"
        ],
        "answer": 0,
        "explanation": "평균 5를 빼면 3, 표준편차 2.236으로 나누면 약 1.342다. 평균보다 표준편차 1.34개만큼 크다는 뜻이다."
      }
    ],
    "quizIds": [
      "w2-q13",
      "w2-q14"
    ],
    "references": [
      {
        "title": "scikit-learn — Preprocessing data",
        "url": "https://scikit-learn.org/stable/modules/preprocessing.html",
        "note": "StandardScaler·MinMaxScaler·OneHotEncoder 사용법"
      },
      {
        "title": "Google ML Crash Course — Categorical data",
        "url": "https://developers.google.com/machine-learning/crash-course/categorical-data",
        "note": "원-핫 인코딩과 희소 표현"
      }
    ]
  },
  "regression-logistic": {
    "tier": "core",
    "goal": "회귀·분류에 맞는 손실(MSE·교차 엔트로피)을 고르고, 정규방정식·다항회귀·로지스틱 회귀의 기울기 $(p-y)x$를 유도·구현할 수 있다.",
    "checks": [
      {
        "id": "w2-regression-logistic-c1",
        "question": "정답이 $y = 1$일 때 모델이 $p = 0.01$로 예측했다. 교차 엔트로피 손실 $-\\log p$(자연로그)는 대략?",
        "choices": [
          "0.01",
          "0.99",
          "약 4.6",
          "무한대"
        ],
        "answer": 2,
        "explanation": "$-\\ln 0.01 \\approx 4.6$. 확신을 갖고 틀린 예측일수록 벌점이 급격히 커진다."
      },
      {
        "id": "w2-regression-logistic-c2",
        "question": "로지스틱 회귀에서 샘플 하나의 손실을 $w$로 미분한 결과는?",
        "choices": [
          "$(p - y)x$",
          "$(y - p)^2 x$",
          "$p(1-p)$",
          "$\\sigma(x)$"
        ],
        "answer": 0,
        "explanation": "$\\partial L/\\partial z = p - y$이고 $\\partial z/\\partial w = x$이므로 연쇄법칙으로 $(p-y)x$."
      },
      {
        "id": "w2-regression-logistic-c3",
        "question": "다항회귀 $\\hat y = w_0 + w_1 x + w_2 x^2$를 \"선형\" 회귀 방법으로 풀 수 있는 이유는?",
        "choices": [
          "$x$에 대해 선형이라서",
          "파라미터 $w$에 대해 선형이라서",
          "차수가 2 이하라서",
          "항상 정규방정식이 존재해서"
        ],
        "answer": 1,
        "explanation": "$x^2$을 새 특징으로 보면 모델은 파라미터에 대해 선형(linear in parameters)이므로 선형회귀의 손실·기울기를 그대로 쓸 수 있다."
      },
      {
        "id": "w2-regression-logistic-c4",
        "question": "로지스틱 회귀에서 $z = w^\\top x + b = 0$인 샘플의 예측 확률 $p$는?",
        "choices": [
          "0.5",
          "0",
          "1",
          "0.731"
        ],
        "answer": 0,
        "explanation": "$\\sigma(0) = \\frac{1}{1 + e^0} = 0.5$다. 그래서 $z = 0$인 점들의 모임 $w^\\top x + b = 0$이 결정 경계가 된다."
      },
      {
        "id": "w2-regression-logistic-c5",
        "question": "정답이 $y = 1$인 샘플에 모델이 $p = 0.7$을 예측했다. 경사하강법 한 걸음 뒤 이 샘플의 $p$는 대체로 어떻게 되는가?",
        "choices": [
          "커진다. $p - y < 0$이라 점수 $z$를 키우는 쪽으로 가중치가 움직이기 때문",
          "작아진다",
          "변하지 않는다",
          "정확히 1이 된다"
        ],
        "answer": 0,
        "explanation": "기울기 $(p - y)x$에서 $p - y = -0.3 < 0$이므로 $w \\leftarrow w - \\eta(p - y)x$는 $w$를 $x$ 방향으로 키워 $z$와 $p$를 올린다(학습률이 적당할 때)."
      }
    ],
    "quizIds": [
      "w2-q6"
    ],
    "references": [
      {
        "title": "CS229 Lecture Notes (선형회귀·로지스틱 회귀)",
        "url": "https://cs229.stanford.edu/main_notes.pdf",
        "note": "1장 선형회귀·정규방정식, 2장 로지스틱 회귀와 기울기 유도"
      },
      {
        "title": "ISLP (An Introduction to Statistical Learning)",
        "url": "https://www.statlearning.com/",
        "note": "3장 선형회귀, 4장 분류: 무료 PDF와 Python 실습"
      }
    ]
  },
  "trees-ensembles": {
    "tier": "core",
    "goal": "지니 불순도·정보이득으로 트리 분할을 계산하고, 배깅(랜덤 포레스트)과 부스팅이 각각 분산과 편향을 줄이는 방식을 설명할 수 있다.",
    "checks": [
      {
        "id": "w2-trees-ensembles-c1",
        "question": "양성 4개, 음성 4개가 섞인 노드의 지니 불순도는?",
        "choices": [
          "0",
          "0.25",
          "0.5",
          "1"
        ],
        "answer": 2,
        "explanation": "$1 - (4/8)^2 - (4/8)^2 = 0.5$. 두 클래스가 반반일 때 이진 분류의 지니 불순도가 최대다."
      },
      {
        "id": "w2-trees-ensembles-c2",
        "question": "랜덤 포레스트가 매 분할마다 특징의 일부만 무작위로 후보로 쓰는 이유는?",
        "choices": [
          "계산 속도를 위해서만",
          "트리들 사이의 상관관계를 낮춰 평균 냈을 때 분산이 더 줄어들게 하려고",
          "편향을 늘리려고",
          "과소적합을 막으려고"
        ],
        "answer": 1,
        "explanation": "강한 특징 하나를 모든 트리가 똑같이 쓰면 트리들이 비슷해져 평균의 효과가 약해진다."
      },
      {
        "id": "w2-trees-ensembles-c3",
        "question": "부스팅에 대한 설명으로 옳은 것은?",
        "choices": [
          "여러 모델을 독립적으로 병렬 학습해 평균 낸다",
          "이전 앙상블의 잔차(오차)를 다음 모델이 순차적으로 보완한다",
          "주로 분산을 줄인다",
          "결정트리에는 쓸 수 없다"
        ],
        "answer": 1,
        "explanation": "$F_m = F_{m-1} + \\eta h_m$처럼 오차를 한 걸음씩 줄여가며 주로 편향을 줄인다. 병렬·독립 학습은 배깅의 특징이다."
      },
      {
        "id": "w2-trees-ensembles-c4",
        "question": "샘플 1만 개로 부트스트랩 표본(1만 번, 중복 허용)을 만들면 서로 다른 원래 샘플은 대략 몇 %가 들어가는가?",
        "choices": [
          "약 63%",
          "100%",
          "50%",
          "약 37%"
        ],
        "answer": 0,
        "explanation": "한 샘플이 한 번도 안 뽑힐 확률은 $(1 - 1/n)^n \\approx 1/e \\approx 0.368$이다. 그래서 약 63%가 들어가고 나머지 약 37%가 OOB 샘플이 된다."
      },
      {
        "id": "w2-trees-ensembles-c5",
        "question": "양성 4개, 음성 4개가 섞인 노드의 엔트로피(밑 2)는?",
        "choices": [
          "1비트",
          "0.5비트",
          "0비트",
          "2비트"
        ],
        "answer": 0,
        "explanation": "$-[0.5\\log_2 0.5 + 0.5\\log_2 0.5] = 1$이다. 두 클래스가 반반이면 엔트로피는 최대(1비트), 지니는 최대(0.5)다."
      }
    ],
    "quizIds": [
      "w2-q17",
      "w2-q18",
      "w2-q19"
    ],
    "references": [
      {
        "title": "ISLP 8장 — Tree-Based Methods",
        "url": "https://www.statlearning.com/",
        "note": "결정트리·배깅·랜덤 포레스트·부스팅을 한 장에서"
      },
      {
        "title": "scikit-learn — Ensembles",
        "url": "https://scikit-learn.org/stable/modules/ensemble.html",
        "note": "RandomForest·GradientBoosting·HistGradientBoosting"
      }
    ]
  },
  "bias-variance": {
    "tier": "core",
    "goal": "훈련·검증 오차로 과적합과 과소적합을 진단하고, 편향의 제곱과 분산을 숫자로 분해하며 L1·L2 정규화로 복잡도를 조절할 수 있다.",
    "checks": [
      {
        "id": "w2-bias-variance-c1",
        "question": "훈련 오차 0.01, 검증 오차 0.30인 모델의 진단과 알맞은 처방은?",
        "choices": [
          "과소적합: 더 복잡한 모델",
          "과적합: 정규화 강화나 데이터 추가",
          "정상: 그대로 사용",
          "누수: 테스트셋으로 다시 학습"
        ],
        "answer": 1,
        "explanation": "훈련은 잘하지만 새 데이터에서 크게 틀리는 전형적인 과적합(분산이 큼)이다."
      },
      {
        "id": "w2-bias-variance-c2",
        "question": "같은 참값 10을 예측하는 모델의 예측이 $6, 14, 8, 15, 7$로 나왔다. 이 모델의 상태는?",
        "choices": [
          "편향이 크고 분산이 작다",
          "편향은 0에 가깝고 분산이 크다",
          "편향과 분산 모두 0이다",
          "편향과 분산이 모두 크다"
        ],
        "answer": 1,
        "explanation": "평균은 10으로 참값과 같아 편향의 제곱은 0이지만 분산이 14로 크다(본문의 모델 B)."
      },
      {
        "id": "w2-bias-variance-c3",
        "question": "L1 정규화(Lasso)가 일부 가중치를 정확히 0으로 만드는 이유는?",
        "choices": [
          "벌점의 기울기가 가중치 크기에 비례해서",
          "벌점의 기울기가 가중치 크기와 무관하게 $\\pm\\lambda$로 일정해서, 작은 가중치를 끝까지 0으로 밀어붙이므로",
          "가중치를 제곱하기 때문에",
          "학습률이 커서"
        ],
        "answer": 1,
        "explanation": "L2의 벌점 기울기 $2\\lambda w$는 0에 가까울수록 약해져 정확히 0에 닿지 않지만, L1은 일정한 힘으로 밀어 희소성을 만든다."
      },
      {
        "id": "w2-bias-variance-c4",
        "question": "훈련 데이터를 늘려도 훈련 오차와 검증 오차가 둘 다 0.4 근처에서 만나 더 내려가지 않는다. 가장 알맞은 처방은?",
        "choices": [
          "더 복잡한 모델이나 더 좋은 특징을 쓴다",
          "데이터를 10배 더 모은다",
          "정규화를 더 강하게 한다",
          "검증셋을 줄인다"
        ],
        "answer": 0,
        "explanation": "두 곡선이 높은 곳에서 만나는 것은 과소적합(편향이 큼)의 신호다. 데이터를 늘려도 이 높이는 내려가지 않고, 정규화를 강하게 하면 오히려 더 단순해진다."
      },
      {
        "id": "w2-bias-variance-c5",
        "question": "L2 정규화 $L + \\lambda\\lVert w \\rVert_2^2$에서 $\\lambda$를 아주 크게 키우면 모델은 어떻게 되는가?",
        "choices": [
          "가중치가 모두 0에 가까워져 과소적합(편향이 큼)에 가까워진다",
          "과적합이 심해진다",
          "훈련 오차가 0이 된다",
          "아무 영향이 없다"
        ],
        "answer": 0,
        "explanation": "벌점이 지배하면 손실을 줄이는 것보다 가중치를 작게 만드는 것이 우선이 되어, 모델이 거의 상수처럼 단순해진다. $\\lambda$는 편향과 분산 사이를 조절하는 손잡이다."
      }
    ],
    "quizIds": [
      "w2-q2",
      "w2-q3",
      "w2-q7"
    ],
    "references": [
      {
        "title": "MLU-Explain — The Bias Variance Tradeoff",
        "url": "https://mlu-explain.github.io/bias-variance/",
        "note": "AWS의 인터랙티브 설명: 복잡도 슬라이더로 직접 확인"
      },
      {
        "title": "ISLP 6장 — Linear Model Selection and Regularization",
        "url": "https://www.statlearning.com/",
        "note": "Ridge·Lasso와 계수 경로"
      }
    ]
  },
  "validation-leakage": {
    "tier": "core",
    "goal": "훈련·검증·테스트셋의 역할과 K-Fold 교차검증을 설명하고, 전처리를 파이프라인에 넣어 데이터 누수를 막을 수 있다.",
    "checks": [
      {
        "id": "w2-validation-leakage-c1",
        "question": "검증셋과 테스트셋의 역할을 올바르게 짝지은 것은?",
        "choices": [
          "검증: 파라미터 학습 / 테스트: 하이퍼파라미터 선택",
          "검증: 하이퍼파라미터 선택 / 테스트: 모든 결정이 끝난 뒤 최종 성능 1회 추정",
          "둘 다 하이퍼파라미터 선택",
          "테스트셋 점수를 보고 모델을 고르는 것이 가장 정확하다"
        ],
        "answer": 1,
        "explanation": "테스트 점수를 보고 결정을 바꾸는 순간 테스트셋 정보가 모델 선택에 새어 들어가 더 이상 편향 없는 추정치가 아니게 된다."
      },
      {
        "id": "w2-validation-leakage-c2",
        "question": "다음 중 데이터 누수에 해당하지 **않는** 것은?",
        "choices": [
          "분할 전에 전체 데이터로 표준화",
          "같은 환자의 샘플이 훈련·테스트에 모두 존재",
          "예측 시점 이후의 정보를 특징으로 사용",
          "스케일러를 파이프라인에 넣어 교차검증"
        ],
        "answer": 3,
        "explanation": "파이프라인 안의 스케일러는 매 fold의 훈련 부분만 보고 fit하므로 누수를 막는 올바른 방법이다."
      },
      {
        "id": "w2-validation-leakage-c3",
        "question": "완전히 무작위인 데이터에서 교차검증 정확도가 85%가 나왔다. 가장 먼저 의심할 것은?",
        "choices": [
          "모델이 매우 뛰어나다",
          "데이터 누수(검증 fold의 정보가 전처리·특징 선택에 섞였다)",
          "학습률이 너무 작다",
          "K-Fold의 K가 너무 크다"
        ],
        "answer": 1,
        "explanation": "정보가 없는 데이터에서 우연 수준(50%)보다 크게 높다면, 평가 과정 어딘가에서 정답 정보가 새어 들어간 것이다."
      },
      {
        "id": "w2-validation-leakage-c4",
        "question": "5-Fold 교차검증 결과 \"F1 = 0.970 ± 0.012\"에서 ±0.012에 대한 설명으로 옳은 것은?",
        "choices": [
          "참 F1이 95% 확률로 0.958~0.982 사이에 있다는 신뢰구간이다",
          "fold 점수 5개의 흩어짐을 요약한 값으로, fold끼리 훈련 데이터가 겹쳐 서로 독립이 아니므로 신뢰구간으로 해석하면 안 된다",
          "테스트셋에서의 오차 범위다",
          "표준편차가 작을수록 모델이 더 정확하다는 뜻이다"
        ],
        "answer": 1,
        "explanation": "5-Fold에서 두 fold의 훈련 데이터는 75%가 겹친다. 이런 상관 때문에 K-Fold 평균의 분산을 편향 없이 추정하는 일반적인 방법이 없다(Bengio & Grandvalet, 2004). 또 np.std(ddof=0)와 pandas .std()(ddof=1)는 같은 점수에서도 값이 다르므로 무엇을 계산했는지 밝힌다."
      },
      {
        "id": "w2-validation-leakage-c5",
        "question": "샘플 100개로 5-Fold 교차검증을 할 때, 각 샘플은 검증에 몇 번 쓰이고 한 번의 학습에는 몇 개가 쓰이는가?",
        "choices": [
          "검증에 정확히 1번, 학습에는 80개",
          "검증에 5번, 학습에는 100개",
          "검증에 1번, 학습에는 20개",
          "검증에 0번, 학습에는 80개"
        ],
        "answer": 0,
        "explanation": "100개를 20개씩 다섯 조각으로 나눠, 매번 한 조각(20개)을 검증으로 빼고 나머지 80개로 학습한다. 다섯 번 돌면 모든 샘플이 한 번씩 검증된다."
      },
      {
        "id": "w2-validation-leakage-c6",
        "question": "양성이 5%뿐인 분류 데이터에서 교차검증을 할 때 `StratifiedKFold`를 쓰는 이유는?",
        "choices": [
          "fold마다 양성 비율(5%)이 유지되어, 양성이 거의 없는 fold가 생기지 않게 하려고",
          "학습 속도를 높이려고",
          "데이터 누수를 완전히 막으려고",
          "양성 샘플을 복제해 늘리려고"
        ],
        "answer": 0,
        "explanation": "무작위로 나누면 어떤 fold에는 양성이 거의 없어 점수가 크게 흔들린다. 층화(stratify)는 원래 비율을 fold마다 유지한다. 누수 방지는 별개의 문제다."
      }
    ],
    "quizIds": [
      "w2-q5",
      "w2-q8"
    ],
    "references": [
      {
        "title": "scikit-learn — Common pitfalls: Data leakage",
        "url": "https://scikit-learn.org/stable/common_pitfalls.html",
        "note": "누수와 파이프라인 사용법을 공식 문서가 직접 설명"
      },
      {
        "title": "scikit-learn — Cross-validation",
        "url": "https://scikit-learn.org/stable/modules/cross_validation.html",
        "note": "K-Fold·Stratified·Group K-Fold"
      }
    ]
  },
  "classification-metrics": {
    "tier": "core",
    "goal": "혼동행렬에서 Accuracy·Precision·Recall·F1·Specificity를 계산하고, 임계값과 ROC 곡선·AUC의 의미를 확률적 해석까지 설명할 수 있다.",
    "checks": [
      {
        "id": "w2-classification-metrics-c1",
        "question": "$TP = 40$, $FP = 10$, $FN = 20$일 때 Precision과 Recall은?",
        "choices": [
          "Precision 0.8, Recall 0.667",
          "Precision 0.667, Recall 0.8",
          "Precision 0.8, Recall 0.8",
          "Precision 0.4, Recall 0.2"
        ],
        "answer": 0,
        "explanation": "Precision $= 40/50 = 0.8$, Recall $= 40/60 \\approx 0.667$."
      },
      {
        "id": "w2-classification-metrics-c2",
        "question": "암을 놓치는 것(False Negative)이 가장 치명적인 검진 모델에서 우선할 지표는?",
        "choices": [
          "Precision",
          "Recall",
          "Specificity",
          "Accuracy"
        ],
        "answer": 1,
        "explanation": "Recall은 실제 양성 중 놓치지 않은 비율이다. 임계값을 낮춰 Recall을 높이는 대신 FP 증가를 감수한다."
      },
      {
        "id": "w2-classification-metrics-c3",
        "question": "AUC $= 0.83$의 가장 정확한 해석은?",
        "choices": [
          "정확도가 83%다",
          "임계값 0.5에서 Recall이 0.83이다",
          "양성 하나와 음성 하나를 무작위로 뽑으면 양성에 더 높은 점수를 줄 확률이 0.83이다",
          "83%의 샘플을 양성으로 예측한다"
        ],
        "answer": 2,
        "explanation": "AUC는 임계값과 무관한 순위 능력이다. 본문 예제에서 6쌍 중 5쌍의 순서가 맞아 $5/6 \\approx 0.833$이었다."
      },
      {
        "id": "w2-classification-metrics-c4",
        "question": "클래스 A(support 90, recall 1.0)와 B(support 10, recall 0.0)의 macro 평균 recall과 weighted 평균 recall은?",
        "choices": [
          "macro 0.5, weighted 0.9",
          "macro 0.9, weighted 0.5",
          "둘 다 0.5",
          "둘 다 0.9"
        ],
        "answer": 0,
        "explanation": "macro는 $(1.0 + 0.0)/2 = 0.5$, weighted는 $(1.0 \\times 90 + 0.0 \\times 10)/100 = 0.9$다. weighted는 다수 클래스가 소수 클래스의 실패를 가린다."
      },
      {
        "id": "w2-classification-metrics-c5",
        "question": "$TN = 90$, $FP = 10$일 때 특이도(Specificity)와 FPR은?",
        "choices": [
          "특이도 0.9, FPR 0.1",
          "특이도 0.1, FPR 0.9",
          "특이도 0.9, FPR 0.9",
          "특이도 0.5, FPR 0.5"
        ],
        "answer": 0,
        "explanation": "특이도는 $\\frac{TN}{TN + FP} = \\frac{90}{100} = 0.9$이고, FPR은 $\\frac{FP}{FP + TN} = 0.1$로 항상 $1 - \\text{특이도}$다."
      }
    ],
    "quizIds": [
      "w2-q1",
      "w2-q4",
      "w2-q9",
      "w2-q10",
      "w2-q24"
    ],
    "references": [
      {
        "title": "Google ML Crash Course — Classification: Accuracy, precision, recall",
        "url": "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall",
        "note": "지표 정의와 임계값의 관계"
      },
      {
        "title": "MLU-Explain — ROC & AUC",
        "url": "https://mlu-explain.github.io/roc-auc/",
        "note": "임계값을 움직이며 ROC 곡선을 그려보는 인터랙티브 자료"
      }
    ]
  },
  "regression-metrics-baseline": {
    "tier": "core",
    "goal": "MAE·MSE·RMSE·$R^2$를 계산하고, 베이스라인 대비 성능과 점수의 흔들림, 오차 분석으로 모델 결과를 해석할 수 있다.",
    "checks": [
      {
        "id": "w2-regression-metrics-baseline-c1",
        "question": "실제값 $[2, 4, 6]$, 예측값 $[3, 3, 9]$일 때 MAE와 MSE는?",
        "choices": [
          "MAE $= 5/3$, MSE $= 11/3$",
          "MAE $= 1$, MSE $= 1$",
          "MAE $= 11/3$, MSE $= 5/3$",
          "MAE $= 5$, MSE $= 11$"
        ],
        "answer": 0,
        "explanation": "오차 절댓값 $1, 1, 3$ → MAE $= 5/3$, 제곱 $1, 1, 9$ → MSE $= 11/3$. 큰 오차(3) 하나가 MSE를 훨씬 크게 끌어올린다."
      },
      {
        "id": "w2-regression-metrics-baseline-c2",
        "question": "$R^2 = 0$인 회귀 모델의 의미는?",
        "choices": [
          "완벽한 모델",
          "항상 평균만 예측하는 베이스라인과 오차가 같다",
          "오차가 0이다",
          "음수 예측만 한다"
        ],
        "answer": 1,
        "explanation": "$R^2 = 1 - \\text{MSE}_{\\text{model}}/\\text{MSE}_{\\text{baseline}}$이므로 0이면 베이스라인보다 나을 것이 없고, 음수면 오히려 더 나쁘다."
      },
      {
        "id": "w2-regression-metrics-baseline-c3",
        "question": "모델 A의 F1이 $0.976 \\pm 0.010$, 모델 B가 $0.970 \\pm 0.015$(5-Fold)다. 가장 적절한 결론은?",
        "choices": [
          "A가 B보다 확실히 낫다",
          "이 요약만으로는 우열을 단정할 수 없고, 같은 fold에서의 점수 차이를 확인해야 한다",
          "B가 더 낫다",
          "둘 다 베이스라인보다 못하다"
        ],
        "answer": 1,
        "explanation": "평균 차이 0.006이 fold 간 흔들림보다 작다. 다만 ±값은 fold 점수의 흩어짐이지 신뢰구간이 아니므로, 두 모델을 같은 fold로 평가했다면 fold별 차이(짝지은 비교)를 보는 것이 더 정확하다. 그래도 차이가 작다면 다른 근거(해석 가능성, 속도, 오류 유형)도 함께 본다."
      },
      {
        "id": "w2-regression-metrics-baseline-c4",
        "question": "테스트 데이터에서 어떤 회귀 모델의 $R^2$가 $-0.5$로 나왔다. 이것의 의미는?",
        "choices": [
          "항상 평균만 예측하는 베이스라인보다 오차가 크다",
          "계산 오류다. $R^2$는 항상 0 이상이다",
          "설명력이 50%다",
          "과소적합이 아니라는 뜻이다"
        ],
        "answer": 0,
        "explanation": "$R^2 = 1 - \\frac{\\text{모델 오차}}{\\text{베이스라인 오차}}$라서 모델 오차가 베이스라인보다 크면 음수다. 새 데이터에서는 흔히 일어날 수 있다."
      },
      {
        "id": "w2-regression-metrics-baseline-c5",
        "question": "어떤 모델의 MAE는 2인데 RMSE는 10이다. 가장 그럴듯한 해석은?",
        "choices": [
          "대부분은 작게 틀리지만 소수의 아주 큰 오차가 섞여 있다",
          "모든 샘플을 고르게 10씩 틀린다",
          "MAE와 RMSE는 항상 같으므로 계산이 틀렸다",
          "모델이 완벽하다"
        ],
        "answer": 0,
        "explanation": "RMSE는 제곱 평균이라 큰 오차에 훨씬 민감하다. 오차가 고르면 둘이 비슷하고, RMSE가 MAE보다 크게 벌어지면 큰 오차가 몇 개 있다는 뜻이다."
      }
    ],
    "quizIds": [
      "w2-q22",
      "w2-q23",
      "w2-q25"
    ],
    "references": [
      {
        "title": "scikit-learn — Metrics and scoring",
        "url": "https://scikit-learn.org/stable/modules/model_evaluation.html",
        "note": "회귀·분류 지표와 DummyClassifier/DummyRegressor 베이스라인"
      },
      {
        "title": "Google — Rules of Machine Learning",
        "url": "https://developers.google.com/machine-learning/guides/rules-of-ml",
        "note": "\"단순한 베이스라인부터\", 지표 선택, 오차 분석에 관한 실무 규칙 모음"
      }
    ]
  },
  "knn-naive-bayes": {
    "tier": "supplement",
    "goal": "KNN의 거리·다수결 예측과 $K$에 따른 편향-분산을, 나이브 베이즈의 조건부 독립 가정과 계산 과정을 설명할 수 있다.",
    "checks": [
      {
        "id": "w2-knn-naive-bayes-c1",
        "question": "KNN이 다른 모델과 가장 다른 점은?",
        "choices": [
          "확률을 전혀 쓰지 않는다",
          "파라미터 $w, b$를 학습하는 과정 없이 예측 때 훈련 데이터와의 거리를 계산한다",
          "회귀에는 쓸 수 없다",
          "특징 스케일링이 필요 없다"
        ],
        "answer": 1,
        "explanation": "KNN은 훈련 데이터를 저장해두고 예측할 때마다 거리를 잰다. 거리 기반이라 오히려 스케일링이 매우 중요하다."
      },
      {
        "id": "w2-knn-naive-bayes-c2",
        "question": "KNN에서 $K = 1$일 때 훈련 정확도가 거의 항상 1.0이 되는 이유는?",
        "choices": [
          "모델이 완벽해서",
          "훈련 샘플의 가장 가까운 이웃이 자기 자신이라서",
          "$K$가 작을수록 편향이 커서",
          "테스트 데이터를 봤기 때문에"
        ],
        "answer": 1,
        "explanation": "자기 자신과의 거리가 0이므로 자기 레이블을 그대로 답한다. 그래서 훈련 정확도는 일반화 성능을 전혀 말해주지 않는다."
      },
      {
        "id": "w2-knn-naive-bayes-c3",
        "question": "나이브 베이즈가 \"나이브(naive)\"한 이유는?",
        "choices": [
          "사전확률을 무시해서",
          "클래스가 주어졌을 때 특징들이 서로 조건부 독립이라고 가정해서",
          "데이터를 전부 외워서",
          "베이즈 정리를 쓰지 않아서"
        ],
        "answer": 1,
        "explanation": "이 가정 덕분에 $P(x_1,\\dots,x_n|c) = \\prod_i P(x_i|c)$로 쪼개져 계산이 쉬워진다. 순위 비교만 맞으면 되므로 가정이 틀려도 잘 작동하는 경우가 많다."
      },
      {
        "id": "w2-knn-naive-bayes-c4",
        "question": "나이(20~60)와 연봉(2000~8000만 원)을 그대로 KNN에 넣으면 생기는 문제는?",
        "choices": [
          "연봉의 값이 커서 거리를 거의 연봉 차이만으로 정하게 된다",
          "나이가 거리를 독차지한다",
          "KNN은 단위의 영향을 받지 않는다",
          "학습 시간이 0이 된다"
        ],
        "answer": 0,
        "explanation": "유클리드 거리는 각 축의 차이를 그대로 제곱해 더하므로 숫자가 큰 특징이 지배한다. 스케일링으로 축을 맞춘 뒤 거리를 재야 한다."
      },
      {
        "id": "w2-knn-naive-bayes-c5",
        "question": "나이브 베이즈에서 라플라스 스무딩(개수에 1을 더하기)을 쓰는 이유는?",
        "choices": [
          "훈련 데이터에 없던 단어 하나 때문에 확률 곱 전체가 0이 되는 것을 막으려고",
          "계산을 빠르게 하려고",
          "특징들의 조건부 독립을 보장하려고",
          "클래스 불균형을 없애려고"
        ],
        "answer": 0,
        "explanation": "곱 안에 0이 하나라도 있으면 다른 증거와 상관없이 그 클래스의 확률이 0이 된다. 1을 더해 본 적 없는 경우에도 작은 확률을 남긴다."
      }
    ],
    "quizIds": [
      "w2-q15",
      "w2-q16"
    ],
    "references": [
      {
        "title": "scikit-learn — Nearest Neighbors",
        "url": "https://scikit-learn.org/stable/modules/neighbors.html",
        "note": "KNN 분류·회귀와 거리 척도"
      },
      {
        "title": "scikit-learn — Naive Bayes",
        "url": "https://scikit-learn.org/stable/modules/naive_bayes.html",
        "note": "Gaussian·Multinomial 나이브 베이즈 비교"
      }
    ]
  },
  "svm-unsupervised": {
    "tier": "supplement",
    "goal": "SVM의 마진·서포트벡터를 계산하고, K-Means의 할당-갱신 반복과 PCA가 분산이 큰 방향(공분산의 고유벡터)을 찾는 원리를 설명할 수 있다.",
    "checks": [
      {
        "id": "w2-svm-unsupervised-c1",
        "question": "SVM에서 $w = (0.5, -0.5)$일 때 마진 폭 $2/\\lVert w\\rVert$는?",
        "choices": [
          "$\\sqrt{2} \\approx 1.41$",
          "$2\\sqrt{2} \\approx 2.83$",
          "4",
          "0.5"
        ],
        "answer": 1,
        "explanation": "$\\lVert w\\rVert = \\sqrt{0.25 + 0.25} = \\sqrt{0.5} \\approx 0.707$이므로 $2/0.707 \\approx 2.83$."
      },
      {
        "id": "w2-svm-unsupervised-c2",
        "question": "K-Means의 한 반복을 올바르게 나타낸 것은?",
        "choices": [
          "레이블 $y$로 중심을 정한다",
          "각 점을 가장 가까운 중심에 배정 → 배정된 점들의 평균으로 중심을 갱신",
          "가장 먼 점끼리 묶는다",
          "주성분 방향으로 투영한다"
        ],
        "answer": 1,
        "explanation": "할당과 갱신을 배정이 바뀌지 않을 때까지 반복한다. 레이블을 쓰지 않으므로 비지도학습이다."
      },
      {
        "id": "w2-svm-unsupervised-c3",
        "question": "모든 점이 정확히 직선 $y = x$ 위에 있는 2차원 데이터에 PCA를 하면 PC1과 PC2의 분산 설명 비율은?",
        "choices": [
          "0.5, 0.5",
          "1.0, 0.0",
          "0.0, 1.0",
          "0.7, 0.3"
        ],
        "answer": 1,
        "explanation": "모든 변동이 $(1,1)$ 방향에만 있으므로 PC1 하나가 분산의 100%를 설명한다(공분산 행렬의 고유값 4와 0)."
      },
      {
        "id": "w2-svm-unsupervised-c4",
        "question": "PCA의 누적 설명 비율이 PC1~PC4에서 $[0.44, 0.63, 0.73, 0.79]$일 때, 분산의 70% 이상을 설명하는 최소 주성분 수는?",
        "choices": [
          "3개",
          "1개",
          "2개",
          "4개"
        ],
        "answer": 0,
        "explanation": "누적 비율이 처음으로 0.7을 넘는 것은 PC3(0.73)이다. 그래서 세 개의 주성분이면 분산의 73%를 보존한다."
      },
      {
        "id": "w2-svm-unsupervised-c5",
        "question": "PCA 전에 특징을 표준화하는 가장 중요한 이유는?",
        "choices": [
          "단위 때문에 값이 큰 특징이 분산을 독차지해 주성분을 왜곡하지 않게 하려고",
          "계산 속도를 높이려고",
          "주성분의 개수를 늘리려고",
          "레이블을 만들려고"
        ],
        "answer": 0,
        "explanation": "PCA는 분산이 큰 방향을 찾는다. 넓이(수천)와 비율(0~1)을 섞으면 넓이의 분산이 압도해, 의미가 아니라 단위가 주성분을 정한다."
      }
    ],
    "quizIds": [
      "w2-q20",
      "w2-q21"
    ],
    "references": [
      {
        "title": "scikit-learn — Support Vector Machines",
        "url": "https://scikit-learn.org/stable/modules/svm.html",
        "note": "마진·커널·C 파라미터"
      },
      {
        "title": "Setosa — Principal Component Analysis explained visually",
        "url": "https://setosa.io/ev/principal-component-analysis/",
        "note": "PCA를 인터랙티브 그래프로 이해하기"
      }
    ]
  },
  "pipeline-tuning": {
    "tier": "supplement",
    "goal": "숫자·범주·결측이 섞인 데이터를 ColumnTransformer 파이프라인으로 누수 없이 전처리하고, GridSearchCV로 하이퍼파라미터를 고르며, 그룹·시계열 데이터에 맞는 분할을 고를 수 있다.",
    "checks": [
      {
        "id": "w2-pipeline-tuning-c1",
        "question": "`make_pipeline(StandardScaler(), LogisticRegression())`의 규제 강도 `C`를 `GridSearchCV`에서 탐색할 때 파라미터 이름은?",
        "choices": [
          "`logisticregression__C`",
          "`C`",
          "`LogisticRegression.C`",
          "`pipeline_C`"
        ],
        "answer": 0,
        "explanation": "파이프라인 안쪽 단계의 파라미터는 `단계이름__파라미터`(밑줄 두 개)로 가리킨다. `make_pipeline`은 단계 이름을 클래스 이름의 소문자로 붙이므로 `logisticregression__C`다."
      },
      {
        "id": "w2-pipeline-tuning-c2",
        "question": "훈련 데이터에 없던 도시 \"광주\"가 예측 시점에 들어왔다. `OneHotEncoder(handle_unknown=\"ignore\")`의 동작은?",
        "choices": [
          "도시 원-핫 열을 모두 0으로 두고 예측을 계속한다",
          "오류를 내고 멈춘다",
          "가장 흔한 도시로 바꿔 넣는다",
          "그 행을 삭제한다"
        ],
        "answer": 0,
        "explanation": "기본값(`\"error\"`)은 처음 보는 범주에서 오류를 낸다. `\"ignore\"`는 해당 원-핫 열을 모두 0으로 두어 서비스가 멈추지 않게 한다."
      },
      {
        "id": "w2-pipeline-tuning-c3",
        "question": "환자 80명에게서 각각 5장의 사진을 얻었다. 환자 단위로 일반화 성능을 재려면 어떤 분할이 알맞은가?",
        "choices": [
          "GroupKFold(환자 ID를 그룹으로)",
          "샘플을 섞는 KFold",
          "TimeSeriesSplit",
          "분할 없이 훈련 정확도"
        ],
        "answer": 0,
        "explanation": "같은 환자의 다른 사진이 훈련에 있으면 모델이 그 환자를 외워 맞힌다. 한 실험에서 1-NN이 KFold로는 1.000, GroupKFold로는 약 0.64로 갈렸다. 그룹 단위로 나눠야 처음 보는 환자에 대한 성능이 된다."
      },
      {
        "id": "w2-pipeline-tuning-c4",
        "question": "`GridSearchCV`의 `best_score_`에 대한 설명으로 옳은 것은?",
        "choices": [
          "후보 중 가장 높은 교차검증 점수라 실제 성능보다 낙관적이다",
          "테스트셋 점수와 같다",
          "항상 실제 성능보다 낮다",
          "후보 전체의 평균 점수다"
        ],
        "answer": 0,
        "explanation": "잡음이 있는 점수 여러 개 중 최댓값을 골랐으므로 체계적으로 부풀려진다. 정직한 추정은 따로 떼어 둔 테스트셋이나 중첩 교차검증으로 얻는다."
      },
      {
        "id": "w2-pipeline-tuning-c5",
        "question": "후보가 `max_depth` 5개와 `n_estimators` 3개의 모든 조합이고 5-Fold인 `GridSearchCV`는 (최종 재학습을 빼고) 모델을 몇 번 학습하는가?",
        "choices": [
          "75번",
          "15번",
          "8번",
          "25번"
        ],
        "answer": 0,
        "explanation": "조합이 $5 \\times 3 = 15$개이고 조합마다 fold 5개를 돌리므로 $15 \\times 5 = 75$번이다."
      },
      {
        "id": "w2-pipeline-tuning-c6",
        "question": "하이퍼파라미터 종류가 많아 조합이 수천 개일 때 흔히 쓰는 대안은?",
        "choices": [
          "정해진 횟수만큼 조합을 무작위로 뽑는 `RandomizedSearchCV`",
          "테스트셋으로 직접 고르기",
          "모든 조합을 한 fold로만 평가하기",
          "하이퍼파라미터를 학습 중에 경사하강법으로 정하기"
        ],
        "answer": 0,
        "explanation": "격자 탐색은 조합이 곱으로 늘어난다. 무작위 탐색은 예산을 정해 두고 다양한 값을 시험한다. 테스트셋으로 고르면 누수다."
      }
    ],
    "quizIds": [
      "w2-q26"
    ],
    "references": [
      {
        "title": "scikit-learn — Column Transformer with Mixed Types",
        "url": "https://scikit-learn.org/stable/auto_examples/compose/plot_column_transformer_mixed_types.html",
        "note": "숫자·범주 열을 함께 처리하는 공식 예제"
      },
      {
        "title": "scikit-learn — Cross-validation iterators for grouped data",
        "url": "https://scikit-learn.org/stable/modules/cross_validation.html#group-k-fold",
        "note": "GroupKFold·TimeSeriesSplit이 필요한 상황"
      }
    ]
  },
  "imbalance-threshold": {
    "tier": "supplement",
    "goal": "양성이 드문 문제에서 PR 곡선·Average Precision을 해석하고, 오류 비용으로 임계값 $t^* = C_{FP}/(C_{FP}+C_{FN})$을 계산하며, 신뢰도 표와 브라이어 점수로 확률 보정을 점검할 수 있다.",
    "checks": [
      {
        "id": "w2-imbalance-threshold-c1",
        "question": "양성 비율이 2%인 데이터에서 무작위로 점수를 매기는 분류기의 Average Precision(PR 곡선 아래 면적)은 대략?",
        "choices": [
          "0.02",
          "0.5",
          "1.0",
          "0"
        ],
        "answer": 0,
        "explanation": "무작위 분류기의 Precision은 어느 임계값에서나 양성 비율과 같으므로 PR 곡선의 기준선은 0.02다. ROC-AUC의 기준선 0.5와 다르다."
      },
      {
        "id": "w2-imbalance-threshold-c2",
        "question": "양성을 놓치는 비용이 오경보의 4배($C_{FN}=4$, $C_{FP}=1$)이고 확률이 잘 보정되어 있다면 최적 임계값은?",
        "choices": [
          "0.2",
          "0.5",
          "0.8",
          "0.25"
        ],
        "answer": 0,
        "explanation": "$t^* = C_{FP}/(C_{FP}+C_{FN}) = 1/5 = 0.2$. 확률이 0.2만 넘어도 양성으로 처리하는 것이 기대 비용이 작다."
      },
      {
        "id": "w2-imbalance-threshold-c3",
        "question": "`class_weight=\"balanced\"`로 학습한 로지스틱 회귀에 대한 설명으로 옳은 것은?",
        "choices": [
          "순위(ROC-AUC)는 거의 같지만 예측 확률이 부풀어 실제 빈도와 맞지 않는다",
          "ROC-AUC가 항상 크게 오른다",
          "예측 확률이 더 잘 보정된다",
          "임계값과 무관하게 비용이 최소가 된다"
        ],
        "answer": 0,
        "explanation": "한 실험에서 두 모델의 ROC-AUC·AP는 같았지만, balanced 모델의 평균 예측 확률은 실제 비율 0.078 대신 약 0.34였다. 확률을 비용 계산에 쓰려면 가중치 없이 학습하고 임계값을 옮기는 편이 낫다."
      },
      {
        "id": "w2-imbalance-threshold-c4",
        "question": "예측 확률 $[0.8, 0.4]$, 정답 $[1, 0]$의 브라이어 점수는?",
        "choices": [
          "0.1",
          "0.2",
          "0.4",
          "0.6"
        ],
        "answer": 0,
        "explanation": "$\\frac{(0.8 - 1)^2 + (0.4 - 0)^2}{2} = \\frac{0.04 + 0.16}{2} = 0.1$이다."
      },
      {
        "id": "w2-imbalance-threshold-c5",
        "question": "오경보 비용이 3, 놓치는 비용이 1인 문제(예: 스팸 필터)에서 보정된 확률의 최적 임계값은?",
        "choices": [
          "0.75",
          "0.25",
          "0.5",
          "0.33"
        ],
        "answer": 0,
        "explanation": "$t^* = \\frac{C_{FP}}{C_{FP} + C_{FN}} = \\frac{3}{3 + 1} = 0.75$다. 오경보가 비쌀수록 확실할 때만 양성으로 처리하도록 임계값이 올라간다."
      }
    ],
    "quizIds": [
      "w2-q27"
    ],
    "references": [
      {
        "title": "scikit-learn — Probability calibration",
        "url": "https://scikit-learn.org/stable/modules/calibration.html",
        "note": "신뢰도 곡선·Platt 스케일링·등위 회귀"
      },
      {
        "title": "Saito & Rehmsmeier (2015) — The Precision-Recall Plot Is More Informative than the ROC Plot",
        "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0118432",
        "note": "불균형 데이터에서 PR 곡선을 보는 이유 (영문)"
      }
    ]
  },
  "loss-likelihood": {
    "tier": "advanced",
    "goal": "가우시안·베르누이 가능도에서 MSE와 교차 엔트로피를 유도하고, L2·L1 정규화를 가우시안·라플라스 사전분포의 MAP로 설명하며, 로지스틱 손실의 볼록성과 선형분리 데이터에서의 발산을 분석할 수 있다.",
    "checks": [
      {
        "id": "w2-loss-likelihood-c1",
        "question": "잡음을 정규분포가 아니라 라플라스 분포 $p(\\varepsilon) \\propto e^{-|\\varepsilon|/b}$로 가정하고 최대가능도를 구하면 최소화하는 손실은?",
        "choices": [
          "평균절대오차(MAE)",
          "평균제곱오차(MSE)",
          "교차 엔트로피",
          "힌지 손실"
        ],
        "answer": 0,
        "explanation": "음의 로그가능도가 $\\frac{1}{b}\\sum|y_i - \\hat y_i| + $상수이므로 MAE다. 꼬리가 두꺼운 잡음(이상치)을 가정하면 큰 오차에 덜 민감한 손실이 나온다."
      },
      {
        "id": "w2-loss-likelihood-c2",
        "question": "Ridge 회귀를 가중치의 가우시안 사전분포 $\\mathcal{N}(0, \\tau^2)$와 잡음 분산 $\\sigma^2$의 MAP로 보면 규제 강도 $\\lambda$는?",
        "choices": [
          "$\\sigma^2/\\tau^2$",
          "$\\tau^2/\\sigma^2$",
          "$\\sigma^2\\tau^2$",
          "$1/\\tau$"
        ],
        "answer": 0,
        "explanation": "NLL의 $\\frac{1}{2\\sigma^2}\\lVert y - Xw\\rVert^2$와 음의 로그 사전 $\\frac{1}{2\\tau^2}\\lVert w\\rVert^2$를 $2\\sigma^2$배 하면 $\\lVert y - Xw\\rVert^2 + \\frac{\\sigma^2}{\\tau^2}\\lVert w\\rVert^2$다. 잡음이 크거나 사전 믿음이 강할수록 규제가 세다."
      },
      {
        "id": "w2-loss-likelihood-c3",
        "question": "선형분리 가능한 데이터에서 규제 없는 로지스틱 회귀를 경사하강법으로 오래 학습하면?",
        "choices": [
          "가중치 크기가 끝없이(대략 로그로) 커지고 손실은 0으로 다가간다",
          "유한한 최적값에 수렴한다",
          "가중치가 0으로 줄어든다",
          "손실이 ln 2에 머문다"
        ],
        "answer": 0,
        "explanation": "모든 점을 가르는 $w$의 크기를 키울수록 손실이 계속 줄어 MLE가 존재하지 않는다. 경사하강법을 돌리면 스텝이 10배 늘 때마다 $w$가 약 2.3씩 커지고 손실은 10분의 1이 된다. L2 규제를 넣으면 유한한 해가 생긴다."
      },
      {
        "id": "w2-loss-likelihood-c4",
        "question": "모든 샘플을 상수 $c$ 하나로 예측할 때, MAE를 최소화하는 $c$는?",
        "choices": [
          "중앙값",
          "평균",
          "최댓값",
          "최빈값"
        ],
        "answer": 0,
        "explanation": "MAE의 기울기는 $c$보다 작은 샘플 수와 큰 샘플 수의 차이에 비례해, 양쪽 수가 같아지는 중앙값에서 0이 된다. MSE는 평균에서 최소다."
      },
      {
        "id": "w2-loss-likelihood-c5",
        "question": "로지스틱 회귀의 손실이 볼록(convex)이라는 사실이 주는 실용적 의미는?",
        "choices": [
          "경사하강법이 지역 최솟값에 갇히지 않고 전역 최솟값으로 간다",
          "닫힌 해가 항상 존재한다",
          "규제가 필요 없다",
          "선형분리 데이터에서도 유한한 해가 존재한다"
        ],
        "answer": 0,
        "explanation": "볼록 함수에는 지역 최솟값이 전역 최솟값뿐이다. 다만 닫힌 해는 없고, 선형분리 데이터에서는 최솟값이 무한히 먼 곳에 있어 규제가 필요하다."
      }
    ],
    "quizIds": [
      "w2-q28"
    ],
    "references": [
      {
        "title": "Bishop — Pattern Recognition and Machine Learning, 3.1·4.3절",
        "url": "https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/",
        "note": "최대가능도·MAP로 본 선형회귀와 로지스틱 회귀 (영문, 무료 PDF)"
      },
      {
        "title": "Soudry et al. (2018) — The Implicit Bias of Gradient Descent on Separable Data",
        "url": "https://arxiv.org/abs/1710.10345",
        "note": "규제 없는 로지스틱 회귀가 최대 마진 방향으로 수렴함을 증명 (영문, 연구 논문)"
      }
    ]
  },
  "bias-variance-theory": {
    "tier": "advanced",
    "goal": "제곱 오차의 편향-분산 분해를 유도하고, 상관된 예측의 평균 분산 $\\rho\\sigma^2 + (1-\\rho)\\sigma^2/B$로 랜덤 포레스트를 설명하며, 최소 노름 보간에서 이중 하강이 생기는 원인을 특이값으로 설명할 수 있다.",
    "checks": [
      {
        "id": "w2-bias-variance-theory-c1",
        "question": "편향-분산 분해의 1단계에서 교차항 $2\\,\\mathbb{E}[(f - \\hat f)\\varepsilon]$이 0이 되는 이유는?",
        "choices": [
          "새 관측의 잡음 $\\varepsilon$이 훈련 데이터로 만든 $\\hat f$와 독립이고 평균이 0이라서",
          "$\\hat f$가 항상 $f$와 같아서",
          "잡음의 분산이 0이라서",
          "제곱 오차가 대칭이라서"
        ],
        "answer": 0,
        "explanation": "독립이면 곱의 기댓값이 기댓값의 곱이 되고 $\\mathbb{E}[\\varepsilon] = 0$이라 교차항이 사라진다."
      },
      {
        "id": "w2-bias-variance-theory-c2",
        "question": "분산 1, 서로의 상관 0.5인 트리 1000개를 평균한 예측의 분산은 대략?",
        "choices": [
          "0.5",
          "0.001",
          "0.25",
          "1"
        ],
        "answer": 0,
        "explanation": "$\\rho\\sigma^2 + (1-\\rho)\\sigma^2/B = 0.5 + 0.5/1000 \\approx 0.5$. 트리를 늘려도 $\\rho\\sigma^2$ 밑으로 내려가지 않으므로, 랜덤 포레스트는 특징을 무작위로 골라 $\\rho$를 낮춘다."
      },
      {
        "id": "w2-bias-variance-theory-c3",
        "question": "최소 노름 최소제곱에서 파라미터 수 $p$가 샘플 수 $n$과 같을 때 테스트 오차가 치솟는 직접적인 원인은?",
        "choices": [
          "$X$의 최소 특이값이 0 근처로 떨어져 유사역행렬이 잡음을 크게 증폭한다",
          "파라미터가 너무 적어 편향이 커진다",
          "학습률이 너무 크다",
          "훈련 오차가 커진다"
        ],
        "answer": 0,
        "explanation": "유사역행렬은 특이값의 역수를 곱하므로 작은 특이값이 잡음을 증폭한다(분산 폭발). 한 실험에서 $p = 40 = n$일 때 최소 특이값이 약 0.09로 가장 작았고 테스트 MSE가 약 39로 치솟았다."
      },
      {
        "id": "w2-bias-variance-theory-c4",
        "question": "분산이 1이고 서로 **독립**($\\rho = 0$)인 예측 100개를 평균하면 분산은?",
        "choices": [
          "0.01",
          "0.1",
          "1",
          "0"
        ],
        "answer": 0,
        "explanation": "$\\rho\\sigma^2 + \\frac{1-\\rho}{B}\\sigma^2$에서 $\\rho = 0$이면 $\\sigma^2/B = 1/100 = 0.01$이다. 상관이 있으면 $\\rho\\sigma^2$ 밑으로는 내려가지 않는다."
      },
      {
        "id": "w2-bias-variance-theory-c5",
        "question": "편향-분산 분해에서 $\\sigma^2$(줄일 수 없는 잡음)에 대한 설명으로 옳은 것은?",
        "choices": [
          "어떤 모델로도 줄일 수 없는 오차의 바닥으로, 줄이려면 데이터(특징·레이블의 질)를 바꿔야 한다",
          "모델을 복잡하게 하면 0이 된다",
          "정규화로 줄일 수 있다",
          "훈련 데이터를 외우면 사라진다"
        ],
        "answer": 0,
        "explanation": "같은 $x$에서도 $y$가 흩어지는 정도라 모델과 무관하다. 더 좋은 특징을 측정하거나 레이블 잡음을 줄여야만 내려간다."
      }
    ],
    "quizIds": [
      "w2-q29"
    ],
    "references": [
      {
        "title": "Belkin et al. (2019) — Reconciling modern machine learning practice and the bias-variance trade-off",
        "url": "https://arxiv.org/abs/1812.11118",
        "note": "이중 하강을 처음 체계적으로 제시한 논문 (영문)"
      },
      {
        "title": "Nakkiran et al. (2019) — Deep Double Descent",
        "url": "https://arxiv.org/abs/1912.02292",
        "note": "신경망에서의 모델 크기·학습 시간에 따른 이중 하강 (영문)"
      },
      {
        "title": "ISLP 8.2절 — Bagging, Random Forests",
        "url": "https://www.statlearning.com/",
        "note": "상관된 트리의 평균과 특징 무작위 선택"
      }
    ]
  },
  "model-evaluation-stats": {
    "tier": "advanced",
    "goal": "fold 표준편차의 의미와 한계를 설명하고, 튜닝 점수의 선택 편향을 중첩 교차검증으로 바로잡으며, 반복 교차검증의 짝지은 차이에 보정된 t 검정을 적용할 수 있다.",
    "checks": [
      {
        "id": "w2-model-evaluation-stats-c1",
        "question": "순수한 잡음 데이터(참 정확도 0.5)에서 후보 7개의 C를 교차검증으로 골랐더니 최고 점수가 0.57이었다. 가장 적절한 해석은?",
        "choices": [
          "최댓값을 고르는 과정에서 생긴 선택 편향이며, 새 데이터에서는 약 0.5가 나올 것이다",
          "모델이 잡음에서 신호를 찾았다",
          "교차검증 fold가 너무 많다",
          "C를 더 크게 하면 0.6을 넘을 것이다"
        ],
        "answer": 0,
        "explanation": "잡음이 있는 점수 여러 개 중 최댓값의 기댓값은 참값보다 크다. 한 실험에서 고른 모델의 검증 점수 평균은 0.573이었지만 새 데이터 정확도는 0.496이었다."
      },
      {
        "id": "w2-model-evaluation-stats-c2",
        "question": "중첩 교차검증의 바깥 fold 점수가 추정하는 것은?",
        "choices": [
          "하이퍼파라미터 선택까지 포함한 튜닝 절차 전체로 만든 모델의 성능",
          "가장 좋은 하이퍼파라미터 하나의 성능",
          "훈련 오차",
          "안쪽 교차검증의 최고 점수"
        ],
        "answer": 0,
        "explanation": "바깥 fold마다 안쪽에서 다시 고르므로, 평가 대상은 특정 값이 아니라 고르는 절차다. fold마다 고른 값이 달라도 괜찮다."
      },
      {
        "id": "w2-model-evaluation-stats-c3",
        "question": "5-fold를 3회 반복한 교차검증의 짝지은 차이 15개에 단순 t 검정을 쓰면 안 되는 이유는?",
        "choices": [
          "훈련 데이터가 겹쳐 차이들이 서로 상관되어 분산을 과소평가하므로 유의성이 과장된다",
          "표본이 15개라 t 분포를 쓸 수 없다",
          "차이가 음수일 수 있어서",
          "정확도는 정규분포를 따르지 않아서"
        ],
        "answer": 0,
        "explanation": "Nadeau·Bengio 보정은 분산에 $(1/J + n_{test}/n_{train})$을 곱해 겹침을 반영한다. 한 실험에서 단순 $t \\approx 4.56$($p \\approx 0.0004$)이 보정 $t \\approx 2.09$($p \\approx 0.055$)로 줄었다."
      },
      {
        "id": "w2-model-evaluation-stats-c4",
        "question": "A만 맞힌 샘플 $b = 12$, B만 맞힌 샘플 $c = 4$일 때 McNemar 통계량 $\\frac{(|b - c| - 1)^2}{b + c}$는?",
        "choices": [
          "약 3.06",
          "약 4.0",
          "0.5",
          "49"
        ],
        "answer": 0,
        "explanation": "$\\frac{(8 - 1)^2}{16} = \\frac{49}{16} \\approx 3.06$이다. 5% 기준값 3.84보다 작아 이 정도로는 유의하다고 말하기 어렵다."
      },
      {
        "id": "w2-model-evaluation-stats-c5",
        "question": "McNemar 검정에서 두 모델이 **둘 다 맞힌** 샘플과 **둘 다 틀린** 샘플은 어떻게 쓰이는가?",
        "choices": [
          "쓰이지 않는다. 두 모델의 차이에 대한 정보가 없기 때문이다",
          "둘 다 맞힌 샘플만 분모에 들어간다",
          "모두 $b$에 더한다",
          "가장 중요한 정보다"
        ],
        "answer": 0,
        "explanation": "두 모델이 같은 답을 낸 샘플은 우열을 가르는 데 아무 정보가 없다. 엇갈린 샘플 $b$와 $c$만 비교한다."
      }
    ],
    "quizIds": [
      "w2-q30"
    ],
    "references": [
      {
        "title": "Nadeau & Bengio (2003) — Inference for the Generalization Error",
        "url": "https://link.springer.com/article/10.1023/A:1024068626366",
        "note": "반복 교차검증의 보정된 t 검정 (영문, 연구 논문)"
      },
      {
        "title": "Cawley & Talbot (2010) — On Over-fitting in Model Selection",
        "url": "https://jmlr.org/papers/v11/cawley10a.html",
        "note": "모델 선택 과정의 과적합과 중첩 교차검증 (영문)"
      },
      {
        "title": "scikit-learn — Nested versus non-nested cross-validation",
        "url": "https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html",
        "note": "선택 편향을 그림으로 보여 주는 공식 예제"
      }
    ]
  }
};

export default sections;
