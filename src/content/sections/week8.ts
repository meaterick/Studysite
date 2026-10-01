import type { SectionMeta } from "../types";

// Week 8 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.
// 핵심: risk-map~capstone 6단계 / 보충: llmops·privacy·bias-mitigation / 심화: fairness-impossibility·privacy-math·drift-statistics

const sections: Record<string, SectionMeta> = {
  "risk-map": {
    "tier": "core",
    "goal": "AI 위험의 일곱 영역과 사례를 연결하고, 서브그룹 불균형이 집단별 성능 격차로 이어지는 원리, 적대적 공격(FGSM)·자동화 편향·학습 데이터 암기가 왜 위험한지 설명할 수 있다.",
    "checks": [
      {
        "id": "w8-risk-map-c1",
        "question": "FGSM 공격 $x' = x + \\varepsilon \\cdot \\text{sign}(\\nabla_x J)$가 같은 크기의 무작위 잡음보다 훨씬 효과적인 이유는?",
        "choices": [
          "잡음보다 픽셀을 더 많이 바꾸기 때문에",
          "손실이 가장 가파르게 커지는 방향으로만 입력을 밀기 때문에",
          "모델의 가중치를 바꾸기 때문에",
          "이미지를 흑백으로 바꾸기 때문에"
        ],
        "answer": 1,
        "explanation": "한 실험에서 크기 0.1의 FGSM은 정확도를 약 0.78로 떨어뜨렸지만, 같은 크기의 무작위 잡음은 0.99를 유지했다."
      },
      {
        "id": "w8-risk-map-c2",
        "question": "전체 정확도가 높은 모델이 소수 집단에서 유독 틀리는 가장 근본적인 이유는?",
        "choices": [
          "모델에 나쁜 의도가 있어서",
          "평균 손실을 최소화하면 표본이 많은 집단의 손실이 우선적으로 줄어들기 때문에",
          "소수 집단 데이터가 항상 틀려서",
          "학습률이 너무 커서"
        ],
        "answer": 1,
        "explanation": "학습 목표에는 집단별 표본 수가 명시적으로 반영되지 않는다. 그래서 집단별 성능을 따로 보고해야 격차가 드러난다."
      },
      {
        "id": "w8-risk-map-c3",
        "question": "다음 중 자동화 편향(automation bias)의 예는?",
        "choices": [
          "모델이 특정 집단의 데이터를 적게 본 것",
          "검토자가 AI의 \"부적합\" 판정을 이력서를 열어보지도 않고 승인하는 것",
          "모델이 학습 문장을 외우는 것",
          "모델이 적대적 예제에 속는 것"
        ],
        "answer": 1,
        "explanation": "사람 검토 절차가 있어도 형식적이면 오류를 막지 못한다."
      }
    ],
    "quizIds": [
      "w8-q6",
      "w8-q7",
      "w8-q8",
      "w8-q9",
      "w8-q10"
    ],
    "references": [
      {
        "title": "Buolamwini & Gebru (2018) — Gender Shades",
        "url": "https://proceedings.mlr.press/v81/buolamwini18a.html",
        "note": "상용 얼굴 분석 시스템의 교차 집단별 오류율 비교"
      },
      {
        "title": "Goodfellow et al. (2014) — Explaining and Harnessing Adversarial Examples",
        "url": "https://arxiv.org/abs/1412.6572",
        "note": "FGSM과 판다·긴팔원숭이 예시의 원 논문"
      },
      {
        "title": "Carlini et al. (2021) — Extracting Training Data from Large Language Models",
        "url": "https://arxiv.org/abs/2012.07805",
        "note": "학습 데이터 암기와 추출이 실제로 가능함을 보인 연구"
      }
    ]
  },
  "fairness": {
    "tier": "core",
    "goal": "인구통계 동등성·균등화된 오즈·보정을 수식과 채용 예시로 구분하고, 기저율이 다를 때 어떤 기준끼리 충돌하는지(보정·PPV ↔ 오류율, 선택률 ↔ 오류율)를 TP·FP 계산과 임계값 실험으로 보이며, 정답 레이블 자체의 편향이라는 한계를 말할 수 있다.",
    "checks": [
      {
        "id": "w8-fairness-c1",
        "question": "\"실제 우수 인재라면 집단과 무관하게 같은 확률로 합격 추천을 받아야 한다\"는 요구는?",
        "choices": [
          "인구통계 동등성",
          "균등화된 오즈(TPR 부분)",
          "보정",
          "정확도 동등성"
        ],
        "answer": 1,
        "explanation": "균등화된 오즈는 $Y=1$일 때의 TPR과 $Y=0$일 때의 FPR을 집단 간에 같게 요구한다."
      },
      {
        "id": "w8-fairness-c2",
        "question": "A 집단: TP 40, FP 10 / B 집단: TP 16, FP 16일 때 두 집단의 정밀도(PPV)는?",
        "choices": [
          "80% / 50%",
          "50% / 32%",
          "80% / 80%",
          "20% / 20%"
        ],
        "answer": 0,
        "explanation": "PPV = TP/(TP+FP): A는 40/50 = 80%, B는 16/32 = 50%. TPR·FPR이 같아도 추천의 의미는 다르다(예측 동등성, 보정의 이진 판정 버전이 깨짐). 기저율이 다르면 PPV와 FPR·FNR을 동시에 같게 맞출 수 없다(Chouldechova, 2017)."
      },
      {
        "id": "w8-fairness-c3",
        "question": "기저율이 다른 두 집단에서 선택률을 억지로 같게 맞추면 일반적으로 일어나는 일은?",
        "choices": [
          "모든 공정성 지표가 동시에 좋아진다",
          "오류율(TPR·FPR)이나 정밀도 중 무언가가 집단 간에 벌어진다",
          "기저율이 같아진다",
          "아무 변화가 없다"
        ],
        "answer": 1,
        "explanation": "본문 예제에서 B의 FPR이 20%에서 40%로 뛰었다. 기저율을 $p$라 하면 선택률은 $\\text{TPR} \\cdot p + \\text{FPR} \\cdot (1-p)$이므로, 분류기가 무작위 수준이 아닌 한 기저율 차이는 선택률이나 오류율 어딘가에 반드시 드러난다."
      },
      {
        "id": "w8-fairness-c4",
        "question": "과거 채용 결과를 정답 $Y$로 삼아 학습한 모델이 두 성별에서 TPR·FPR이 같다(균등화된 오즈 만족). 이 모델에 대한 가장 적절한 평가는?",
        "choices": [
          "균등화된 오즈를 만족하므로 공정성이 증명되었다",
          "과거 채용 결정 자체가 편향되어 있었다면 $Y$도 편향되어 있어, 그 $Y$에 맞춘 오류율 균형은 과거의 편향을 재현할 수 있다",
          "기저율이 다르면 균등화된 오즈는 계산할 수 없다",
          "TPR이 같으면 선택률도 반드시 같다"
        ],
        "answer": 1,
        "explanation": "균등화된 오즈와 보정은 정답 $Y$가 믿을 만하다는 전제 위에 있다. 레이블 편향, 교차 집단의 격차처럼 지표가 보지 못하는 부분이 있으므로 공정성 지표는 증명서가 아니라 점검 도구다."
      }
    ],
    "quizIds": [
      "w8-q1",
      "w8-q2",
      "w8-q3"
    ],
    "references": [
      {
        "title": "Google PAIR — Attacking discrimination with smarter machine learning",
        "url": "https://research.google.com/bigpicture/attacking-discrimination-in-ml/",
        "note": "임계값을 직접 움직이며 공정성 기준 간의 충돌을 보는 인터랙티브 자료"
      },
      {
        "title": "Barocas, Hardt & Narayanan — Fairness and Machine Learning",
        "url": "https://fairmlbook.org/",
        "note": "무료 교과서: 3장 Classification이 이 단계의 세 기준을 다룬다"
      },
      {
        "title": "Kleinberg et al. (2016) — Inherent Trade-Offs in the Fair Determination of Risk Scores",
        "url": "https://arxiv.org/abs/1609.05807",
        "note": "보정과 오류율 균형의 불가능성 정리 (심화)"
      }
    ]
  },
  "governance": {
    "tier": "core",
    "goal": "NIST AI RMF의 Govern·Map·Measure·Manage, EU AI Act의 위험 기반 4등급, 모델카드의 필수 항목을 설명하고, 자신의 프로젝트에 모델카드를 작성할 수 있다.",
    "checks": [
      {
        "id": "w8-governance-c1",
        "question": "EU AI Act에서 채용 지원자를 선별하는 AI는 어느 등급에 해당하는가?",
        "choices": [
          "최소 위험",
          "제한적 위험",
          "고위험",
          "금지"
        ],
        "answer": 2,
        "explanation": "채용·신용평가·교육 평가 등 사람의 생계와 기회에 큰 영향을 주는 용도는 고위험으로, 엄격한 의무가 따른다."
      },
      {
        "id": "w8-governance-c2",
        "question": "NIST AI RMF에서 위험을 실제로 수치화하고 검증하는 기능은?",
        "choices": [
          "Govern",
          "Map",
          "Measure",
          "Manage"
        ],
        "answer": 2,
        "explanation": "Govern(원칙·책임), Map(맥락 파악), Measure(측정), Manage(대응)이며, 네 기능은 순환한다."
      },
      {
        "id": "w8-governance-c3",
        "question": "모델카드의 \"비의도 용도(out-of-scope use)\" 항목이 필요한 이유는?",
        "choices": [
          "모델의 파라미터 수를 알리려고",
          "모델을 가져다 쓰는 사람이 쓰면 안 되는 상황을 미리 알 수 있게 하려고",
          "학습 속도를 높이려고",
          "라이선스를 숨기려고"
        ],
        "answer": 1,
        "explanation": "영양성분표의 알레르기 경고처럼, 위험을 미리 알고 선택할 수 있게 한다."
      }
    ],
    "quizIds": [
      "w8-q4",
      "w8-q5"
    ],
    "references": [
      {
        "title": "NIST — AI Risk Management Framework",
        "url": "https://www.nist.gov/itl/ai-risk-management-framework",
        "note": "AI RMF 1.0 본문과 Playbook"
      },
      {
        "title": "EU AI Act 공식 법령 (EUR-Lex, Regulation (EU) 2024/1689)",
        "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
        "note": "위험 등급과 의무의 원문: 최신 적용 시기 확인용"
      },
      {
        "title": "Mitchell et al. (2019) — Model Cards for Model Reporting",
        "url": "https://arxiv.org/abs/1810.03993",
        "note": "모델카드 제안 논문: 그림 2의 예시 모델카드"
      }
    ]
  },
  "mlops": {
    "tier": "core",
    "goal": "모델 서빙(REST·FastAPI)·Docker·점진적 배포·실험 추적·세 파이프라인·CI/CD를 설명하고, 데이터 드리프트와 개념 드리프트를 구분하고, PSI가 감지할 수 있는 것(입력 분포 변화)과 없는 것(개념 드리프트, 실제 성능 저하)을 말할 수 있다.",
    "checks": [
      {
        "id": "w8-mlops-c1",
        "question": "사기 탐지 모델의 입력 분포는 그대로인데, 사기범들이 수법을 바꿔 같은 입력이 이제 다른 정답을 의미하게 됐다. 이것은?",
        "choices": [
          "데이터 드리프트",
          "개념 드리프트(concept drift)",
          "과적합",
          "카나리 배포"
        ],
        "answer": 1,
        "explanation": "$P(y \\mid x)$가 변한 것이다. 데이터 드리프트는 $P(x)$ 자체가 변한 것이다. \"모델 드리프트\"는 흔히 원인과 상관없이 배포 후 성능이 떨어지는 현상 전체를 가리키는 말로 쓰인다."
      },
      {
        "id": "w8-mlops-c2",
        "question": "새 모델을 트래픽의 5%에만 먼저 보내 지표를 확인한 뒤 점차 늘리는 배포 전략은?",
        "choices": [
          "블루-그린",
          "카나리",
          "섀도",
          "롤백"
        ],
        "answer": 1,
        "explanation": "문제가 있어도 영향받는 사용자가 적다. 결함이 있는 모델은 트래픽 5% 구간에서 발견해 롤백할 수 있다."
      },
      {
        "id": "w8-mlops-c3",
        "question": "PSI가 0.3으로 계산되었다면 관행적으로 어떻게 해석하는가?",
        "choices": [
          "분포가 거의 같다",
          "분포 변화가 커서 재학습을 검토할 신호",
          "모델 정확도가 30%",
          "라벨이 30% 틀렸다"
        ],
        "answer": 1,
        "explanation": "관행적으로 0.1 미만은 안정, 0.1~0.2는 관찰, 0.2 이상이면 원인 조사·재학습 검토 신호로 쓴다. 통계적 검정이 아닌 경험칙이고, 입력 분포가 바뀌었다는 뜻일 뿐 성능이 떨어졌다는 증거는 아니다."
      },
      {
        "id": "w8-mlops-c4",
        "question": "사기범들이 수법을 바꿔 입력 특징의 분포는 그대로인데 같은 입력의 정답이 달라졌다. 입력 특징으로 계산한 PSI와 모델 성능은 어떻게 되기 쉬운가?",
        "choices": [
          "PSI가 크게 올라 즉시 경보가 울린다",
          "PSI는 거의 0에 머물러 이 변화를 감지하지 못하고, 성능은 떨어진다. 늦게라도 라벨을 모아 성능 지표를 직접 추적해야 한다",
          "PSI와 성능 모두 변하지 않는다",
          "PSI가 음수가 된다"
        ],
        "answer": 1,
        "explanation": "PSI는 $P(x)$의 변화만 본다. 개념 드리프트($P(y \\mid x)$ 변화)는 입력만으로는 보이지 않으므로 라벨 기반 성능 모니터링이 필요하다. 반대로 PSI가 높아도 성능이 멀쩡할 수 있다."
      }
    ],
    "quizIds": [
      "w8-q11",
      "w8-q12",
      "w8-q13"
    ],
    "references": [
      {
        "title": "Google Cloud — MLOps: Continuous delivery and automation pipelines in machine learning",
        "url": "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning",
        "note": "MLOps 성숙도 단계와 파이프라인 구조 (영문)"
      },
      {
        "title": "Made With ML — MLOps 코스",
        "url": "https://madewithml.com/",
        "note": "실험 추적·테스트·서빙까지 실습 중심 무료 코스"
      },
      {
        "title": "FastAPI 공식 튜토리얼",
        "url": "https://fastapi.tiangolo.com/tutorial/",
        "note": "캡스톤에서 모델을 API로 감쌀 때"
      }
    ]
  },
  "research-methods": {
    "tier": "core",
    "goal": "검증 가능한 연구 질문을 세우고, baseline·절제 연구·다중 시드·통계적 검정으로 주장을 뒷받침하며, 한계와 인용을 갖춘 결과 보고를 설계할 수 있다.",
    "checks": [
      {
        "id": "w8-research-methods-c1",
        "question": "다음 중 가장 검증 가능한 연구 질문은?",
        "choices": [
          "AI는 편향적인가?",
          "이 채용 모델의 성별 간 FPR 차이는 5%p 이내인가?",
          "Transformer는 좋은가?",
          "AI는 인간을 대체할까?"
        ],
        "answer": 1,
        "explanation": "데이터·모델·지표·기준값이 질문 안에 들어 있어 예/아니오로 답할 수 있다."
      },
      {
        "id": "w8-research-methods-c2",
        "question": "구성요소 A·B·C로 된 방법에서 C를 뺐을 때 정확도가 가장 크게 떨어졌다. 이 실험은?",
        "choices": [
          "A/B 테스트",
          "절제 연구(ablation)",
          "카나리 배포",
          "하이퍼파라미터 탐색"
        ],
        "answer": 1,
        "explanation": "하나씩 제거해 각 구성요소의 기여를 분리한다."
      },
      {
        "id": "w8-research-methods-c3",
        "question": "두 방법의 정확도를 시드 하나로 한 번씩만 비교하면 안 되는 이유는?",
        "choices": [
          "계산이 너무 오래 걸려서",
          "무작위 초기화·데이터 분할에 따른 변동이 방법 간 차이보다 클 수 있어서",
          "시드는 결과에 영향이 없어서",
          "정확도는 비교할 수 없는 지표라서"
        ],
        "answer": 1,
        "explanation": "예를 들어 시드별 승자가 B·A·B·A·A로 뒤섞이고 순열 검정 p값도 크다면 차이를 주장할 수 없다."
      }
    ],
    "quizIds": [
      "w8-q17",
      "w8-q18",
      "w8-q19"
    ],
    "references": [
      {
        "title": "Papers with Code — Machine Learning Reproducibility Checklist",
        "url": "https://github.com/paperswithcode/releasing-research-code",
        "note": "재현 가능한 연구 코드를 공개하는 체크리스트 (캡스톤 README 참고)"
      },
      {
        "title": "Google Research — Deep Learning Tuning Playbook",
        "url": "https://github.com/google-research/tuning_playbook",
        "note": "실험을 체계적으로 설계·비교하는 실전 가이드"
      },
      {
        "title": "Karpathy — A Recipe for Training Neural Networks",
        "url": "https://karpathy.github.io/2019/04/25/recipe/",
        "note": "baseline부터 시작해 한 번에 하나씩 바꾸는 태도 (4주차 복습)"
      }
    ]
  },
  "capstone": {
    "tier": "core",
    "goal": "퍼셉트론부터 DPO까지 핵심 논문들이 각각 무엇을 처음으로 해냈는지 한 줄로 설명하고, 8주의 지식을 엮어 검증 가능한 캡스톤 계획을 세울 수 있다.",
    "checks": [
      {
        "id": "w8-capstone-c1",
        "question": "Bahdanau et al.(2014)과 Vaswani et al.(2017)의 관계로 옳은 것은?",
        "choices": [
          "Transformer가 먼저 나오고 Bahdanau가 이를 RNN에 적용했다",
          "Bahdanau가 Seq2Seq 디코더를 돕는 어텐션을 도입했고, Transformer는 순환 구조 없이 어텐션만으로 전체 모델을 구성했다",
          "둘은 무관하다",
          "둘 다 CNN 논문이다"
        ],
        "answer": 1,
        "explanation": "5주차 4~5단계의 흐름 그대로다."
      },
      {
        "id": "w8-capstone-c2",
        "question": "LoRA와 DPO가 각각 다루는 단계는?",
        "choices": [
          "둘 다 사전학습",
          "LoRA는 효율적 미세조정, DPO는 선호 정렬",
          "LoRA는 정렬, DPO는 토큰화",
          "둘 다 추론 가속"
        ],
        "answer": 1,
        "explanation": "LoRA는 저랭크 행렬만 학습해 파인튜닝 비용을 줄이고, DPO는 보상모델 없이 선호 데이터로 정책을 직접 최적화한다."
      },
      {
        "id": "w8-capstone-c3",
        "question": "이 캡스톤에서 어떤 유형을 고르든 공통으로 요구되는 것은?",
        "choices": [
          "GPU 사용",
          "\"한계와 실패 사례\" 항목",
          "논문 출판",
          "정확도 90% 이상"
        ],
        "answer": 1,
        "explanation": "잘 된 결과만 보여주는 발표는 반쪽짜리로 취급한다."
      }
    ],
    "quizIds": [
      "w8-q20",
      "w8-q21",
      "w8-q22"
    ],
    "references": [
      {
        "title": "Hugging Face Papers",
        "url": "https://huggingface.co/papers",
        "note": "매일 올라오는 주목받는 논문과 코드·모델 링크: 캡스톤 관련 연구 찾기"
      },
      {
        "title": "Stanford HAI — AI Index Report",
        "url": "https://hai.stanford.edu/ai-index",
        "note": "AI 기술·산업·정책 동향을 매년 정리한 보고서"
      }
    ]
  },
  "llmops": {
    "tier": "supplement",
    "goal": "LLM API와 로컬 LLM의 트레이드오프, 서빙 도구(Transformers·vLLM·Ollama)의 위치, 프롬프트 관리·토큰 비용·상시 평가·관측 가능성·가드레일·rate limiting을 설명하고 간단히 구현할 수 있다.",
    "checks": [
      {
        "id": "w8-llmops-c1",
        "question": "입력 단가 3달러/100만 토큰, 출력 15달러/100만 토큰일 때 입력 2,000·출력 500토큰 호출 1회의 비용은?",
        "choices": [
          "0.0135달러",
          "0.0060달러",
          "0.0075달러",
          "0.0360달러"
        ],
        "answer": 0,
        "explanation": "$2000 \\times 3/10^6 + 500 \\times 15/10^6 = 0.006 + 0.0075 = 0.0135$달러."
      },
      {
        "id": "w8-llmops-c2",
        "question": "개인 의료 기록을 다루는 서비스에서 로컬 LLM을 고려하는 가장 큰 이유는?",
        "choices": [
          "항상 더 정확해서",
          "데이터가 조직 인프라 밖으로 나가지 않아서",
          "초기 비용이 없어서",
          "설정이 필요 없어서"
        ],
        "answer": 1,
        "explanation": "API 방식은 입력이 외부 서버로 전송된다. 대신 로컬은 GPU 고정비와 운영 부담을 진다."
      },
      {
        "id": "w8-llmops-c3",
        "question": "가드레일(guardrails)에 대한 설명으로 옳은 것은?",
        "choices": [
          "모델 가중치를 안전하게 재학습한다",
          "모델의 입력·출력을 검사해 정책 위반을 걸러내는 별도의 안전 계층이다",
          "토큰 비용을 계산한다",
          "GPU 메모리를 관리한다"
        ],
        "answer": 1,
        "explanation": "입력 단에서는 인젝션 시도를, 출력 단에서는 개인정보·유해 콘텐츠를 걸러낸다."
      }
    ],
    "quizIds": [
      "w8-q14",
      "w8-q15",
      "w8-q16"
    ],
    "references": [
      {
        "title": "vLLM 문서",
        "url": "https://docs.vllm.ai/",
        "note": "PagedAttention 기반 대규모 LLM 서빙 엔진"
      },
      {
        "title": "Ollama",
        "url": "https://ollama.com/",
        "note": "개인 컴퓨터에서 오픈 LLM을 명령어 몇 줄로 실행"
      },
      {
        "title": "Chip Huyen — Building A Generative AI Platform",
        "url": "https://huyenchip.com/2024/07/25/genai-platform.html",
        "note": "가드레일·캐시·라우터·관측 가능성까지 LLM 서비스 구성요소를 한 그림으로"
      }
    ]
  },
  "privacy": {
    "tier": "supplement",
    "goal": "준식별자로 재식별 위험을 재고 k-익명성의 한계를 설명하며, 무작위 응답으로 민감한 비율을 추정하고, 차등 프라이버시의 정의와 라플라스 메커니즘의 오차·예산을 설명할 수 있다.",
    "checks": [
      {
        "id": "w8-privacy-c1",
        "question": "나이·성별·동네가 남은 데이터에서 이름만 지웠다. 가장 정확한 설명은?",
        "choices": [
          "이름이 없으니 익명 데이터다",
          "세 값의 조합이 대부분의 사람에게 유일하면 다른 공개 자료와 이어 붙여 다시 특정할 수 있다",
          "성별만 지우면 안전하다",
          "데이터가 많을수록 더 안전하다"
        ],
        "answer": 1,
        "explanation": "혼자서는 아무도 가리키지 않지만 조합하면 사람을 특정하는 값이 준식별자다. 예를 들어 세 값의 조합만으로 2,000명 중 약 60%가 유일해질 수 있다."
      },
      {
        "id": "w8-privacy-c2",
        "question": "k-익명성을 만족하는 데이터에서도 민감 정보가 드러나는 경우는?",
        "choices": [
          "k가 너무 클 때",
          "같은 조합의 k명이 모두 같은 민감 정보(예: 같은 병명)를 가질 때",
          "준식별자를 뭉뚱그렸을 때",
          "데이터를 암호화했을 때"
        ],
        "answer": 1,
        "explanation": "누구인지 몰라도 그 묶음의 병명이 하나뿐이면 병명이 드러난다(동질성 공격). 그래서 묶음 안의 민감 정보가 다양하도록 요구하는 l-다양성이 나왔다."
      },
      {
        "id": "w8-privacy-c3",
        "question": "개수 질의에 라플라스 메커니즘(잡음 척도 $1/\\varepsilon$)을 쓸 때 옳은 것은?",
        "choices": [
          "$\\varepsilon$이 클수록 보호가 강하다",
          "잡음의 평균 크기는 $1/\\varepsilon$이라 작은 집단의 개수일수록 상대 오차가 크다",
          "질의를 여러 번 해도 프라이버시 손실은 늘지 않는다",
          "공격자의 배경지식에 따라 보장이 달라진다"
        ],
        "answer": 1,
        "explanation": "$\\varepsilon$이 작을수록 잡음이 커지고 보호가 강하다. 질의를 반복하면 손실이 쌓여(합성) 예산을 정해 나눠 쓴다. 차등 프라이버시는 공격자가 무엇을 알든 성립한다."
      }
    ],
    "quizIds": [
      "w8-q23"
    ],
    "references": [
      {
        "title": "Sweeney (2000) — Simple Demographics Often Identify People Uniquely",
        "url": "https://dataprivacylab.org/projects/identifiability/paper1.pdf",
        "note": "우편번호·성별·생년월일로 미국인 약 87%가 특정된다는 추정"
      },
      {
        "title": "Dwork & Roth (2014) — The Algorithmic Foundations of Differential Privacy",
        "url": "https://www.cis.upenn.edu/~aaroth/privacybook.html",
        "note": "차등 프라이버시의 정의·라플라스 메커니즘·합성의 표준 교재(1~3장)"
      },
      {
        "title": "OpenDP — Differential Privacy 입문 자료",
        "url": "https://docs.opendp.org/",
        "note": "실제 라이브러리로 차등 프라이버시 통계를 내 보는 문서"
      }
    ]
  },
  "bias-mitigation": {
    "tier": "supplement",
    "goal": "대리 변수 때문에 보호 속성을 빼는 것만으로는 편향이 사라지지 않음을 보이고, 재가중(전처리)·공정성 벌점(학습 중)·집단별 임계값(후처리)을 적용해 격차와 정확도의 트레이드오프, 법적 제약, 편향된 라벨로 잰 정확도의 의미를 설명할 수 있다.",
    "checks": [
      {
        "id": "w8-bias-mitigation-c1",
        "question": "채용 모델에서 성별 열을 지웠는데도 성별 간 선택률 격차가 남았다. 가장 그럴듯한 원인은?",
        "choices": [
          "학습률이 너무 컸다",
          "성별과 상관된 대리 변수(동네·출신 학교·취미 등)로 모델이 집단을 다시 알아냈다",
          "테스트 데이터가 너무 많았다",
          "성별 열을 지우면 항상 격차가 커진다"
        ],
        "answer": 1,
        "explanation": "보호 속성을 빼는 것(fairness through unawareness)은 대리 변수가 있으면 통하지 않는다. 예를 들어 집단 변수를 빼도 동네 변수 때문에 격차가 +0.25로 남을 수 있다."
      },
      {
        "id": "w8-bias-mitigation-c2",
        "question": "재가중(Kamiran & Calders)에서 집단 $g$, 정답 $y$인 표본의 가중치는?",
        "choices": [
          "$P(G=g)$",
          "$P(G=g)\\,P(Y=y) / P(G=g, Y=y)$",
          "$1 / P(Y=y)$",
          "모든 표본에 1"
        ],
        "answer": 1,
        "explanation": "가중치를 적용하면 집단과 정답이 독립이 되어 두 집단의 (가중) 합격 비율이 같아진다."
      },
      {
        "id": "w8-bias-mitigation-c3",
        "question": "집단별 임계값(후처리)의 특징으로 옳지 않은 것은?",
        "choices": [
          "다시 학습하지 않아도 된다",
          "판정하는 순간 보호 속성이 필요하다",
          "어떤 법적 맥락에서도 문제가 되지 않는다",
          "선택률이나 TPR 같은 기준을 정확히 맞출 수 있다"
        ],
        "answer": 2,
        "explanation": "미국 고용 분야처럼 인종에 따라 점수나 합격선을 조정하는 것을 금지하는 법(1991년 민권법의 race-norming 금지)이 있다. 완화 방법의 선택은 법과 윤리의 문제이기도 하다."
      }
    ],
    "quizIds": [
      "w8-q24"
    ],
    "references": [
      {
        "title": "Kamiran & Calders (2012) — Data preprocessing techniques for classification without discrimination",
        "url": "https://link.springer.com/article/10.1007/s10115-011-0463-8",
        "note": "재가중·재표집 등 전처리 완화의 원 논문"
      },
      {
        "title": "Hardt, Price & Srebro (2016) — Equality of Opportunity in Supervised Learning",
        "url": "https://arxiv.org/abs/1610.02413",
        "note": "후처리 임계값으로 균등화된 오즈·기회의 균등을 맞추는 방법"
      },
      {
        "title": "Fairlearn 사용자 가이드",
        "url": "https://fairlearn.org/main/user_guide/index.html",
        "note": "공정성 측정과 완화 기법(제약 학습·임계값 최적화)을 구현한 라이브러리"
      }
    ]
  },
  "fairness-impossibility": {
    "tier": "advanced",
    "goal": "Chouldechova 항등식으로 PPV·FNR을 맞추면 기저율이 다른 집단의 FPR이 달라짐을, 보정 아래의 등식 $p(1-x) = (1-p)z$로 보정과 균형이 완벽한 예측에서만 함께 성립함을 증명하고, 무작위 혼합으로 균등화된 오즈를 맞추는 확률과 그 정확도 비용을 계산할 수 있다.",
    "checks": [
      {
        "id": "w8-fairness-impossibility-c1",
        "question": "기저율이 0.5와 0.2인 두 집단에서 PPV를 0.8, FNR을 0.2로 같게 맞췄다. 기저율 0.2인 집단의 FPR은?",
        "choices": [
          "$0.2$",
          "$0.05$",
          "$0.8$",
          "알 수 없다"
        ],
        "answer": 1,
        "explanation": "$\\text{FPR} = \\frac{0.2}{0.8} \\cdot \\frac{0.2}{0.8} \\cdot 0.8 = 0.05$. 기저율 0.5인 집단은 0.2이므로 FPR이 반드시 달라진다."
      },
      {
        "id": "w8-fairness-impossibility-c2",
        "question": "보정된 점수에서 성립하는 등식 $p(1-x) = (1-p)z$로부터 얻는 결론은? ($x$, $z$는 양성·음성의 평균 점수)",
        "choices": [
          "기저율이 달라도 $x$, $z$를 항상 같게 맞출 수 있다",
          "기저율이 다른 두 집단에서 $x$, $z$가 모두 같으려면 $x = 1$, $z = 0$, 즉 완벽한 예측이어야 한다",
          "보정은 언제나 불가능하다",
          "기저율이 같으면 보정이 깨진다"
        ],
        "answer": 1,
        "explanation": "$z = \\frac{p}{1-p}(1-x)$이므로 $p$가 다르면서 $x$, $z$가 같으려면 $1-x = 0$이어야 한다."
      },
      {
        "id": "w8-fairness-impossibility-c3",
        "question": "FPR $f$에서 TPR이 $t_\\text{hi}$인 집단을 $t_\\text{lo}$로 낮추기 위해 '자기 규칙(확률 $\\lambda$)'과 '확률 $f$로 무작위 합격'을 섞는다. $\\lambda$는?",
        "choices": [
          "$t_\\text{lo} / t_\\text{hi}$",
          "$(t_\\text{lo} - f)/(t_\\text{hi} - f)$",
          "$f / t_\\text{hi}$",
          "$1 - f$"
        ],
        "answer": 1,
        "explanation": "섞은 규칙의 TPR은 $\\lambda t_\\text{hi} + (1-\\lambda) f$이고 FPR은 $f$ 그대로다. 이것을 $t_\\text{lo}$와 같게 놓고 풀면 된다."
      }
    ],
    "quizIds": [
      "w8-q25"
    ],
    "references": [
      {
        "title": "Chouldechova (2017) — Fair prediction with disparate impact",
        "url": "https://arxiv.org/abs/1703.00056",
        "note": "PPV·FPR·FNR 사이의 항등식과 재범 예측 사례"
      },
      {
        "title": "Kleinberg, Mullainathan & Raghavan (2016) — Inherent Trade-Offs in the Fair Determination of Risk Scores",
        "url": "https://arxiv.org/abs/1609.05807",
        "note": "보정과 양·음성 균형이 함께 성립하는 조건의 증명"
      },
      {
        "title": "Hardt, Price & Srebro (2016) — Equality of Opportunity in Supervised Learning",
        "url": "https://arxiv.org/abs/1610.02413",
        "note": "ROC 위의 무작위 혼합으로 균등화된 오즈를 맞추는 후처리"
      }
    ]
  },
  "privacy-math": {
    "tier": "advanced",
    "goal": "삼각부등식으로 라플라스 메커니즘의 $\\varepsilon$ 보장을 증명하고, 후처리 불변성과 합성을 설명하며, 가설 검정 관점에서 멤버십 추론 이득의 상한 $(e^\\varepsilon - 1)/(e^\\varepsilon + 1)$을 유도하고, DP-SGD의 표본별 자르기·잡음이 보장과 비용(큰 배치, 소수 집단)에 미치는 영향을 설명할 수 있다.",
    "checks": [
      {
        "id": "w8-privacy-math-c1",
        "question": "$\\varepsilon = 1$인 차등 프라이버시 학습에서 멤버십 추론 공격 이득(TPR − FPR)의 최댓값은?",
        "choices": [
          "약 $0.05$",
          "약 $0.46$",
          "약 $0.999$",
          "항상 $0$"
        ],
        "answer": 1,
        "explanation": "$(e^1 - 1)/(e^1 + 1) \\approx 0.462$. $\\varepsilon = 0.1$이면 0.05, $\\varepsilon = 8$이면 0.999로 사실상 보장이 없다."
      },
      {
        "id": "w8-privacy-math-c2",
        "question": "차등 프라이버시를 지키는 통계로 그래프를 그리고 모델을 학습해 공개했다. 공개물 전체의 보장은?",
        "choices": [
          "보장이 사라진다",
          "후처리 불변성 때문에 원래의 $\\varepsilon$이 그대로 유지된다",
          "보장이 두 배로 강해진다",
          "그래프는 보장되지만 모델은 아니다"
        ],
        "answer": 1,
        "explanation": "원 데이터에 다시 접근하지 않는 한, 차등 프라이버시 결과를 어떻게 가공해도 보장은 약해지지 않는다. 원 데이터로 새 분석을 더 하면 합성으로 예산이 늘어난다."
      },
      {
        "id": "w8-privacy-math-c3",
        "question": "DP-SGD에서 표본별 기울기를 길이 $C$로 자르는 이유는?",
        "choices": [
          "학습을 빠르게 하려고",
          "한 사람이 기울기 합을 바꿀 수 있는 크기(민감도)를 $C$ 이하로 묶어, 그에 맞춘 잡음으로 보장을 얻기 위해",
          "기울기 소실을 막으려고",
          "배치 크기를 줄이려고"
        ],
        "answer": 1,
        "explanation": "민감도가 묶여야 표준편차 $\\sigma C$의 잡음으로 보장을 계산할 수 있다. 예를 들어 자르기 전 최대 길이 5.92가 $C = 1$로 자르면 1.00으로 묶인다."
      }
    ],
    "quizIds": [
      "w8-q26"
    ],
    "references": [
      {
        "title": "Abadi et al. (2016) — Deep Learning with Differential Privacy",
        "url": "https://arxiv.org/abs/1607.00133",
        "note": "DP-SGD와 모멘트 회계"
      },
      {
        "title": "Shokri et al. (2017) — Membership Inference Attacks against Machine Learning Models",
        "url": "https://arxiv.org/abs/1610.05820",
        "note": "멤버십 추론 공격의 원 논문"
      },
      {
        "title": "Yeom et al. (2018) — Privacy Risk in Machine Learning: Analyzing the Connection to Overfitting",
        "url": "https://arxiv.org/abs/1709.01604",
        "note": "과적합과 멤버십 추론, 차등 프라이버시 상한의 관계"
      },
      {
        "title": "Bagdasaryan et al. (2019) — Differential Privacy Has Disparate Impact on Model Accuracy",
        "url": "https://arxiv.org/abs/1905.12101",
        "note": "DP 학습이 소수 집단의 정확도를 더 떨어뜨리는 현상"
      }
    ]
  },
  "drift-statistics": {
    "tier": "advanced",
    "goal": "PSI가 양방향 KL 발산의 합임을 증명하고, 드리프트가 없을 때의 기댓값 $(B-1)(1/n + 1/m)$으로 작은 표본의 거짓 경보를 설명하며, 다중 검사의 경보 확률을 보정하고, BBSE로 라벨 없이 라벨 드리프트를 추정할 수 있다.",
    "checks": [
      {
        "id": "w8-drift-statistics-c1",
        "question": "PSI $= \\sum_i (p_i - q_i)\\ln(p_i/q_i)$와 같은 것은?",
        "choices": [
          "$\\text{KL}(p \\Vert q)$",
          "$\\text{KL}(p \\Vert q) + \\text{KL}(q \\Vert p)$",
          "$\\text{KL}(q \\Vert p)$",
          "교차 엔트로피"
        ],
        "answer": 1,
        "explanation": "$(p - q)\\ln(p/q) = p\\ln(p/q) + q\\ln(q/p)$이므로 두 방향 KL의 합(제프리스 발산)이다."
      },
      {
        "id": "w8-drift-statistics-c2",
        "question": "구간 10개, 학습 표본 1만 개로 PSI를 잰다. 드리프트가 전혀 없을 때 운영 표본이 100명이면 PSI는 대략 얼마인가?",
        "choices": [
          "정확히 0",
          "약 0.09",
          "약 0.5",
          "약 1.0"
        ],
        "answer": 1,
        "explanation": "$(B-1)(1/n + 1/m) = 9 \\times (0.0001 + 0.01) \\approx 0.09$. 시뮬레이션하면 42%의 경우 0.1을 넘어 거짓 경보가 울린다."
      },
      {
        "id": "w8-drift-statistics-c3",
        "question": "BBSE로 라벨 드리프트를 추정할 때 꼭 필요한 가정은?",
        "choices": [
          "입력 분포 $P(x)$가 그대로다",
          "각 클래스 안의 모습 $P(x \\mid y)$가 그대로다",
          "운영 데이터의 라벨을 모두 안다",
          "분류기가 완벽하다"
        ],
        "answer": 1,
        "explanation": "$P(x \\mid y)$가 그대로여야 검증 데이터의 혼동 행렬이 운영에서도 유효해 $\\mu = Cw$가 성립한다. 분류기는 혼동 행렬이 가역이기만 하면 된다."
      }
    ],
    "quizIds": [
      "w8-q27"
    ],
    "references": [
      {
        "title": "Lipton, Wang & Smola (2018) — Detecting and Correcting for Label Shift with Black Box Predictors",
        "url": "https://arxiv.org/abs/1802.03916",
        "note": "BBSE의 원 논문"
      },
      {
        "title": "Rabanser, Günnemann & Lipton (2019) — Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift",
        "url": "https://arxiv.org/abs/1810.11953",
        "note": "차원 축소·두 표본 검정·다중 검사 보정을 비교한 드리프트 감지 실증 연구"
      },
      {
        "title": "Benjamini & Hochberg (1995) — Controlling the False Discovery Rate",
        "url": "https://www.jstor.org/stable/2346101",
        "note": "다중 검사에서 거짓 발견 비율을 통제하는 방법"
      }
    ]
  },
};

export default sections;
