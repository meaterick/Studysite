import type { SectionMeta } from "../types";

// Week 8 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "risk-map": {
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
        "explanation": "실습에서 크기 0.1의 FGSM은 정확도를 약 0.78로, 같은 크기의 무작위 잡음은 0.99로 유지했다."
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
    "goal": "인구통계 동등성·균등화된 오즈·보정을 수식과 채용 예시로 구분하고, 기저율이 다를 때 이들이 동시에 성립할 수 없음을 TP·FP 계산과 임계값 실험으로 보일 수 있다.",
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
        "explanation": "PPV = TP/(TP+FP): A는 40/50 = 80%, B는 16/32 = 50%. TPR·FPR이 같아도 추천의 의미(보정)는 다르다."
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
        "explanation": "본문 예제에서 B의 FPR이 20%에서 40%로 뛰었다. 차액은 어딘가의 오류율로 흘러간다."
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
        "note": "무료 교과서 — 3장 Classification이 이 단계의 세 기준을 다룬다"
      },
      {
        "title": "Kleinberg et al. (2016) — Inherent Trade-Offs in the Fair Determination of Risk Scores",
        "url": "https://arxiv.org/abs/1609.05807",
        "note": "보정과 오류율 균형의 불가능성 정리 (심화)"
      }
    ]
  },
  "governance": {
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
        "explanation": "Govern(원칙·책임), Map(맥락 파악), Measure(측정), Manage(대응) — 네 기능은 순환한다."
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
        "note": "위험 등급과 의무의 원문 — 최신 적용 시기 확인용"
      },
      {
        "title": "Mitchell et al. (2019) — Model Cards for Model Reporting",
        "url": "https://arxiv.org/abs/1810.03993",
        "note": "모델카드 제안 논문 — 그림 2의 예시 모델카드"
      }
    ]
  },
  "mlops": {
    "goal": "모델 서빙(REST·FastAPI)·Docker·점진적 배포·실험 추적·세 파이프라인·CI/CD를 설명하고, 데이터 드리프트와 모델 드리프트를 구분해 PSI로 드리프트를 감지할 수 있다.",
    "checks": [
      {
        "id": "w8-mlops-c1",
        "question": "사기 탐지 모델의 입력 분포는 그대로인데, 사기범들이 수법을 바꿔 같은 입력이 이제 다른 정답을 의미하게 됐다. 이것은?",
        "choices": [
          "데이터 드리프트",
          "모델(개념) 드리프트",
          "과적합",
          "카나리 배포"
        ],
        "answer": 1,
        "explanation": "$P(y \\mid x)$가 변한 것이다. 데이터 드리프트는 $P(x)$ 자체가 변한 것이다."
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
        "explanation": "문제가 있어도 영향받는 사용자가 적다. 실습에서 결함 모델은 5% 구간에서 롤백되었다."
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
        "explanation": "관행적으로 0.1 미만은 안정, 0.1~0.2는 관찰, 0.2 이상이면 재학습 검토 신호로 쓴다."
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
  "llmops": {
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
  "research-methods": {
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
        "explanation": "실습에서 시드별 승자가 B·A·B·A·A로 뒤섞였고 순열 검정 p값도 컸다."
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
        "note": "매일 올라오는 주목받는 논문과 코드·모델 링크 — 캡스톤 관련 연구 찾기"
      },
      {
        "title": "Stanford HAI — AI Index Report",
        "url": "https://hai.stanford.edu/ai-index",
        "note": "AI 기술·산업·정책 동향을 매년 정리한 보고서"
      }
    ]
  },
};

export default sections;
