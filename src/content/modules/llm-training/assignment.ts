import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "llm-anatomy",
  kind: "module",
  title: "LLM 해부 실험 노트",
  summary: md`
같은 logit이 temperature와 top-k·top-p 필터를 거치며 어떻게 바뀌는지 표로 정리하고, 이 과정의 학습 자료로 직접 학습한 작은 언어 모델로 디코딩 설정별 생성 결과를 비교합니다. Chinchilla 스케일링 법칙으로 최적 모델 크기를 계산해 공개 모델과 비교하고, 환각 사례의 유형과 원인을 학습 과정과 연결해 분석한 뒤 InstructGPT의 학습 과정을 정리합니다.

**핵심** 항목 다섯 개는 과제 안내와 이 모듈의 레슨으로 풀 수 있고, 채점 기준도 이 다섯 항목만 봅니다. **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.
`,
  requirements: [
    "temperature 3가지와 필터 5가지를 조합한 분포 표의 TODO(필터 적용)를 채우고, 행마다 확률 합이 1이며 남는 후보 수가 맞는지 확인한다.",
    "작은 언어 모델로 설정별(Greedy · T=0.7 · T=1.5 + top-p 0.9) 생성을 반복해 distinct-2와 품질, 반복 사례를 기록한다.",
    "$C = 10^{22}$, $10^{24}$에서 Chinchilla 최적 $N$, $D$를 풀이와 함께 계산하고, 공개 모델 하나의 $D/N$을 근거로 과잉학습 여부를 논평한다.",
    "환각 사례 다섯 개를 유형별로 분류하고, 원인을 학습 과정과 연결해 설명하며, 완화책을 제안한다.",
    "InstructGPT 세 단계(SFT · 보상 모델 · PPO)의 데이터 · 모델 · 목적함수를 정리한다.",
  ],
  tasks: [
    {
      id: "decoding",
      title: "디코딩 분포 표",
      tier: "core",
      instructions: md`
[[lesson:decoding]]의 softmax, top-k, top-p 함수를 이용해, 같은 logit에 temperature(0.5, 1.0, 2.0)와 필터(없음, top-k 2·3, top-p 0.5·0.9)를 조합한 확률분포와 남는 후보 수를 한 표로 출력합니다. 코드 셀의 \`TODO\`를 채웁니다.
`,
      cells: [
        { kind: "code", id: "decoding-code", label: "temperature × 필터 분포 표", starter: py`
import numpy as np

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
` },
        { kind: "text", id: "decoding-answer", prompt: "temperature와 필터가 분포와 후보 수를 어떻게 바꾸는지, 특히 top-p의 후보 수가 temperature에 따라 달라지는 이유를 설명해 주십시오.", minChars: 120 },
      ],
    },
    {
      id: "generate",
      title: "작은 언어 모델로 생성 실험하기",
      tier: "core",
      instructions: md`
첫 번째 셀은 이 과정의 학습 자료로 문자 단위 4-gram 언어 모델을 학습합니다. 학습 자료는 모듈마다 파일 하나(\`/course/llm-training.md\` 등, 확장 모듈 제외)로 제공됩니다. 다음 글자의 확률은 긴 문맥부터 짧은 문맥까지의 빈도를 섞어(보간) 계산하며, 출력은 logit(로그 확률)입니다. 실제 LLM보다 훨씬 작지만 "다음 토큰의 확률분포를 만들고 디코딩한다"는 구조는 같습니다.

두 번째 셀에서 프롬프트 세 개에 대해 세 가지 설정(Greedy, T=0.7, T=1.5 + top-p 0.9)으로 5회씩 생성하고, 다양성 지표로 **고유 2-gram 비율**(distinct-2)을 계산합니다. 프롬프트는 자유롭게 바꿔도 됩니다. 결과를 보고 설정별 품질을 1~5점으로 매겨 표로 정리하고, 같은 구절이 반복되는 사례를 표시합니다.
`,
      cells: [
        { kind: "code", id: "generate-model", label: "학습 자료로 4-gram 언어 모델 학습", starter: py`
import re, glob
from collections import Counter, defaultdict

def clean(md):
    md = re.sub(r"\`\`\`[\s\S]*?\`\`\`", " ", md)           # 코드 블록 제거
    md = re.sub(r"\$[^$]*\$", " ", md)                   # 수식 제거
    md = re.sub(r"[^가-힣a-zA-Z0-9 .,?!()\n]", " ", md)   # 한글·영문·숫자·기본 문장부호만 남김
    return re.sub(r"[ \t]+", " ", md)

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
` },
        { kind: "code", id: "generate-experiment", label: "설정별 생성과 distinct-2", starter: py`
def distinct2(texts):
    grams = [t[i:i + 2] for t in texts for i in range(len(t) - 1)]
    return len(set(grams)) / max(1, len(grams))

prompts = ["신경망은", "과적합을 막으려면", "언어 모델이"]
settings = {
    "Greedy": dict(greedy=True),
    "T=0.7": dict(T=0.7),
    "T=1.5, top-p 0.9": dict(T=1.5, top_p=0.9),
}
rng = np.random.default_rng(0)
for prompt in prompts:
    print(f"\n■ 프롬프트: {prompt}")
    for name, kw in settings.items():
        samples = [generate(prompt, rng=rng, **kw) for _ in range(5)]
        print(f"  [{name}] distinct-2 = {distinct2(samples):.2f}")
        for s in samples[:2]:
            print("     ", prompt + s.replace("\n", " "))
` },
        { kind: "text", id: "generate-answer", prompt: "프롬프트·설정별 distinct-2와 품질(1~5점)을 표로 정리하고, 반복 사례와 관찰한 경향을 설명해 주십시오.", minChars: 330, template: md`
| 프롬프트 | 설정 | distinct-2 | 품질(1~5) | 반복 여부 |
| --- | --- | --- | --- | --- |
|  | Greedy |  |  |  |
|  | T=0.7 |  |  |  |
|  | T=1.5, top-p 0.9 |  |  |  |

관찰:
` },
      ],
    },
    {
      id: "scaling",
      title: "스케일링 법칙 계산",
      tier: "core",
      instructions: md`
식의 근거와 예제는 [[lesson:scaling-laws]]에 있습니다.

(a) 학습 컴퓨트 $C \approx 6ND$와 Chinchilla 최적 비율 $D \approx 20N$을 이용해 $C = 10^{22}$, $10^{24}$ FLOPs에서의 최적 파라미터 수 $N$과 토큰 수 $D$를 구합니다. 코드 셀에 풀이 과정을 주석으로 남깁니다.

(b) 공개 모델 하나를 골라 $D/N$과 $C$를 계산하고, 최적 비율 20과 비교해 과잉학습(over-training) 여부와 그렇게 학습한 이유를 논평합니다. 20은 Chinchilla의 실험 설정(구조·데이터·학습률 스케줄)에서 얻은 경험적 비율이므로, 데이터 품질이나 구조가 다른 모델에 그대로 적용할 때의 한계도 한 문장 이상 언급합니다. 아래 표의 모델을 써도 되고, 다른 모델을 골라 출처를 밝혀도 됩니다.

| 모델 | 파라미터 수 $N$ | 학습 토큰 수 $D$ | 출처 |
| --- | --- | --- | --- |
| Chinchilla | 70B | 1.4T | [Hoffmann et al., 2022](https://arxiv.org/abs/2203.15556) |
| Llama 2 7B | 7B | 2T | [Touvron et al., 2023](https://arxiv.org/abs/2307.09288) |
| Llama 3 8B | 8B | 15T 이상 | [Meta Llama 3 모델 카드](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md) |
`,
      cells: [
        { kind: "code", id: "scaling-code", label: "Chinchilla 최적 N, D", starter: py`
# C = 6ND, D = 20N  →  C = 6 · N · 20N = 120 N²  →  N = sqrt(C / 120)
def chinchilla_optimal(C):
    N = 0.0  # TODO
    D = 0.0  # TODO
    return N, D

for C in (1e22, 1e24):
    N, D = chinchilla_optimal(C)
    print(f"C = {C:.0e} FLOPs → N ≈ {N / 1e9:.2f}B 파라미터, D ≈ {D / 1e9:.0f}B 토큰")

# (b) 공개 모델
name, N_pub, D_pub = "Llama 3 8B", 8e9, 15e12   # 다른 모델을 골랐다면 바꿉니다.
print(f"\n{name}: D/N = {D_pub / N_pub:.0f}, C ≈ 6ND = {6 * N_pub * D_pub:.2e} FLOPs")
` },
        { kind: "text", id: "scaling-answer", prompt: "계산 결과를 요약하고, 고른 공개 모델의 과잉학습 여부와 그 이유를 출처와 함께 논평해 주십시오.", minChars: 150 },
      ],
    },
    {
      id: "hallucination",
      title: "환각 사례 분류",
      tier: "core",
      instructions: md`
아래는 챗 모델이 흔히 보이는 환각을 보여 주기 위해 **만든 가상 예시**입니다. 실제 모델의 출력이 아니며, 응답 속 거짓 정보를 사실처럼 인용하지 않습니다.

| # | 질문 | 모델 응답(가상) | 실제 사실 |
| --- | --- | --- | --- |
| 1 | Transformer 논문은 언제 어디서 발표되었나요? | 2015년 ICML에서 발표되었습니다. | 2017년 NeurIPS(당시 NIPS)에서 발표되었습니다. |
| 2 | Chinchilla 스케일링 결과의 출처를 알려 주세요. | Smith et al. (2021), "Optimal Scaling of Language Models", JMLR 22(4). | Hoffmann et al. (2022), arXiv:2203.15556입니다. 응답의 논문은 존재하지 않습니다. |
| 3 | 3.9와 3.11 중 어느 수가 더 큰가요? | 11이 9보다 크므로 3.11이 더 큽니다. | 3.9 > 3.11입니다. 소수점 아래 자릿값을 잘못 비교했습니다. |
| 4 | 현재 가장 최신 Python 버전은 무엇인가요? | Python 3.8이 최신 버전입니다. | 학습 데이터 수집 이후에 여러 버전이 새로 나왔습니다. 최신 버전은 python.org에서 확인해야 합니다. |
| 5 | RLHF에서 보상 모델은 무엇을 학습하나요? | 보상 모델은 모범 답안 텍스트를 직접 생성하도록 학습됩니다. | 사람이 두 응답 중 더 나은 쪽을 고른 비교 데이터로, 응답에 점수(스칼라)를 매기도록 학습됩니다. |

각 사례를 사실 조작, 출처 조작, 논리 오류, 시점 오류 중 하나로 분류하고 그 근거를 씁니다. 이어서 이 모듈에서 다룬 학습 과정(사전학습의 다음 토큰 예측, 학습 데이터의 수집 시점, 지시 미세조정과 선호 학습)과 연결해 그 환각이 생기는 원인을 설명합니다. 완화책은 다음 중에서 고르고, 그 방법이 원인을 어떻게 줄이는지 씁니다.

- **검색 증강(RAG)**: 질문과 관련된 문서를 검색해 프롬프트에 넣고, 그 문서를 근거로 답하게 합니다.
- **인용 검증**: 응답이 인용한 출처가 실제로 존재하고 내용이 맞는지 확인합니다.
- **도구 사용**: 계산이나 최신 정보 조회를 계산기, 검색 같은 외부 도구에 맡깁니다.
- **보류 허용**: 확실하지 않으면 모른다고 답하도록 프롬프트로 지시하거나, 그렇게 답한 응답을 선호하도록 학습합니다.

이 방법들은 [[lesson:rag]], [[lesson:agents]], [[lesson:hallucination]]에서 자세히 다룹니다. 직접 겪은 사례가 있다면 하나 더 추가해도 됩니다.
`,
      cells: [
        { kind: "text", id: "hallucination-answer", prompt: "다섯 사례의 유형, 분류 근거, 원인, 완화책을 표로 정리해 주십시오.", minChars: 400, template: md`
| # | 유형 | 분류 근거 | 원인 | 완화책 |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |
` },
      ],
    },
    {
      id: "instructgpt",
      title: "InstructGPT 학습 과정 재구성",
      tier: "core",
      instructions: md`
InstructGPT 논문([Ouyang et al., 2022](https://arxiv.org/abs/2203.02155))의 그림 2(세 단계 학습 과정)를 자기 언어로 다시 정리합니다. 단계마다 입력 데이터의 형태, 학습하는 모델, 목적함수를 적고, 전체 과정을 세 문장으로 요약합니다. 표나 목록으로 구조를 표현하면 됩니다.
`,
      cells: [
        { kind: "text", id: "instructgpt-answer", prompt: "세 단계의 데이터 형태, 모델, 목적함수와 전체 요약을 작성해 주십시오.", minChars: 300, template: md`
| 단계 | 데이터 형태 | 학습하는 모델 | 목적함수 |
| --- | --- | --- | --- |
| 1. SFT |  |  |  |
| 2. 보상 모델 |  |  |  |
| 3. PPO |  |  |  |

요약:
` },
      ],
    },
    {
      id: "advanced",
      title: "심화: DPO·PPO·추론 시간 계산·투기적 디코딩 실험",
      tier: "advanced",
      instructions: md`
다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않습니다.

- [[lesson:preference-learning]]의 DPO 손실에서 로그확률 비율 차이 $x$에 대한 기울기 $\partial \mathcal{L} / \partial x$를 $\beta = 0.1, 1$에서 그려 보고, $\beta$가 클수록 기준 모델 근처에 머문다는 설명을 기울기로 해석합니다.
- 4-gram 모델의 말뭉치 크기(10%, 30%, 100%)나 문맥 길이를 바꿔 검증 손실을 재고, 로그-로그 그래프에 직선을 맞춰 지수를 추정합니다.
- 4-gram 모델로 같은 프롬프트를 temperature 1.0에서 $n$ = 1, 5, 21번 생성하고, "다음 한 글자"를 다수결로 고를 때와 그리디로 고를 때 결과가 얼마나 같은지 비교합니다. 다수결이 그리디에 수렴하는 이유를 [[lesson:test-time-compute]]의 이항분포로 설명합니다.
- 4-gram 모델의 문맥 길이를 1로 줄인 모델을 초안 $q$, 원래 모델을 목표 $p$로 두고 위치마다 수락률 $\sum\min(p, q)$를 재어 평균을 구한 뒤, 초안 비용 $c$ = 0.05일 때 최적 초안 길이 $k$와 기대 속도 향상을 계산합니다([[lesson:speculative-decoding]]).
- 팔 3~5개 밴딧에서 REINFORCE(기준값 유무)와 PPO 클리핑으로 정책을 학습해, 보상 곡선과 기준 정책과의 KL을 비교합니다([[lesson:policy-gradient]]).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 심화 실험을 이 셀에서 진행합니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "calc", label: "계산 정확성", points: 3, guide: "디코딩 분포 표와 Chinchilla 최적 N, D 계산이 정확합니다." },
    { id: "generate", label: "생성 실험 설계와 기록", points: 2, guide: "설정별로 여러 번 생성해 다양성과 품질을 비교하고, 반복 사례를 기록했습니다." },
    { id: "overtrain", label: "과잉학습 판정의 근거와 출처", points: 2, guide: "D/N을 최적 비율과 비교하고, 추론 비용 등 이유를 출처와 함께 논평했습니다." },
    { id: "hallucination", label: "환각의 분류, 원인, 완화책", points: 2, guide: "유형 분류의 근거가 분명하고, 원인을 학습 과정과 연결해 설명했으며, 원인에 맞는 완화책을 제안했습니다." },
    { id: "paper", label: "논문 이해", points: 1, guide: "세 단계의 데이터·모델·목적함수를 정확히 정리했습니다." },
  ],
  gradingNotes: md`
- **디코딩 분포 표**: temperature가 낮을수록 top-p에서 남는 후보 수가 줄어든다(top-p 0.9에서 T=0.5는 2개, T=2.0은 5개).
- **작은 언어 모델로 생성 실험하기**: Greedy는 같은 구절을 반복해 distinct-2가 0.1 미만이고, T=0.7은 문장 조각이 비교적 자연스러우며, T=1.5는 다양성이 높지만 글자가 뒤섞인다.
- **스케일링 법칙 계산**: $C = 6ND$, $D = 20N$이면 $N = \sqrt{C/120}$이다. $C=10^{22}$이면 $N \approx 9.1 \times 10^9$, $D \approx 1.8 \times 10^{11}$이고, $C=10^{24}$이면 $N \approx 9.1 \times 10^{10}$, $D \approx 1.8 \times 10^{12}$이다. Llama 3 8B는 $D/N \approx 1875$로 최적 비율 20을 크게 넘는 과잉 학습이며, 추론 비용을 줄이려고 작은 모델을 오래 학습한 것이라는 설명이 핵심이다.
- **환각 사례 분류**: 1 사실 조작(또는 시점 오류), 2 출처 조작, 3 논리 오류, 4 시점 오류, 5 사실 조작(개념 혼동)이 모범 분류이며, 근거가 타당하면 다른 분류도 인정한다. 원인은 다음과 같이 연결하면 된다. 1·2는 다음 토큰 예측이 사실 여부와 관계없이 그럴듯한 연도, 학회명, 인용 형식을 생성하도록 학습되기 때문이고(완화책: 검색 증강, 인용 검증), 3은 소수를 버전 번호나 날짜처럼 비교하는 학습 데이터의 패턴과 토큰 단위 처리 때문이며(도구 사용), 4는 학습 데이터의 수집 시점 이후 정보가 없기 때문이다(검색 증강, 보류 허용). 5는 "보상 모델"과 "생성"이 함께 나오는 문맥을 잘못 연결한 개념 혼동이다(검색 증강). 확신에 찬 답이 선호 학습에서 높은 보상을 받는다는 점을 원인으로 든 답도 인정한다.
`,
  maxScore: 10,
  autoTests: [
    { id: "w6-at-filter", taskId: "decoding", title: "필터를 실제로 적용했다(마지막 행: T=2.0, top-p 0.9)", hint: "반복문 안의 `q = p`를 `q = flt(p)`로 바꿉니다.", code: py`
import numpy as np
assert abs(q.sum() - 1) < 1e-9, f"확률 합 {q.sum()}"
assert np.count_nonzero(q) < len(words), "마지막 행(top-p 0.9)에서 후보가 줄지 않았습니다. 필터를 적용했는지 확인하십시오."
p2 = softmax(logits, 2.0)
assert np.allclose(q, top_p_filter(p2, 0.9)), "마지막 행이 top_p_filter(softmax(logits, 2.0), 0.9)와 다릅니다."
` },
    { id: "w6-at-lm", taskId: "generate", title: "4-gram 언어 모델의 출력이 확률분포(로그)이고 Greedy 생성이 결정적이다", hint: "첫 셀이 학습 자료(/course/*.md)를 읽었는지(말뭉치 크기 출력) 확인하십시오.", code: py`
import numpy as np
lg = next_logits("신경망")
assert len(lg) == len(vocab) and abs(np.log(np.exp(lg).sum())) < 1e-6, "next_logits가 정규화된 로그 확률이 아닙니다."
a, b = generate("신경망은", length=10, greedy=True), generate("신경망은", length=10, greedy=True)
assert len(a) == 10 and a == b, "Greedy 생성이 같은 결과를 내지 않습니다."
` },
    { id: "w6-at-chinchilla", taskId: "scaling", title: "chinchilla_optimal: N = √(C/120), D = 20N", code: py`
import math
for C in (1e22, 1e24, 3.7e21):
    N, D = chinchilla_optimal(C)
    assert abs(N - math.sqrt(C / 120)) / math.sqrt(C / 120) < 1e-9 and abs(D - 20 * N) < 1e-6 * D, f"C={C:.1e}: N={N:.3e}, D={D:.3e}"
` },
    { id: "w6-at-public", taskId: "scaling", title: "공개 모델의 N, D를 정했다", code: py`
assert N_pub > 0 and D_pub > 0 and isinstance(name, str) and name, "name, N_pub, D_pub을 정의하십시오."
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "빔 서치와 길이 정규화",
      prompt: md`
코드 셀에 정의된 작은 언어 모델 \`lm\`(이전 토큰 하나로 다음 토큰의 확률을 정하는 표)으로 디코딩을 구현합니다([[lesson:decoding]]).

1. \`greedy(lm)\`: 매번 확률이 가장 큰 토큰을 고릅니다(최대 6토큰).
2. \`beam_search(lm, width, max_len=6, alpha=0.0)\`: 누적 로그확률 상위 \`width\`개 후보를 유지하며 확장하고, \`<eos>\`로 끝난 후보는 그대로 둡니다. 최종 선택 점수는 $\dfrac{\log P}{(\text{생성 토큰 수})^{\alpha}}$입니다(\`alpha=0\`이면 길이 정규화 없음).

두 함수 모두 \`(토큰 리스트(<s> 제외), 누적 로그확률)\`을 돌려줍니다. greedy 디코딩은 "나는 그냥 그냥…"을 반복하지만, 빔 너비 2의 빔 서치는 "오늘 밥을 먹었다"를 찾아야 합니다.
`,
      starter: py`
lm = {
    "<s>":   {"나는": 0.6, "오늘": 0.4},
    "나는":   {"그냥": 0.55, "밥을": 0.45},
    "오늘":   {"밥을": 0.95, "그냥": 0.05},
    "그냥":   {"그냥": 0.5, "<eos>": 0.5},
    "밥을":   {"먹었다": 0.9, "<eos>": 0.1},
    "먹었다": {"<eos>": 1.0},
}
import numpy as np

def greedy(lm, max_len=6):
    seq, logp = ["<s>"], 0.0
    for _ in range(max_len):
        if seq[-1] == "<eos>":
            break
        pass  # TODO: 확률이 가장 큰 다음 토큰을 붙이고 로그확률을 더합니다.
    return seq[1:], logp

def beam_search(lm, width=2, max_len=6, alpha=0.0):
    beams = [(["<s>"], 0.0)]
    for _ in range(max_len):
        cand = []
        for seq, lp in beams:
            pass  # TODO: <eos>로 끝났으면 그대로, 아니면 모든 다음 토큰으로 확장
        beams = sorted(cand, key=lambda x: -x[1])[:width]
    score = lambda b: b[1] / max(1, len(b[0]) - 1) ** alpha
    best = max(beams, key=score)
    return best[0][1:], best[1]

for name, (seq, lp) in [("greedy", greedy(lm)), ("beam(2)", beam_search(lm, 2))]:
    print(f"{name:8s} {' '.join(seq):22s} 전체 확률 = {np.exp(lp):.3f}")
`,
      tests: py`
lm = {
    "<s>":   {"나는": 0.6, "오늘": 0.4},
    "나는":   {"그냥": 0.55, "밥을": 0.45},
    "오늘":   {"밥을": 0.95, "그냥": 0.05},
    "그냥":   {"그냥": 0.5, "<eos>": 0.5},
    "밥을":   {"먹었다": 0.9, "<eos>": 0.1},
    "먹었다": {"<eos>": 1.0},
}
import numpy as np

@test("그리디는 '나는 그냥 그냥…'에 갇힌다(확률 ≈ 0.021)")
def _():
    seq, lp = greedy(lm)
    assert seq[:3] == ["나는", "그냥", "그냥"] and approx(np.exp(lp), 0.6 * 0.55 * 0.5 ** 4 if seq[-1] != "<eos>" else np.exp(lp), 1e-3), f"결과: {seq}, {np.exp(lp):.4f}"

@test("빔(2)은 '오늘 밥을 먹었다 <eos>'(확률 0.342)를 찾는다")
def _():
    seq, lp = beam_search(lm, 2)
    assert seq == ["오늘", "밥을", "먹었다", "<eos>"] and approx(np.exp(lp), 0.342), f"결과: {seq}, {np.exp(lp):.4f}"

@test("빔 너비 1은 그리디와 같은 첫 토큰들을 고른다")
def _():
    assert beam_search(lm, 1)[0][:3] == greedy(lm)[0][:3]

@test("<eos>로 끝난 후보는 더 확장하지 않는다")
def _():
    seq, _ = beam_search(lm, 3, max_len=10)
    assert seq.count("<eos>") == 1 and seq[-1] == "<eos>"
`,
      hints: ["그리디: `tok, p = max(lm[seq[-1]].items(), key=lambda kv: kv[1])` 다음 `seq.append(tok); logp += np.log(p)`", "빔 확장: `if seq[-1] == \"<eos>\": cand.append((seq, lp)); continue` 다음 `for tok, p in lm[seq[-1]].items(): cand.append((seq + [tok], lp + np.log(p)))`", "빔 서치는 매 단계 상위 width개를 남기므로, 첫 단계에서 덜 유망했던 '오늘'(0.4) 경로를 살려 둘 수 있습니다."],
      solution: py`
lm = {
    "<s>":   {"나는": 0.6, "오늘": 0.4},
    "나는":   {"그냥": 0.55, "밥을": 0.45},
    "오늘":   {"밥을": 0.95, "그냥": 0.05},
    "그냥":   {"그냥": 0.5, "<eos>": 0.5},
    "밥을":   {"먹었다": 0.9, "<eos>": 0.1},
    "먹었다": {"<eos>": 1.0},
}
import numpy as np

def greedy(lm, max_len=6):
    seq, logp = ["<s>"], 0.0
    for _ in range(max_len):
        if seq[-1] == "<eos>":
            break
        tok, p = max(lm[seq[-1]].items(), key=lambda kv: kv[1])
        seq.append(tok)
        logp += np.log(p)
    return seq[1:], logp

def beam_search(lm, width=2, max_len=6, alpha=0.0):
    beams = [(["<s>"], 0.0)]
    for _ in range(max_len):
        cand = []
        for seq, lp in beams:
            if seq[-1] == "<eos>":
                cand.append((seq, lp))
                continue
            for tok, p in lm[seq[-1]].items():
                cand.append((seq + [tok], lp + np.log(p)))
        beams = sorted(cand, key=lambda x: -x[1])[:width]
    score = lambda b: b[1] / max(1, len(b[0]) - 1) ** alpha
    best = max(beams, key=score)
    return best[0][1:], best[1]

for name, (seq, lp) in [("greedy", greedy(lm)), ("beam(2)", beam_search(lm, 2))]:
    print(f"{name:8s} {' '.join(seq):22s} 전체 확률 = {np.exp(lp):.3f}")
`,
    },
    {
      key: "ch2",
      title: "DPO 기울기를 유도하고 작은 정책을 직접 학습시키기",
      prompt: md`
응답 4개에 대한 정책을 logit $\theta$로 두고($\pi = \mathrm{softmax}(\theta)$) DPO로 학습합니다.

1. \`dpo_grad(z, beta)\`: $z$를 로그확률 비율의 차이라 할 때 손실 $-\log\sigma(\beta z)$를 $\log\pi(y_w)$와 $\log\pi(y_l)$로 미분한 값 \`(g_w, g_l)\`. $g_w = -\beta\,\sigma(-\beta z)$, $g_l = -g_w$입니다.
2. \`train_dpo(pi_ref, pairs, beta, lr, steps)\`: 선호 쌍 \`(w, l)\`들의 평균 DPO 손실로 $\theta$를 경사하강합니다. $\partial \log\pi_i / \partial\theta = e_i - \pi$(원핫 − 정책)를 쓰고, $\theta$는 $\log \pi_{ref}$에서 시작합니다. 학습된 정책 $\pi$를 돌려줍니다.

선호 데이터에는 사람 평가처럼 노이즈(25%는 반대 표시)가 섞여 있어 최적점이 유한합니다. 1등 응답의 확률이 커지고, $\beta$가 클수록 기준 모델에서 덜 멀어지는지(KL이 작은지) 확인합니다.
`,
      starter: py`
import numpy as np

def softmax(t):
    e = np.exp(t - t.max())
    return e / e.sum()

def dpo_grad(z, beta):
    return 0.0, 0.0  # TODO

def train_dpo(pi_ref, pairs, beta=0.1, lr=1.0, steps=500):
    log_ref = np.log(pi_ref)
    theta = log_ref.copy()
    for _ in range(steps):
        pi = softmax(theta)
        logpi = np.log(pi)
        grad = np.zeros_like(theta)
        for w, l in pairs:
            z = (logpi[w] - log_ref[w]) - (logpi[l] - log_ref[l])
            g_w, g_l = dpo_grad(z, beta)
            # TODO: grad에 g_w * (e_w - pi) + g_l * (e_l - pi)를 더합니다.
        theta -= lr * grad / len(pairs)
    return softmax(theta)

pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
pairs = []
for i in range(4):
    for j in range(i + 1, 4):
        pairs += [(i, j)] * 3 + [(j, i)]   # 평가의 25%는 반대로 표시된 노이즈
print(np.round(train_dpo(pi_ref, pairs, beta=0.5), 3), np.round(train_dpo(pi_ref, pairs, beta=2.0), 3))
`,
      tests: py`
import numpy as np
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
pairs = []
for i in range(4):
    for j in range(i + 1, 4):
        pairs += [(i, j)] * 3 + [(j, i)]   # 평가의 25%는 반대로 표시된 노이즈
kl = lambda p, q: float(np.sum(p * np.log(p / q)))

@test("dpo_grad가 수치미분과 일치한다")
def _():
    f = lambda z: -np.log(1 / (1 + np.exp(-0.5 * z)))
    g_w, g_l = dpo_grad(0.7, 0.5)
    num = (f(0.7 + 1e-6) - f(0.7 - 1e-6)) / 2e-6
    assert approx(g_w, num, 1e-6) and approx(g_l, -g_w)

@test("학습 후 확률 순서가 선호 순서(0 > 1 > 2 > 3)를 따른다")
def _():
    p = train_dpo(pi_ref, pairs, beta=0.5)
    assert approx(p.sum(), 1.0) and p[0] > p[1] > p[2] > p[3], f"결과: {np.round(p, 3)}"

@test("1등 응답 확률이 기준 모델(0.3)보다 커진다(β = 0.5에서 약 0.70)")
def _():
    p0 = train_dpo(pi_ref, pairs, beta=0.5)[0]
    assert approx(p0, 0.704, 0.01), f"결과: {p0:.3f}"

@test("β가 크면 기준 모델에서 덜 멀어진다(KL이 작다)")
def _():
    small = kl(train_dpo(pi_ref, pairs, beta=0.5), pi_ref)
    big = kl(train_dpo(pi_ref, pairs, beta=2.0), pi_ref)
    assert big < small / 5, f"KL: β=0.5 {small:.3f}, β=2.0 {big:.3f}"
`,
      hints: ["$\\frac{d}{dz}[-\\log\\sigma(\\beta z)] = -\\beta(1 - \\sigma(\\beta z)) = -\\beta\\sigma(-\\beta z)$. 코드로는 `g_w = -beta / (1 + np.exp(beta * z))`", "`e = np.eye(len(theta))`일 때 `grad += g_w * (e[w] - pi) + g_l * (e[l] - pi)`", "최적점에서는 암묵적 보상 $\\beta \\log(\\pi/\\pi_{ref})$이 선호 데이터에 맞춰지므로, $\\beta$가 클수록 같은 보상을 더 작은 $\\log(\\pi/\\pi_{ref})$로 표현해 기준 모델 근처에 머뭅니다."],
      solution: py`
import numpy as np

def softmax(t):
    e = np.exp(t - t.max())
    return e / e.sum()

def dpo_grad(z, beta):
    g_w = -beta / (1 + np.exp(beta * z))
    return g_w, -g_w

def train_dpo(pi_ref, pairs, beta=0.1, lr=1.0, steps=500):
    log_ref = np.log(pi_ref)
    theta = log_ref.copy()
    e = np.eye(len(theta))
    for _ in range(steps):
        pi = softmax(theta)
        logpi = np.log(pi)
        grad = np.zeros_like(theta)
        for w, l in pairs:
            z = (logpi[w] - log_ref[w]) - (logpi[l] - log_ref[l])
            g_w, g_l = dpo_grad(z, beta)
            grad += g_w * (e[w] - pi) + g_l * (e[l] - pi)
        theta -= lr * grad / len(pairs)
    return softmax(theta)

pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
pairs = []
for i in range(4):
    for j in range(i + 1, 4):
        pairs += [(i, j)] * 3 + [(j, i)]   # 평가의 25%는 반대로 표시된 노이즈
print(np.round(train_dpo(pi_ref, pairs, beta=0.5), 3), np.round(train_dpo(pi_ref, pairs, beta=2.0), 3))
`,
    },
  ],
  provideCourseDocs: true,
});
