import type { AssignmentSpec } from "../types";

// 6주차 과제: 디코딩 전략·스케일링 법칙·환각·RLHF를 직접 계산하고 관찰한다.
// 외부 모델(gpt2, 챗봇) 대신, 이 사이트의 학습 자료로 학습하는 문자 단위 n-gram 언어모델과
// 미리 준비한 가상 환각 사례를 사용해 모든 실험을 브라우저 안에서 진행한다.
const week6Assignment: AssignmentSpec = {
  title: "LLM 해부 실험 노트",
  summary: `
같은 logit이 temperature와 top-k·top-p 필터를 거치며 어떻게 바뀌는지 표로 정리하고, 이 사이트의 학습 자료로 직접 학습한 작은 언어모델로 디코딩 설정별 생성 결과를 비교합니다. Chinchilla 스케일링 법칙으로 최적 모델 크기를 계산해 공개 모델과 비교하고, 환각 사례를 유형별로 분류한 뒤 InstructGPT의 학습 과정을 자기 언어로 재구성합니다.

**핵심** 항목은 모두 핵심 과정만으로 풀 수 있고 채점 기준도 핵심 항목만 봅니다. **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.
`,
  provideCourseDocs: true,
  tasks: [
    {
      id: "decoding",
      tier: "core",
      title: "디코딩 분포 표",
      instructions: `
「디코딩 전략과 서빙」 단계의 함수를 이용해, 같은 logit에 temperature(0.5, 1.0, 2.0)와 필터(없음, top-k 2·3, top-p 0.5·0.9)를 조합한 확률분포와 남는 후보 수를 한 표로 출력합니다. 코드 셀의 \`TODO\`를 채웁니다.
`,
      cells: [
        {
          kind: "code",
          id: "decoding-code",
          label: "temperature × 필터 분포 표",
          starter: `import numpy as np

def softmax(logits, T=1.0):
    z = (logits - logits.max()) / T
    p = np.exp(z)
    return p / p.sum()

def top_k_filter(p, k):
    threshold = np.sort(p)[::-1][k - 1]
    q = np.where(p >= threshold, p, 0.0)
    return q / q.sum()

def top_p_filter(p, top_p):
    idx = np.argsort(-p)
    cutoff = np.searchsorted(np.cumsum(p[idx]), top_p) + 1
    q = np.zeros_like(p)
    q[idx[:cutoff]] = p[idx[:cutoff]]
    return q / q.sum()

words = ["김밥", "라면", "국밥", "파스타", "초밥", "죽"]
logits = np.array([4.0, 3.0, 2.5, 1.0, 0.5, -1.0])
filters = {
    "없음": lambda p: p,
    "top-k 2": lambda p: top_k_filter(p, 2),
    "top-k 3": lambda p: top_k_filter(p, 3),
    "top-p 0.5": lambda p: top_p_filter(p, 0.5),
    "top-p 0.9": lambda p: top_p_filter(p, 0.9),
}

print(f"{'T':>4} {'필터':<10}" + "".join(f"{w:>7}" for w in words) + "  후보 수")
for T in (0.5, 1.0, 2.0):
    p = softmax(logits, T)
    for name, flt in filters.items():
        q = p  # TODO: 필터 flt를 적용합니다.
        print(f"{T:>4} {name:<10}" + "".join(f"{v:>8.3f}" for v in q) + f"  {int((q > 0).sum()):>4}")
`,
        },
        {
          kind: "text",
          id: "decoding-answer",
          prompt: "temperature와 필터가 분포와 후보 수를 어떻게 바꾸는지, 특히 top-p의 후보 수가 temperature에 따라 달라지는 이유를 설명해 주십시오.",
          minChars: 120,
        },
      ],
    },
    {
      id: "generate",
      tier: "core",
      title: "작은 언어모델로 생성 실험하기",
      instructions: `
첫 번째 셀은 이 사이트의 1~8주차 학습 자료(\`/course/week1.md\` 등)로 문자 단위 4-gram 언어모델을 학습합니다. 다음 글자의 확률은 긴 문맥부터 짧은 문맥까지의 빈도를 섞어(보간) 계산하며, 출력은 logit(로그 확률)입니다. 실제 LLM보다 훨씬 작지만 "다음 토큰의 확률분포를 만들고 디코딩한다"는 구조는 같습니다.

두 번째 셀에서 프롬프트 세 개에 대해 세 가지 설정(Greedy, T=0.7, T=1.5 + top-p 0.9)으로 5회씩 생성하고, 다양성 지표로 **고유 2-gram 비율**(distinct-2)을 계산합니다. 프롬프트는 자유롭게 바꿔도 됩니다. 결과를 보고 설정별 품질을 1~5점으로 매겨 표로 정리하고, 같은 구절이 반복되는 사례를 표시합니다.
`,
      cells: [
        {
          kind: "code",
          id: "generate-model",
          label: "학습 자료로 4-gram 언어모델 학습",
          starter: `import re, glob
from collections import Counter, defaultdict

def clean(md):
    md = re.sub(r"\`\`\`[\\s\\S]*?\`\`\`", " ", md)           # 코드 블록 제거
    md = re.sub(r"\\$[^$]*\\$", " ", md)                   # 수식 제거
    md = re.sub(r"[^가-힣a-zA-Z0-9 .,?!()\\n]", " ", md)   # 한글·영문·숫자·기본 문장부호만 남김
    return re.sub(r"[ \\t]+", " ", md)

corpus = "".join(clean(open(path, encoding="utf-8").read()) for path in sorted(glob.glob("/course/*.md")))
vocab = sorted(set(corpus))
index = {c: i for i, c in enumerate(vocab)}
print(f"말뭉치 {len(corpus):,}자, 어휘 {len(vocab):,}개")

ORDER = 4
counts = [defaultdict(Counter) for _ in range(ORDER)]   # counts[n][문맥 n글자][다음 글자]
for i in range(len(corpus)):
    for n in range(ORDER):
        if i - n >= 0:
            counts[n][corpus[i - n:i]][corpus[i]] += 1

LAMBDAS = [0.02, 0.08, 0.3, 0.6]   # 문맥 길이 0~3의 섞는 비율 (긴 문맥일수록 크게)

def next_logits(context):
    p = np.full(len(vocab), 1e-6)
    for n, lam in enumerate(LAMBDAS):
        ctx = context[-n:] if n else ""
        c = counts[n].get(ctx)
        if not c or (n and len(context) < n):
            continue
        total = sum(c.values())
        for ch, k in c.items():
            p[index[ch]] += lam * k / total
    return np.log(p / p.sum())

def generate(prompt, length=60, T=1.0, top_p=1.0, greedy=False, rng=None):
    text = prompt
    for _ in range(length):
        logits = next_logits(text)
        if greedy:
            nxt = int(np.argmax(logits))
        else:
            q = top_p_filter(softmax(logits, T), top_p)
            nxt = rng.choice(len(vocab), p=q)
        text += vocab[nxt]
    return text[len(prompt):]

print("예시:", generate("신경망은", greedy=True))
`,
        },
        {
          kind: "code",
          id: "generate-experiment",
          label: "설정별 생성과 distinct-2",
          starter: `def distinct2(texts):
    grams = [t[i:i + 2] for t in texts for i in range(len(t) - 1)]
    return len(set(grams)) / max(1, len(grams))

prompts = ["신경망은", "과적합을 막으려면", "언어모델이"]
settings = {
    "Greedy": dict(greedy=True),
    "T=0.7": dict(T=0.7),
    "T=1.5, top-p 0.9": dict(T=1.5, top_p=0.9),
}
rng = np.random.default_rng(0)
for prompt in prompts:
    print(f"\\n■ 프롬프트: {prompt}")
    for name, kw in settings.items():
        samples = [generate(prompt, rng=rng, **kw) for _ in range(5)]
        print(f"  [{name}] distinct-2 = {distinct2(samples):.2f}")
        for s in samples[:2]:
            print("     ", prompt + s.replace("\\n", " "))
`,
        },
        {
          kind: "text",
          id: "generate-answer",
          prompt: "프롬프트·설정별 distinct-2와 품질(1~5점)을 표로 정리하고, 반복 사례와 관찰한 경향을 설명해 주십시오.",
          template: `| 프롬프트 | 설정 | distinct-2 | 품질(1~5) | 반복 여부 |
| --- | --- | --- | --- | --- |
|  | Greedy |  |  |  |
|  | T=0.7 |  |  |  |
|  | T=1.5, top-p 0.9 |  |  |  |

관찰: `,
          minChars: 330,
        },
      ],
    },
    {
      id: "scaling",
      tier: "core",
      title: "스케일링 법칙 계산",
      instructions: `
(a) 학습 컴퓨트 $C \\approx 6ND$와 Chinchilla 최적 비율 $D \\approx 20N$을 이용해 $C = 10^{22}$, $10^{24}$ FLOPs에서의 최적 파라미터 수 $N$과 토큰 수 $D$를 구합니다. 코드 셀에 풀이 과정을 주석으로 남깁니다.

(b) 공개 모델 하나를 골라 $D/N$과 $C$를 계산하고, 최적 비율 20과 비교해 과잉학습(over-training) 여부와 그렇게 학습한 이유를 논평합니다. 20은 Chinchilla의 실험 설정(구조·데이터·학습률 스케줄)에서 얻은 경험적 비율이므로, 데이터 품질이나 구조가 다른 모델에 그대로 적용할 때의 한계도 한 문장 이상 언급합니다. 아래 표의 모델을 써도 되고, 다른 모델을 골라 출처를 밝혀도 됩니다.

| 모델 | 파라미터 수 $N$ | 학습 토큰 수 $D$ | 출처 |
| --- | --- | --- | --- |
| Chinchilla | 70B | 1.4T | [Hoffmann et al., 2022](https://arxiv.org/abs/2203.15556) |
| Llama 2 7B | 7B | 2T | [Touvron et al., 2023](https://arxiv.org/abs/2307.09288) |
| Llama 3 8B | 8B | 15T 이상 | [Meta Llama 3 모델 카드](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md) |
`,
      cells: [
        {
          kind: "code",
          id: "scaling-code",
          label: "Chinchilla 최적 N, D",
          starter: `# C = 6ND, D = 20N  →  C = 6 · N · 20N = 120 N²  →  N = sqrt(C / 120)
def chinchilla_optimal(C):
    N = 0.0  # TODO
    D = 0.0  # TODO
    return N, D

for C in (1e22, 1e24):
    N, D = chinchilla_optimal(C)
    print(f"C = {C:.0e} FLOPs → N ≈ {N / 1e9:.2f}B 파라미터, D ≈ {D / 1e9:.0f}B 토큰")

# (b) 공개 모델
name, N_pub, D_pub = "Llama 3 8B", 8e9, 15e12   # 다른 모델을 골랐다면 바꿉니다.
print(f"\\n{name}: D/N = {D_pub / N_pub:.0f}, C ≈ 6ND = {6 * N_pub * D_pub:.2e} FLOPs")
`,
        },
        {
          kind: "text",
          id: "scaling-answer",
          prompt: "계산 결과를 요약하고, 고른 공개 모델의 과잉학습 여부와 그 이유를 출처와 함께 논평해 주십시오.",
          minChars: 150,
        },
      ],
    },
    {
      id: "hallucination",
      tier: "core",
      title: "환각 사례 분류",
      instructions: `
아래는 챗 모델이 흔히 보이는 환각을 보여 주기 위해 **만든 가상 예시**입니다. 실제 모델의 출력이 아니며, 응답 속 거짓 정보를 사실처럼 인용하지 않습니다.

| # | 질문 | 모델 응답(가상) | 실제 사실 |
| --- | --- | --- | --- |
| 1 | Transformer 논문은 언제 어디서 발표되었나요? | 2015년 ICML에서 발표되었습니다. | 2017년 NeurIPS(당시 NIPS)에서 발표되었습니다. |
| 2 | Chinchilla 스케일링 결과의 출처를 알려 주세요. | Smith et al. (2021), "Optimal Scaling of Language Models", JMLR 22(4). | Hoffmann et al. (2022), arXiv:2203.15556입니다. 응답의 논문은 존재하지 않습니다. |
| 3 | 3.9와 3.11 중 어느 수가 더 큰가요? | 11이 9보다 크므로 3.11이 더 큽니다. | 3.9 > 3.11입니다. 소수점 아래 자릿값을 잘못 비교했습니다. |
| 4 | 현재 가장 최신 Python 버전은 무엇인가요? | Python 3.8이 최신 버전입니다. | 학습 데이터 수집 이후에 여러 버전이 새로 나왔습니다. 최신 버전은 python.org에서 확인해야 합니다. |
| 5 | RLHF에서 보상 모델은 무엇을 학습하나요? | 보상 모델은 모범 답안 텍스트를 직접 생성하도록 학습됩니다. | 사람이 두 응답 중 더 나은 쪽을 고른 비교 데이터로, 응답에 점수(스칼라)를 매기도록 학습됩니다. |

각 사례를 사실 조작, 출처 조작, 논리 오류, 시점 오류 중 하나로 분류하고, 그렇게 분류한 근거와 완화책(예: 검색 증강, 인용 검증, 도구 사용, 거절 학습)을 제안합니다. 직접 겪은 사례가 있다면 하나 더 추가해도 좋습니다.
`,
      cells: [
        {
          kind: "text",
          id: "hallucination-answer",
          prompt: "다섯 사례의 유형, 분류 근거, 완화책을 표로 정리해 주십시오.",
          template: `| # | 유형 | 분류 근거 | 완화책 |
| --- | --- | --- | --- |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |
| 4 |  |  |  |
| 5 |  |  |  |
`,
          minChars: 330,
        },
      ],
    },
    {
      id: "instructgpt",
      tier: "core",
      title: "InstructGPT 학습 과정 재구성",
      instructions: `
InstructGPT 논문([Ouyang et al., 2022](https://arxiv.org/abs/2203.02155))의 그림 2(세 단계 학습 과정)를 자기 언어로 다시 정리합니다. 단계마다 입력 데이터의 형태, 학습하는 모델, 목적함수를 적고, 전체 과정을 세 문장으로 요약합니다. 표나 목록으로 구조를 표현하면 됩니다.
`,
      cells: [
        {
          kind: "text",
          id: "instructgpt-answer",
          prompt: "세 단계의 데이터 형태, 모델, 목적함수와 전체 요약을 작성해 주십시오.",
          template: `| 단계 | 데이터 형태 | 학습하는 모델 | 목적함수 |
| --- | --- | --- | --- |
| 1. SFT |  |  |  |
| 2. 보상 모델 |  |  |  |
| 3. PPO |  |  |  |

요약: `,
          minChars: 300,
        },
      ],
    },
    {
      id: "advanced",
      tier: "advanced",
      title: "심화: DPO·PPO·추론 시간 계산·투기적 디코딩 실험",
      instructions: `
다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않습니다.

- 「RLHF와 DPO」 단계의 DPO 손실에서 로그확률 비율 차이 $x$에 대한 기울기 $\\partial \\mathcal{L} / \\partial x$를 $\\beta = 0.1, 1$에서 그려 보고, $\\beta$가 클수록 기준 모델 근처에 머문다는 설명을 기울기로 해석합니다.
- 4-gram 모델의 말뭉치 크기(10%, 30%, 100%)나 문맥 길이를 바꿔 검증 손실을 재고, 로그-로그 그래프에 직선을 맞춰 지수를 추정합니다.
- 4-gram 모델로 같은 프롬프트를 temperature 1.0에서 $n$ = 1, 5, 21번 생성하고, "다음 한 글자"를 다수결로 고를 때와 그리디로 고를 때 결과가 얼마나 같은지 비교합니다. 다수결이 그리디에 수렴하는 이유를 「추론 시간 계산」의 이항분포로 설명합니다.
- 4-gram 모델의 문맥 길이를 1로 줄인 모델을 초안 $q$, 원래 모델을 목표 $p$로 두고 위치마다 수락률 $\\sum\\min(p, q)$를 재어 평균을 구한 뒤, 초안 비용 $c$ = 0.05일 때 최적 초안 길이 $k$와 기대 속도 향상을 계산합니다(「투기적 디코딩」).
- 팔 3~5개 밴딧에서 REINFORCE(기준선 유무)와 PPO 클리핑으로 정책을 학습해, 보상 곡선과 기준 정책과의 KL을 비교합니다(「정책 경사와 PPO」).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: `# 선택한 심화 실험을 이 셀에서 진행합니다.\n` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "calc", label: "계산 정확성", points: 3, guide: "디코딩 분포 표와 Chinchilla 최적 N, D 계산이 정확합니다." },
    { id: "generate", label: "생성 실험 설계와 기록", points: 2, guide: "설정별로 여러 번 생성해 다양성과 품질을 비교하고, 반복 사례를 기록했습니다." },
    { id: "overtrain", label: "과잉학습 판정의 근거와 출처", points: 2, guide: "D/N을 최적 비율과 비교하고, 추론 비용 등 이유를 출처와 함께 논평했습니다." },
    { id: "hallucination", label: "환각 분류와 완화책", points: 2, guide: "유형 분류의 근거가 분명하고, 유형에 맞는 구체적인 완화책을 제안했습니다." },
    { id: "paper", label: "논문 이해", points: 1, guide: "세 단계의 데이터·모델·목적함수를 정확히 정리했습니다." },
  ],
};

export default week6Assignment;
