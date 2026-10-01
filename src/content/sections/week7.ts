import type { SectionMeta } from "../types";

// Week 7 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.
// 핵심: prompting~evaluation 7단계 / 보충: vector-search·tool-use·multimodal / 심화: contrastive-learning·eval-statistics·injection-defense

const sections: Record<string, SectionMeta> = {
  "prompting": {
    "tier": "core",
    "goal": "역할·출력 형식·Few-shot·CoT·불확실성 허용·구분자 원칙으로 프롬프트를 명세서처럼 설계하고, CoT·Self-Consistency·Structured Output의 원리와 탈옥·프롬프트 인젝션의 차이를 설명할 수 있다.",
    "checks": [
      {
        "id": "w7-prompting-c1",
        "question": "CoT(\"단계별로 생각하라\")가 다단계 문제의 정답률을 올리는 가장 정확한 이유는?",
        "choices": [
          "모델이 더 많은 파라미터를 사용하게 되어서",
          "먼저 생성한 중간 단계가 컨텍스트에 남아, 다음 토큰 예측이 그 단계에 조건화되기 때문에",
          "temperature가 자동으로 0이 되어서",
          "모델이 인터넷을 검색하게 되어서"
        ],
        "answer": 1,
        "explanation": "자기회귀 생성에서 어려운 문제 하나가 이전 단계 덕분에 쉬워진 여러 하위 문제로 쪼개진다."
      },
      {
        "id": "w7-prompting-c2",
        "question": "Self-Consistency가 오히려 오답으로 수렴할 수 있는 상황은?",
        "choices": [
          "샘플 수가 많을 때",
          "여러 추론 경로가 같은 실수로 같은 오답에 몰릴 때",
          "temperature가 0보다 클 때",
          "정답이 숫자일 때"
        ],
        "answer": 1,
        "explanation": "다수결은 오답이 흩어진다는 전제에서만 효과가 있다. 예를 들어 같은 오답이 약 48%로 몰려 있으면 샘플을 늘릴수록 오답이 이긴다."
      },
      {
        "id": "w7-prompting-c3",
        "question": "검색된 웹 문서 속 \"이전 지시를 무시하라\"가 모델의 지시를 덮어쓰는 공격은?",
        "choices": [
          "탈옥(Jailbreak)",
          "(간접) 프롬프트 인젝션",
          "보상 해킹",
          "과적합"
        ],
        "answer": 1,
        "explanation": "탈옥은 사용자가 정상 채널로 안전 정책을 우회하려는 것이고, 인젝션은 데이터인 척 들어온 내용이 지시 행세를 하는 것이다."
      }
    ],
    "quizIds": [
      "w7-q10",
      "w7-q11",
      "w7-q12",
      "w7-q13",
      "w7-q14"
    ],
    "references": [
      {
        "title": "Anthropic — Prompt engineering overview",
        "url": "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
        "note": "명확한 지시·예시·XML 태그 구분자·CoT 등 공식 가이드"
      },
      {
        "title": "OpenAI — Prompt engineering guide",
        "url": "https://platform.openai.com/docs/guides/prompt-engineering",
        "note": "같은 원칙을 다른 회사의 관점으로"
      },
      {
        "title": "Wei et al. (2022) — Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
        "url": "https://arxiv.org/abs/2201.11903",
        "note": "그림 1의 예시가 CoT의 전부를 보여준다"
      }
    ]
  },
  "retrieval": {
    "tier": "core",
    "goal": "임베딩 기반 Dense 검색과 BM25 Sparse 검색의 매칭 기준·강약점을 비교하고, 전수 비교가 대규모에서 막히는 이유와 ANN·벡터 DB의 역할, RRF가 점수 대신 순위로 두 검색기를 합치는 원리를 설명할 수 있다.",
    "checks": [
      {
        "id": "w7-retrieval-c1",
        "question": "질의 \"XK-2030 수리\"처럼 정확한 제품 코드가 핵심인 검색에 더 유리한 것은?",
        "choices": [
          "Dense 검색(임베딩)",
          "Sparse 검색(BM25)",
          "둘 다 전혀 못 찾는다",
          "재순위화만 쓰면 된다"
        ],
        "answer": 1,
        "explanation": "BM25는 정확히 같은 토큰을, 그리고 희귀한 토큰일수록 크게 반영한다. 임베딩은 낯선 고유명사·코드에 약하다."
      },
      {
        "id": "w7-retrieval-c2",
        "question": "벡터 $n$개(차원 $d$)에서 정확한 최근접 이웃을 찾는 비용과 ANN의 전략으로 옳은 것은?",
        "choices": [
          "$O(1)$, 모든 벡터를 비교한다",
          "$O(nd)$, 정확도를 조금 내주고 탐색 범위를 줄인다",
          "$O(d)$, 정확도를 100% 보장한다",
          "$O(n^2)$, 모든 쌍을 미리 저장한다"
        ],
        "answer": 1,
        "explanation": "HNSW는 층을 내려가며, IVF는 가까운 클러스터만 탐색해 범위를 좁힌다."
      },
      {
        "id": "w7-retrieval-c4",
        "question": "BM25 점수와 코사인 유사도를 합칠 때 RRF(Reciprocal Rank Fusion)가 점수 대신 순위를 쓰는 이유는?",
        "choices": [
          "순위가 점수보다 계산이 빨라서",
          "BM25 점수(0~수십)와 코사인 유사도(−1~1)처럼 척도가 다른 점수는 그대로 더할 수 없지만, 순위는 어느 검색기에서나 같은 척도라서",
          "순위를 쓰면 검색 결과가 항상 정답이 되어서",
          "임베딩 모델이 순위만 출력해서"
        ],
        "answer": 1,
        "explanation": "RRF는 각 검색기에서의 순위로 $1/(k + \\text{rank})$를 더한다. 두 검색기 모두에서 상위에 오른 문서가 가장 높은 점수를 받고, 한쪽에서만 찾은 문서도 버려지지 않는다."
      }
    ],
    "quizIds": [
      "w7-q15",
      "w7-q16"
    ],
    "references": [
      {
        "title": "Reimers & Gurevych (2019) — Sentence-BERT",
        "url": "https://arxiv.org/abs/1908.10084",
        "note": "문장 하나를 벡터 하나로 바꿔 코사인 유사도로 비교하는 문장 임베딩의 출발점"
      },
      {
        "title": "Robertson & Zaragoza (2009) — The Probabilistic Relevance Framework: BM25 and Beyond",
        "url": "https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf",
        "note": "BM25 공식의 유래 (심화)"
      }
    ]
  },
  "rag-pipeline": {
    "tier": "core",
    "goal": "색인(청킹·벡터화)과 질의(검색·프롬프트 조립·생성) 단계로 RAG를 구현하고, 청크 크기·overlap의 트레이드오프와 검색 실패·생성 실패를 구분해 진단할 수 있다.",
    "checks": [
      {
        "id": "w7-rag-pipeline-c1",
        "question": "RAG가 모델 재학습 없이 해결할 수 있는 것은?",
        "choices": [
          "모델의 문법 실력",
          "학습 마감 이후의 최신 정보나 비공개 내부 문서에 근거한 답변",
          "모델의 추론 속도",
          "토크나이저의 한국어 효율"
        ],
        "answer": 1,
        "explanation": "질의마다 외부 저장소에서 관련 조각을 찾아 컨텍스트에 넣는다. 다만 검색·생성 어느 쪽이든 실패할 수 있어 환각을 완전히 없애지는 못한다."
      },
      {
        "id": "w7-rag-pipeline-c2",
        "question": "청크를 자를 때 overlap을 두는 이유는?",
        "choices": [
          "색인 크기를 줄이려고",
          "경계에 걸친 문장이 적어도 한 조각에는 온전히 남도록",
          "검색 속도를 높이려고",
          "임베딩 차원을 줄이려고"
        ],
        "answer": 1,
        "explanation": "겹침이 없으면 조각 경계가 문장 한가운데를 가를 때 그 정보가 어느 조각에도 완전한 형태로 남지 않는다."
      },
      {
        "id": "w7-rag-pipeline-c3",
        "question": "RAG가 이상하게 답할 때 가장 먼저 확인할 것은?",
        "choices": [
          "생성 모델의 temperature",
          "정답이 들어있는 조각이 Top-k 검색 결과에 들어왔는지(검색 단계)",
          "GPU 메모리",
          "프롬프트의 말투"
        ],
        "answer": 1,
        "explanation": "정답 조각이 검색되지 않았다면 생성 모델은 맞힐 방법이 없다. 검색이 맞았는데 틀렸을 때 비로소 생성을 의심한다."
      }
    ],
    "quizIds": [
      "w7-q1",
      "w7-q2",
      "w7-q3"
    ],
    "references": [
      {
        "title": "Lewis et al. (2020) — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        "url": "https://arxiv.org/abs/2005.11401",
        "note": "RAG라는 이름을 붙인 논문: 그림 1"
      },
      {
        "title": "Liu et al. (2023) — Lost in the Middle: How Language Models Use Long Contexts",
        "url": "https://arxiv.org/abs/2307.03172",
        "note": "긴 컨텍스트의 가운데 정보를 놓치는 현상: 청크 크기·배치 설계의 근거"
      }
    ]
  },
  "retrieval-metrics": {
    "tier": "core",
    "goal": "Recall@k와 MRR을 정의대로 계산하고, 두 지표가 각각 무엇(도달 여부 vs 순위의 질)을 재는지, 검색이 맞았는데도 답이 틀릴 때 무엇을 의심할지 설명할 수 있다.",
    "checks": [
      {
        "id": "w7-retrieval-metrics-c1",
        "question": "질문 4개의 정답 순위가 [1, 2, 4, 없음]일 때 MRR은?",
        "choices": [
          "$0.4375$",
          "$0.583$",
          "$0.75$",
          "$1.75$"
        ],
        "answer": 0,
        "explanation": "$(1 + 1/2 + 1/4 + 0)/4 = 1.75/4 = 0.4375$."
      },
      {
        "id": "w7-retrieval-metrics-c2",
        "question": "정답 순위가 5등에서 2등으로 올라왔을 때 Recall@5와 MRR의 변화는?",
        "choices": [
          "둘 다 오른다",
          "Recall@5는 그대로, MRR은 오른다",
          "Recall@5만 오른다",
          "둘 다 그대로다"
        ],
        "answer": 1,
        "explanation": "Recall@k는 k 안에 들었는지만 본다. 순위 개선은 MRR이 잡아낸다."
      },
      {
        "id": "w7-retrieval-metrics-c3",
        "question": "Recall@k가 높은데도 최종 답이 틀린다면 다음으로 의심할 곳은?",
        "choices": [
          "청크 크기",
          "생성 단계: 프롬프트 구성·조각 순서·모델이 근거를 무시하거나 오독했는지",
          "임베딩 모델",
          "골든셋의 크기"
        ],
        "answer": 1,
        "explanation": "검색은 정답 조각을 가져왔으니 문제는 그 뒤에 있다."
      }
    ],
    "quizIds": [
      "w7-q4",
      "w7-q5",
      "w7-q6"
    ],
    "references": [
      {
        "title": "Weaviate — Evaluation Metrics for Search and Recommendation Systems",
        "url": "https://weaviate.io/blog/retrieval-evaluation-metrics",
        "note": "Recall·MRR·nDCG를 예제로 비교 (영문)"
      },
      {
        "title": "Es et al. (2023) — RAGAS: Automated Evaluation of Retrieval Augmented Generation",
        "url": "https://arxiv.org/abs/2309.15217",
        "note": "검색·생성을 나눠 평가하는 지표 모음 (과제 3번 심화)"
      }
    ]
  },
  "agent-loop": {
    "tier": "core",
    "goal": "ReAct의 관찰→추론→행동 루프를 코드로 구현하고, 종료 판단 실패·도구 오선택·출력 형식 오류 같은 실패 유형과 max_steps·오류 관찰 되돌리기·Reflection의 역할을 설명할 수 있다.",
    "checks": [
      {
        "id": "w7-agent-loop-c1",
        "question": "에이전트 루프에 `max_steps` 상한을 두는 가장 직접적인 이유는?",
        "choices": [
          "정확도를 높이려고",
          "모델이 종료를 선택하지 못할 때 무한 루프와 비용 폭주를 막으려고",
          "도구를 더 많이 쓰려고",
          "JSON 파싱을 빠르게 하려고"
        ],
        "answer": 1,
        "explanation": "같은 도구 호출만 반복하는 모델이라도 정해진 스텝에서 멈춘다."
      },
      {
        "id": "w7-agent-loop-c2",
        "question": "모델이 JSON 대신 자연어로 답했을 때 실전 루프가 하는 일로 가장 적절한 것은?",
        "choices": [
          "프로그램을 즉시 종료한다",
          "오류 메시지를 관찰로 기록해 다음 호출에서 모델이 고칠 기회를 준다",
          "응답을 무시하고 같은 프롬프트를 무한 반복한다",
          "임의의 도구를 호출한다"
        ],
        "answer": 1,
        "explanation": "오류를 관찰로 되돌려 주면 모델이 스스로 형식을 바로잡을 수 있다."
      },
      {
        "id": "w7-agent-loop-c3",
        "question": "ReAct와 Reflection의 관계로 옳은 것은?",
        "choices": [
          "같은 것이다",
          "ReAct는 다음 행동을 정하는 루프, Reflection은 방금 한 행동·결과를 평가하는 루프다",
          "Reflection은 도구를 호출하는 방법이다",
          "ReAct는 학습 방법이다"
        ],
        "answer": 1,
        "explanation": "Reflection은 ReAct 루프 위에 얹는 자기 평가 단계다."
      }
    ],
    "quizIds": [
      "w7-q9",
      "w7-q22"
    ],
    "references": [
      {
        "title": "Yao et al. (2022) — ReAct: Synergizing Reasoning and Acting in Language Models",
        "url": "https://arxiv.org/abs/2210.03629",
        "note": "그림 1의 Thought/Action/Observation 흐름"
      },
      {
        "title": "Anthropic — Building effective agents",
        "url": "https://www.anthropic.com/engineering/building-effective-agents",
        "note": "워크플로와 에이전트의 차이, 단순한 패턴부터 시작하라는 실전 조언"
      }
    ]
  },
  "agent-design": {
    "tier": "core",
    "goal": "단기 기억(이력 자르기)과 장기 기억(검색해 불러오기), 플래너/실행자 멀티에이전트, MCP의 역할을 설명하고, 간접 프롬프트 인젝션에 대해 데이터/지시 분리·최소 권한·Human-in-the-loop를 겹겹이 적용할 수 있다.",
    "checks": [
      {
        "id": "w7-agent-design-c1",
        "question": "에이전트의 장기 기억(Long-term Memory)은 보통 어디에 저장되고 어떻게 불러오는가?",
        "choices": [
          "컨텍스트 윈도우에만 있다가 세션이 끝나면 사라진다",
          "벡터 DB 등에 저장해 두고 필요할 때 RAG처럼 검색해 컨텍스트에 넣는다",
          "모델 가중치를 매번 재학습한다",
          "브라우저 쿠키에 저장한다"
        ],
        "answer": 1,
        "explanation": "단기 기억은 지금 컨텍스트의 이력(hist), 장기 기억은 세션을 넘어 외부 저장소에 남는다."
      },
      {
        "id": "w7-agent-design-c2",
        "question": "MCP(Model Context Protocol)가 해결하려는 문제는?",
        "choices": [
          "모델의 환각",
          "프레임워크·도구마다 제각각인 연동 방식: 도구를 MCP 서버로 한 번 구현하면 여러 에이전트에서 재사용",
          "GPU 부족",
          "토큰 비용"
        ],
        "answer": 1,
        "explanation": "클라이언트(LLM 앱)와 서버(도구·데이터) 사이의 연결 방식을 표준화한다."
      },
      {
        "id": "w7-agent-design-c3",
        "question": "문서에 숨은 지시에 모델이 이미 속았다고 가정할 때, 메일 발송 같은 행동을 실제로 막는 마지막 방어선은?",
        "choices": [
          "도구 결과를 태그로 감싸기",
          "시스템 프롬프트에 \"속지 마라\"라고 쓰기",
          "되돌릴 수 없는 행동 앞의 사람 승인(Human-in-the-loop)과 최소 권한",
          "temperature 낮추기"
        ],
        "answer": 2,
        "explanation": "데이터/지시 분리는 모델이 무시할 수 있다. 행동 자체를 막는 장치가 있어야 피해가 멈춘다."
      }
    ],
    "quizIds": [
      "w7-q8",
      "w7-q19",
      "w7-q20",
      "w7-q21",
      "w7-q23"
    ],
    "references": [
      {
        "title": "Model Context Protocol 공식 문서",
        "url": "https://modelcontextprotocol.io/introduction",
        "note": "클라이언트·서버 구조와 예제"
      },
      {
        "title": "OWASP Top 10 for LLM Applications",
        "url": "https://genai.owasp.org/llm-top-10/",
        "note": "프롬프트 인젝션·과도한 권한(Excessive Agency) 등 LLM 앱의 대표 보안 위험"
      },
      {
        "title": "Greshake et al. (2023) — Not what you've signed up for: Indirect Prompt Injection",
        "url": "https://arxiv.org/abs/2302.12173",
        "note": "간접 프롬프트 인젝션을 처음 체계적으로 보인 논문 (심화)"
      }
    ]
  },
  "evaluation": {
    "tier": "core",
    "goal": "대표성 있는 골든셋을 설계하고 채점 방식(정확 일치·포함·의미 유사도·LLM-as-judge)을 고르며, LLM 채점관의 편향을 점검하고 Cohen's κ로 사람 채점과의 일치도를 확인하며, 회귀 테스트로 변경의 부작용을 잡을 수 있다.",
    "checks": [
      {
        "id": "w7-evaluation-c1",
        "question": "LLM-as-judge의 위치 편향을 줄이는 방법으로 가장 적절한 것은?",
        "choices": [
          "항상 A를 먼저 보여준다",
          "두 답의 순서를 바꿔 두 번 채점하고 일관된 판정만 채택한다",
          "더 긴 답을 고른다",
          "채점 기준을 숨긴다"
        ],
        "answer": 1,
        "explanation": "순서를 바꿔도 일관된 판정만 남기면 위치 편향에서 나온 판정이 걸러진다."
      },
      {
        "id": "w7-evaluation-c2",
        "question": "프롬프트 v2의 평균 정확도가 v1보다 높을 때도 회귀 테스트가 필요한 이유는?",
        "choices": [
          "평균이 높으면 필요 없다",
          "평균이 올라도 v1에서 맞히던 문항을 새로 틀릴 수 있기 때문에",
          "속도를 재기 위해",
          "골든셋을 늘리기 위해"
        ],
        "answer": 1,
        "explanation": "문항별로 v1·v2를 비교해야 \"새로 틀린 문항\"이 보인다."
      },
      {
        "id": "w7-evaluation-c3",
        "question": "좋은 골든셋의 조건이 아닌 것은?",
        "choices": [
          "실제 사용자 질문에서 뽑는다",
          "다단계·모호·자료에 없는 질문을 섞는다",
          "모델이 확실히 맞히는 쉬운 질문만 모은다",
          "정답과 근거 조각을 표시한다"
        ],
        "answer": 2,
        "explanation": "쉬운 문제만 있으면 개선·회귀를 구별할 수 없다."
      },
      {
        "id": "w7-evaluation-c4",
        "question": "실제로 90%가 합격인 답들에 무조건 \"합격\"만 매기는 LLM 채점관이 있다. 사람 채점과의 일치율과 Cohen's κ는?",
        "choices": [
          "일치율 0.9, κ = 0.9",
          "일치율 0.9, κ = 0",
          "일치율 0, κ = 0",
          "일치율 1.0, κ = 1.0"
        ],
        "answer": 1,
        "explanation": "일치율 $p_o = 0.9$지만 우연 일치도 $p_e = 0.9 \\times 1 + 0.1 \\times 0 = 0.9$라 $\\kappa = (0.9 - 0.9)/(1 - 0.9) = 0$이다. 아무것도 판별하지 못하는 채점관이다."
      }
    ],
    "quizIds": [
      "w7-q7"
    ],
    "references": [
      {
        "title": "Zheng et al. (2023) — Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena",
        "url": "https://arxiv.org/abs/2306.05685",
        "note": "위치·길이·자기선호 편향과 완화책을 실험으로 보인 논문"
      },
      {
        "title": "Hamel Husain — Your AI Product Needs Evals",
        "url": "https://hamel.dev/blog/posts/evals/",
        "note": "실무에서 평가 체계를 만드는 방법 (영문)"
      }
    ]
  },
  "vector-search": {
    "tier": "supplement",
    "goal": "IVF의 칸 수와 $n_\\text{probe}$, HNSW의 $M$·efSearch, PQ 압축이 속도·재현율·메모리를 어떻게 맞바꾸는지 설명하고, 사후·사전 메타데이터 필터의 차이와 bi-encoder·cross-encoder 2단계 검색을 Recall@k′·nDCG로 나눠 평가할 수 있다.",
    "checks": [
      {
        "id": "w7-vector-search-c1",
        "question": "IVF에서 칸 64개 중 가까운 4개만 열어 검색할 때 일어나는 일로 옳은 것은?",
        "choices": [
          "항상 전수 비교와 같은 결과를 낸다",
          "비교하는 문서는 약 6%로 줄지만, 경계 근처의 진짜 이웃이 열지 않은 칸에 있으면 놓친다",
          "칸을 적게 열수록 재현율이 오른다",
          "질의와 가장 먼 칸부터 연다"
        ],
        "answer": 1,
        "explanation": "한 실험에서 $n_\\text{probe} = 4$는 문서의 약 6.3%만 비교하고 Recall@10 0.838을 얻었다. $n_\\text{probe}$를 늘리면 재현율과 비용이 함께 오른다."
      },
      {
        "id": "w7-vector-search-c2",
        "question": "조건을 통과하는 문서가 2%일 때, ANN으로 상위 100개를 먼저 뽑은 뒤 조건으로 거르면(사후 필터) 평균 몇 개가 남는가?",
        "choices": [
          "100개",
          "약 50개",
          "약 2개",
          "항상 10개"
        ],
        "answer": 2,
        "explanation": "평균 $k' s = 100 \\times 0.02 = 2$개다. 하나도 남지 않는 질의도 생긴다(대략 $e^{-2} \\approx 14\\%$). 결과 개수를 보장하려면 사전 필터나 필터를 함께 적용하는 검색을 쓴다."
      },
      {
        "id": "w7-vector-search-c3",
        "question": "Hybrid Search와 Reranking을 함께 쓸 때의 올바른 순서는?",
        "choices": [
          "Reranking으로 전체 문서를 정렬한 뒤 Hybrid Search",
          "Hybrid Search로 후보를 넓게 뽑은 뒤, 소수 후보에만 무거운 Reranking",
          "둘은 같은 기법이다",
          "순서는 상관없다"
        ],
        "answer": 1,
        "explanation": "cross-encoder 재순위화는 질문과 문서를 한 쌍으로 Transformer에 넣으므로 후보마다 순전파가 필요해 비싸다. 1차 검색(재현율 담당)으로 좁힌 수십~수백 개에만 적용한다(정밀도 담당)."
      }
    ],
    "quizIds": [
      "w7-q17",
      "w7-q18",
      "w7-q28"
    ],
    "references": [
      {
        "title": "FAISS — Guidelines to choose an index",
        "url": "https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index",
        "note": "규모·메모리별 인덱스 선택과 IVF 칸 수($4\\sqrt{n}$~$16\\sqrt{n}$)의 근거"
      },
      {
        "title": "Malkov & Yashunin (2016) — HNSW",
        "url": "https://arxiv.org/abs/1603.09320",
        "note": "층을 쌓은 근접 그래프 탐색의 원 논문"
      },
      {
        "title": "Pinecone — Hierarchical Navigable Small Worlds (HNSW)",
        "url": "https://www.pinecone.io/learn/series/faiss/hnsw/",
        "note": "HNSW의 층 구조를 그림으로 (영문)"
      },
      {
        "title": "Nogueira & Cho (2019) — Passage Re-ranking with BERT",
        "url": "https://arxiv.org/abs/1901.04085",
        "note": "cross-encoder 재순위화를 처음 크게 보인 논문"
      }
    ]
  },
  "tool-use": {
    "tier": "supplement",
    "goal": "도구를 이름·설명·JSON 스키마로 정의하고, 모델이 만든 인자를 실행 전에 검증해 오류를 관찰로 돌려주며, 제약 디코딩이 보장하는 것과 가리는 것을 확률 재정규화로 설명하고, eval 없이 권한 등급에 맞게 도구를 안전하게 구현할 수 있다.",
    "checks": [
      {
        "id": "w7-tool-use-c1",
        "question": "스키마가 `top_k: integer, 1~5`인 도구에 모델이 `\"top_k\": \"3\"`을 넣었다. 가장 적절한 처리는?",
        "choices": [
          "그대로 실행한다",
          "실행하지 않고 \"정수여야 함\" 오류를 결과로 돌려줘 모델이 고치게 한다",
          "에이전트를 즉시 종료한다",
          "아무 정수로 바꿔 실행한다"
        ],
        "answer": 1,
        "explanation": "모델이 만든 인자는 믿을 수 없는 입력이다. 실행 전에 스키마로 검사하고, 구체적인 오류를 관찰로 돌려주면 모델이 다음 호출에서 고칠 수 있다."
      },
      {
        "id": "w7-tool-use-c2",
        "question": "제약 디코딩으로 감정 라벨을 [긍정, 부정, 중립] 중 하나로 강제했다. 옳은 설명은?",
        "choices": [
          "라벨이 항상 정답이 된다",
          "형식 위반은 0이 되지만, 모델이 허용되지 않은 토큰(예: \"글쎄요\")에 주던 확률이 남은 라벨에 재분배되어 망설임이 가려질 수 있다",
          "출력 분포가 전혀 바뀌지 않는다",
          "temperature가 0이 된다"
        ],
        "answer": 1,
        "explanation": "허용되지 않은 토큰의 logit을 $-\\infty$로 만들고 남은 것끼리 다시 정규화한다. 형식은 보장되지만 내용은 보장되지 않고, 확신이 없던 분포도 확신에 찬 라벨처럼 보인다. 열거형에 \"모름\" 같은 탈출구를 둔다."
      },
      {
        "id": "w7-tool-use-c3",
        "question": "`eval(expr, {\"__builtins__\": {}})`로 만든 계산기 도구에 대한 설명으로 옳은 것은?",
        "choices": [
          "내장 함수를 막았으니 안전하다",
          "속성 접근을 통한 우회와 `9**9**9` 같은 자원 고갈이 가능하므로, 파서로 허용한 연산만 계산하고 크기에 상한을 둬야 한다",
          "eval은 숫자만 계산할 수 있다",
          "LLM이 만든 식이므로 믿어도 된다"
        ],
        "answer": 1,
        "explanation": "도구의 인자는 외부 문서에 속았을 수 있는 모델이 만든 문자열이다. 문자열을 코드로 실행하지 말고, 허용 목록 방식의 파서와 자원 한도를 쓴다."
      }
    ],
    "quizIds": [
      "w7-q29"
    ],
    "references": [
      {
        "title": "Anthropic — Tool use with Claude",
        "url": "https://docs.anthropic.com/en/docs/build-with-claude/tool-use",
        "note": "도구 정의(이름·설명·입력 스키마)와 tool_use·tool_result 블록의 흐름"
      },
      {
        "title": "OpenAI — Function calling",
        "url": "https://platform.openai.com/docs/guides/function-calling",
        "note": "같은 개념의 다른 API, 구조화 출력(strict 모드) 포함"
      },
      {
        "title": "Tam et al. (2024) — Let Me Speak Freely? Format Restrictions and LLM Performance",
        "url": "https://arxiv.org/abs/2408.02442",
        "note": "엄격한 형식 강제가 추론 성능에 미치는 영향"
      },
      {
        "title": "JSON Schema — Understanding JSON Schema",
        "url": "https://json-schema.org/understanding-json-schema",
        "note": "type·required·enum·minimum 등 스키마 키워드 설명"
      }
    ]
  },
  "multimodal": {
    "tier": "supplement",
    "goal": "Joint Embedding이 필요한 이유와 CLIP의 대조 학습($N \\times N$ 유사도 행렬의 대각선은 올리고 나머지는 내림)을 설명하고, 문장 템플릿과 프롬프트 앙상블로 zero-shot 분류를 하며, VLM이 비전 인코더를 LLM에 잇는 구조와 Image Captioning·VQA·Multimodal LLM을 구분할 수 있다.",
    "checks": [
      {
        "id": "w7-multimodal-c1",
        "question": "배치에 이미지 8장과 캡션 8개가 있을 때 CLIP이 \"유사도를 낮추도록\" 학습하는 쌍의 수는?",
        "choices": [
          "8",
          "16",
          "56",
          "64"
        ],
        "answer": 2,
        "explanation": "전체 $8 \\times 8 = 64$쌍 중 대각선 8쌍(정답 짝)을 뺀 $64 - 8 = 56$쌍이다."
      },
      {
        "id": "w7-multimodal-c2",
        "question": "이미지 인코더와 텍스트 인코더를 따로따로만 학습하면 생기는 문제는?",
        "choices": [
          "두 인코더가 같은 벡터를 출력한다",
          "두 벡터 공간의 좌표축이 서로 무관해 이미지–텍스트 유사도를 직접 잴 수 없다",
          "학습이 불가능하다",
          "이미지 해상도가 낮아진다"
        ],
        "answer": 1,
        "explanation": "Joint Embedding은 두 모달리티를 같은 공간에 정렬해 코사인 유사도로 비교할 수 있게 한다."
      },
      {
        "id": "w7-multimodal-c3",
        "question": "\"이 사진에서 우산을 든 사람은 몇 명이야?\"에 답하는 태스크는?",
        "choices": [
          "Image Captioning",
          "VQA",
          "TTS",
          "대조 학습"
        ],
        "answer": 1,
        "explanation": "캡셔닝은 고정된 \"설명해줘\"에, VQA는 이미지마다 다른 임의의 질문에 답한다."
      },
      {
        "id": "w7-multimodal-c4",
        "question": "CLIP zero-shot 분류에서 클래스 이름 하나(\"고양이\") 대신 여러 문장 템플릿(\"고양이 사진\", \"흐릿한 고양이 사진\" …)의 벡터를 평균 내 쓰는 이유는?",
        "choices": [
          "평균을 내면 벡터 차원이 커져서",
          "학습 캡션과 닮은 문장이 더 잘 맞고, 템플릿마다의 우연한 어긋남이 평균에서 상쇄되기 때문에",
          "이미지 인코더를 다시 학습할 수 있어서",
          "온도가 자동으로 낮아져서"
        ],
        "answer": 1,
        "explanation": "zero-shot 분류는 클래스 문장과 이미지의 코사인 유사도를 비교하는 검색 문제다. 프롬프트 앙상블은 텍스트 쪽 잡음을 줄인다. CLIP 논문은 템플릿과 앙상블로 ImageNet 정확도가 약 5%p 올랐다고 보고했다."
      }
    ],
    "quizIds": [
      "w7-q24",
      "w7-q25",
      "w7-q26",
      "w7-q27"
    ],
    "references": [
      {
        "title": "Radford et al. (2021) — Learning Transferable Visual Models From Natural Language Supervision (CLIP)",
        "url": "https://arxiv.org/abs/2103.00020",
        "note": "그림 1이 대조 학습과 zero-shot 분류를 한눈에 보여준다"
      },
      {
        "title": "OpenAI — CLIP: Connecting text and images",
        "url": "https://openai.com/index/clip/",
        "note": "CLIP 소개 글 (영문)"
      }
    ]
  },
  "contrastive-learning": {
    "tier": "advanced",
    "goal": "InfoNCE를 $N$지선다 cross-entropy로 쓰고, 초기 손실 $\\ln N$, 로짓 기울기 $P - I$와 벡터 수준의 당기기·밀기, 온도가 어려운 오답에 대한 집중도를 조절하는 원리, 배치 크기와 상호정보량 하한 $\\ln N - \\mathcal{L}$의 관계를 유도할 수 있다.",
    "checks": [
      {
        "id": "w7-contrastive-learning-c1",
        "question": "배치 크기 $N = 64$에서 모든 유사도가 같을 때 행 방향 InfoNCE 손실은?",
        "choices": [
          "$0$",
          "$\\ln 64 \\approx 4.16$",
          "$64$",
          "$1/64$"
        ],
        "answer": 1,
        "explanation": "softmax가 $1/64$씩 균등하므로 $-\\ln(1/64) = \\ln 64$다. 손실의 크기가 배치 크기에 달려 있으므로 배치가 다른 실험끼리 손실 값을 그대로 비교하면 안 된다."
      },
      {
        "id": "w7-contrastive-learning-c2",
        "question": "행 방향 손실 $\\ell_i$를 오답 칸의 로짓 $s_{ij}$($j \\neq i$)로 미분한 값은?",
        "choices": [
          "$P_{ij} - 1$",
          "$P_{ij}$",
          "$-P_{ij}$",
          "$0$"
        ],
        "answer": 1,
        "explanation": "softmax + cross-entropy의 기울기는 '확률 − 원핫'이고 오답 칸의 원핫은 0이다. 경사하강은 그 유사도를 $P_{ij}$에 비례해 내리므로, 확률이 큰(헷갈리는) 오답일수록 세게 민다."
      },
      {
        "id": "w7-contrastive-learning-c3",
        "question": "온도 $\\tau$를 크게 낮출 때 일어나는 일로 옳은 것은?",
        "choices": [
          "모든 오답을 똑같이 민다",
          "미는 힘이 가장 어려운 오답에 몰리고, 그 오답이 사실 짝과 같은 뜻(거짓 오답)이면 잘못 크게 밀어낸다",
          "손실이 항상 $\\ln N$이 된다",
          "배치 크기가 커진다"
        ],
        "answer": 1,
        "explanation": "한 실험에서 어려운 오답의 몫은 $\\tau = 1$에서 39%, $0.1$에서 99.2%였다. CLIP은 $\\tau$를 학습 파라미터로 두고 로짓 배율을 100 이하로 제한했다."
      }
    ],
    "quizIds": [
      "w7-q30"
    ],
    "references": [
      {
        "title": "Oord et al. (2018) — Representation Learning with Contrastive Predictive Coding",
        "url": "https://arxiv.org/abs/1807.03748",
        "note": "InfoNCE 손실과 상호정보량 하한을 처음 제시"
      },
      {
        "title": "Karpukhin et al. (2020) — Dense Passage Retrieval",
        "url": "https://arxiv.org/abs/2004.04906",
        "note": "in-batch negatives와 BM25 어려운 오답으로 검색 임베딩을 학습"
      },
      {
        "title": "Wang & Liu (2021) — Understanding the Behaviour of Contrastive Loss",
        "url": "https://arxiv.org/abs/2012.09740",
        "note": "온도가 어려운 오답에 대한 벌점을 조절한다는 분석"
      },
      {
        "title": "Poole et al. (2019) — On Variational Bounds of Mutual Information",
        "url": "https://arxiv.org/abs/1905.06922",
        "note": "InfoNCE 하한이 $\\ln N$에 묶이는 이유와 다른 추정량 비교"
      }
    ]
  },
  "eval-statistics": {
    "tier": "advanced",
    "goal": "윌슨 구간으로 작은 골든셋 정확도의 불확실성과 필요한 문항 수를 구하고, McNemar 검정과 짝지은 부트스트랩으로 같은 문항에서 두 시스템을 비교하며, 선택 편향을 피하는 골든셋 분할과 Rogan–Gladen 채점관 보정을 적용할 수 있다.",
    "checks": [
      {
        "id": "w7-eval-statistics-c1",
        "question": "20문항을 모두 맞혔을 때 정확도의 95% 윌슨 구간에 대한 설명으로 옳은 것은?",
        "choices": [
          "[1, 1]이므로 정확도는 확실히 100%다",
          "약 [0.84, 1.00]이라 진짜 정확도가 84%일 가능성도 배제하지 못한다",
          "구간을 계산할 수 없다",
          "정규 근사 구간과 똑같다"
        ],
        "answer": 1,
        "explanation": "정규 근사는 표준오차가 0이 되어 [1, 1]로 망가지지만, 윌슨 구간은 작은 표본과 0·1 근처에서도 의미 있는 구간을 준다."
      },
      {
        "id": "w7-eval-statistics-c2",
        "question": "같은 골든셋에서 두 시스템을 비교하는 McNemar 검정이 쓰는 정보는?",
        "choices": [
          "두 시스템이 모두 맞힌 문항 수",
          "결과가 엇갈린 문항 수: 한쪽만 맞힌 $b$와 다른 쪽만 맞힌 $c$",
          "두 시스템이 모두 틀린 문항 수",
          "전체 문항 수만"
        ],
        "answer": 1,
        "explanation": "둘 다 맞히거나 둘 다 틀린 문항은 차이에 대한 정보가 없다. 실력이 같다면 엇갈린 문항은 동전 던지기처럼 갈리므로 $b \\sim \\text{Binomial}(b + c, 1/2)$로 검정한다."
      },
      {
        "id": "w7-eval-statistics-c3",
        "question": "청크 크기와 $k$의 아홉 가지 조합을 같은 20문항으로 평가해 가장 좋은 설정의 점수를 보고하면 생기는 문제와 해결책은?",
        "choices": [
          "문제없다",
          "우연히 잘 맞은 설정을 고르는 선택 편향으로 점수가 부풀려지므로, 설정을 고르는 개발용과 마지막에 한 번 보고하는 테스트용으로 골든셋을 나눈다",
          "설정을 더 많이 시험하면 편향이 사라진다",
          "문항 순서를 섞으면 해결된다"
        ],
        "answer": 1,
        "explanation": "시험한 설정이 많을수록 최고 점수에 섞인 운의 몫이 커진다. 2주차 심화의 중첩 교차검증과 같은 이유다."
      }
    ],
    "quizIds": [
      "w7-q31"
    ],
    "references": [
      {
        "title": "Miller (2024) — Adding Error Bars to Evals",
        "url": "https://arxiv.org/abs/2411.00640",
        "note": "LLM 평가에 표준오차·짝지은 비교·반복 샘플링을 적용하는 방법"
      },
      {
        "title": "Wikipedia — Binomial proportion confidence interval",
        "url": "https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval",
        "note": "정규 근사(Wald)와 윌슨 구간 비교 (영문)"
      },
      {
        "title": "Wikipedia — McNemar's test",
        "url": "https://en.wikipedia.org/wiki/McNemar%27s_test",
        "note": "짝지은 이진 결과의 검정과 정확 이항 버전 (영문)"
      }
    ]
  },
  "injection-defense": {
    "tier": "advanced",
    "goal": "프롬프트 수준 방어가 보장이 될 수 없는 이유를 SQL 인젝션과 비교해 설명하고, 치명적 삼박자로 위협을 모델링하며, 계획 후 실행·이중 LLM·정보 흐름 통제(출처 꼬리표 전파와 도구 호출 직전의 정책 검사)로 모델이 속아도 유출이 일어나지 않는 에이전트를 설계할 수 있다.",
    "checks": [
      {
        "id": "w7-injection-defense-c1",
        "question": "치명적 삼박자(lethal trifecta)에 해당하지 않는 것은?",
        "choices": [
          "개인 데이터에 접근한다",
          "신뢰하지 않는 콘텐츠에 노출된다",
          "바깥으로 데이터를 내보낼 수 있다",
          "temperature가 높다"
        ],
        "answer": 3,
        "explanation": "세 능력이 한 에이전트에 모이면 외부 콘텐츠의 지시가 개인 데이터를 읽어 밖으로 내보내게 만들 수 있다. 셋 중 하나만 끊어도 이 경로는 닫힌다."
      },
      {
        "id": "w7-injection-defense-c2",
        "question": "계획 후 실행(plan-then-execute) 패턴이 보장하는 것은?",
        "choices": [
          "외부 데이터가 행동의 인자까지 전혀 바꿀 수 없다",
          "외부 데이터가 어떤 도구를 어떤 순서로 부를지는 바꿀 수 없지만, 인자(예: 메일 본문)에는 영향을 줄 수 있다",
          "모델이 절대 속지 않는다",
          "사람 승인이 필요 없어진다"
        ],
        "answer": 1,
        "explanation": "계획은 신뢰하는 사용자 요청만 보고 확정하므로 행동의 종류와 순서는 고정된다. 인자까지 지키려면 정보 흐름 통제가 필요하다."
      },
      {
        "id": "w7-injection-defense-c3",
        "question": "외부에서 온 메일을 읽은 모델이 만든 메일 주소에, 정보 흐름 통제는 어떤 출처 꼬리표를 붙이는가?",
        "choices": [
          "꼬리표 없음(모델이 새로 만든 값이므로)",
          "user(사용자 요청을 처리하는 중이므로)",
          "메일의 출처(inbox)를 물려받는다",
          "무작위로 정한다"
        ],
        "answer": 2,
        "explanation": "신뢰하지 않는 텍스트를 읽은 뒤 만든 값은 그 텍스트의 영향을 받았을 수 있으므로 꼬리표를 물려받는다(보수적 전파). 그래서 모델이 주소를 '지어낸' 것처럼 보여도 정책이 막는다."
      }
    ],
    "quizIds": [
      "w7-q32"
    ],
    "references": [
      {
        "title": "Simon Willison (2025) — The lethal trifecta for AI agents",
        "url": "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/",
        "note": "개인 데이터·신뢰하지 않는 콘텐츠·외부 통로의 조합"
      },
      {
        "title": "Debenedetti et al. (2025) — Defeating Prompt Injections by Design (CaMeL)",
        "url": "https://arxiv.org/abs/2503.18813",
        "note": "출처 꼬리표와 정책 검사로 인젝션을 설계 수준에서 막는 방법"
      },
      {
        "title": "Beurer-Kellner et al. (2025) — Design Patterns for Securing LLM Agents against Prompt Injections",
        "url": "https://arxiv.org/abs/2506.08837",
        "note": "계획 후 실행·이중 LLM 등 여섯 가지 패턴과 트레이드오프"
      },
      {
        "title": "Debenedetti et al. (2024) — AgentDojo",
        "url": "https://arxiv.org/abs/2406.13352",
        "note": "도구를 쓰는 에이전트의 인젝션 공격·방어를 재는 벤치마크"
      }
    ]
  },
};

export default sections;
