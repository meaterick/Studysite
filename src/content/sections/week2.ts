import type { SectionMeta } from "../types";

// Week 2 섹션별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "data-cleaning": {
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
        "explanation": "평균은 이상치에 끌려가지만 중앙값은 거의 영향을 받지 않는다. 실습에서 평균 대체값은 약 1022, 중앙값 대체값은 235였다."
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
    "goal": "명목형·순서형 변수에 맞는 인코딩을 고르고, Min-Max와 Z-score 스케일링을 계산하며 \"훈련 데이터로만 fit\" 원칙을 지킬 수 있다.",
    "checks": [
      {
        "id": "w2-features-c1",
        "question": "'도시(서울/부산/대구)' 변수에 알맞은 인코딩은?",
        "choices": [
          "Label Encoding — 서울=0, 부산=1, 대구=2",
          "One-hot Encoding — 도시마다 0/1 열 하나씩",
          "Min-Max 정규화",
          "인코딩 없이 문자열 그대로"
        ],
        "answer": 1,
        "explanation": "순서가 없는 명목형 변수에 정수를 붙이면 모델이 \"대구가 서울의 2배\" 같은 없는 크기 관계를 배울 수 있다."
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
        "note": "3장 선형회귀, 4장 분류 — 무료 PDF와 Python 실습"
      }
    ]
  },
  "knn-naive-bayes": {
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
  "trees-ensembles": {
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
  "svm-unsupervised": {
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
  "bias-variance": {
    "goal": "훈련·검증 오차로 과적합과 과소적합을 진단하고, 편향의 제곱과 분산을 숫자로 분해하며 L1·L2 정규화로 복잡도를 조절할 수 있다.",
    "checks": [
      {
        "id": "w2-bias-variance-c1",
        "question": "훈련 오차 0.01, 검증 오차 0.30인 모델의 진단과 알맞은 처방은?",
        "choices": [
          "과소적합 — 더 복잡한 모델",
          "과적합 — 정규화 강화나 데이터 추가",
          "정상 — 그대로 사용",
          "누수 — 테스트셋으로 다시 학습"
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
        "note": "AWS의 인터랙티브 설명 — 복잡도 슬라이더로 직접 확인"
      },
      {
        "title": "ISLP 6장 — Linear Model Selection and Regularization",
        "url": "https://www.statlearning.com/",
        "note": "Ridge·Lasso와 계수 경로"
      }
    ]
  },
  "validation-leakage": {
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
        "explanation": "$R^2 = 1 - \\text{MSE}_{\\text{model}}/\\text{MSE}_{\\text{baseline}}$이므로 0이면 베이스라인보다 나을 게 없고, 음수면 오히려 더 나쁘다."
      },
      {
        "id": "w2-regression-metrics-baseline-c3",
        "question": "모델 A의 F1이 $0.976 \\pm 0.010$, 모델 B가 $0.970 \\pm 0.015$(5-Fold)다. 가장 적절한 결론은?",
        "choices": [
          "A가 B보다 확실히 낫다",
          "차이가 표준편차보다 작아 이 실험만으로는 우열을 단정하기 어렵다",
          "B가 더 낫다",
          "둘 다 베이스라인보다 못하다"
        ],
        "answer": 1,
        "explanation": "평균 차이 0.006이 fold 간 흔들림보다 작다. 이럴 때는 다른 근거(해석 가능성, 속도, 오류 유형)도 함께 본다."
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
};

export default sections;
