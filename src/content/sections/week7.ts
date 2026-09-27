import type { SectionMeta } from "../types";

// Week 7 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "prompting": {
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
        "explanation": "다수결은 오답이 흩어진다는 전제에서만 효과가 있다. 실습에서 같은 오답이 약 48%면 샘플을 늘릴수록 오답이 이겼다."
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
    "goal": "임베딩 기반 Dense 검색과 BM25 Sparse 검색의 매칭 기준·강약점을 비교하고, ANN(HNSW·IVF)·벡터 DB·FAISS·메타데이터 필터링·하이브리드 검색·재순위화의 역할을 설명할 수 있다.",
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
        "id": "w7-retrieval-c3",
        "question": "Hybrid Search와 Reranking을 함께 쓸 때의 올바른 순서는?",
        "choices": [
          "Reranking으로 전체 문서를 정렬한 뒤 Hybrid Search",
          "Hybrid Search로 후보를 넓게 뽑은 뒤, 소수 후보에만 무거운 Reranking",
          "둘은 같은 기법이다",
          "순서는 상관없다"
        ],
        "answer": 1,
        "explanation": "cross-encoder 재순위화는 비싸므로 1차 검색으로 좁힌 수십~수백 개에만 적용한다."
      }
    ],
    "quizIds": [
      "w7-q15",
      "w7-q16",
      "w7-q17",
      "w7-q18"
    ],
    "references": [
      {
        "title": "Pinecone — Hierarchical Navigable Small Worlds (HNSW)",
        "url": "https://www.pinecone.io/learn/series/faiss/hnsw/",
        "note": "HNSW의 층 구조를 그림으로 (영문)"
      },
      {
        "title": "Robertson & Zaragoza (2009) — The Probabilistic Relevance Framework: BM25 and Beyond",
        "url": "https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf",
        "note": "BM25 공식의 유래 (심화)"
      },
      {
        "title": "FAISS 공식 위키",
        "url": "https://github.com/facebookresearch/faiss/wiki",
        "note": "IVF·HNSW 인덱스를 실제로 고르는 가이드"
      }
    ]
  },
  "rag-pipeline": {
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
        "note": "RAG라는 이름을 붙인 논문 — 그림 1"
      },
      {
        "title": "Liu et al. (2023) — Lost in the Middle: How Language Models Use Long Contexts",
        "url": "https://arxiv.org/abs/2307.03172",
        "note": "긴 컨텍스트의 가운데 정보를 놓치는 현상 — 청크 크기·배치 설계의 근거"
      }
    ]
  },
  "retrieval-metrics": {
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
          "생성 단계 — 프롬프트 구성·조각 순서·모델이 근거를 무시하거나 오독했는지",
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
        "explanation": "실습의 `stuck_llm`처럼 같은 호출만 반복하는 경우에도 정해진 스텝에서 멈춘다."
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
    "goal": "단기·장기 메모리, 플래너/실행자 멀티에이전트, MCP의 역할을 설명하고, 간접 프롬프트 인젝션에 대해 데이터/지시 분리·최소 권한·Human-in-the-loop를 겹겹이 적용할 수 있다.",
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
          "프레임워크·도구마다 제각각인 연동 방식 — 도구를 MCP 서버로 한 번 구현하면 여러 에이전트에서 재사용",
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
  "multimodal": {
    "goal": "Joint Embedding이 필요한 이유와 CLIP의 대조 학습($N \\times N$ 유사도 행렬의 대각선은 올리고 나머지는 내림)을 설명하고, VLM·Image Captioning·VQA·Multimodal LLM·Audio Model을 구분할 수 있다.",
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
        "explanation": "전체 $8 \\times 8 = 64$쌍 중 대각선 8쌍(진짜 짝)을 뺀 $64 - 8 = 56$쌍이다."
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
  "evaluation": {
    "goal": "대표성 있는 골든셋을 설계하고 채점 방식(정확 일치·포함·의미 유사도·LLM-as-judge)을 고르며, LLM 채점관의 편향을 점검하고 회귀 테스트로 변경의 부작용을 잡을 수 있다.",
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
        "explanation": "실습에서 순서를 바꿔도 일관된 판정만 남기자 실제 품질과 모두 일치했다."
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
};

export default sections;
