import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "capstone",
  kind: "capstone",
  title: "캡스톤 프로젝트",
  summary: md`
앞선 트랙에서 배운 내용을 하나의 프로젝트로 묶습니다. 유형(A 구현형 · B 응용형 · C 분석형 · D 책임형)과 단계별 일정은 [[lesson:capstone-design]]을 참고합니다. 코드는 이 작업 공간에서 실행하며(NumPy, pandas, scikit-learn, matplotlib 사용 가능), 리포트·모델카드·발표 개요·성찰문도 모두 답안 칸에 작성합니다. 과정의 학습 자료는 모듈마다 파일 하나(\`/course/llm-systems.md\` 등, 확장 모듈 제외)로 읽을 수 있습니다.

마지막으로 **실행 환경 초기화** 후 **전체 실행**을 눌러 모든 셀이 처음부터 오류 없이 실행되는지 확인합니다.

**핵심** 항목 여섯 개는 필수 레슨만으로 완성할 수 있으며 이 항목들만 채점합니다. **보충**(서브그룹 감사와 편향 완화)과 **심화**(불확실성·프라이버시·드리프트 점검) 항목은 선택이며 점수 대신 피드백을 받습니다. 두 항목은 확장 모듈의 책임 있는 AI 레슨과 LLM 평가·드리프트의 통계 레슨을 바탕으로 합니다.
`,
  requirements: [
    "유형(A~D), 문제, 검증할 가설, 성공 기준(지표와 목표값), 데이터, 기준 모델(baseline)을 설계에 적는다.",
    "첫 코드 셀에서 시드를 고정해 출력하고, 기준 모델과 제안 방법을 같은 조건(같은 시드·같은 분할)에서 비교한다. 방법별 시드 점수를 `results = {\"baseline\": [...], \"제안 방법\": [...]}`처럼 모아 평균 ± 표준편차를 보고한다.",
    "리포트(문제 정의 · 방법 · 실험 설정 · 결과 · 한계와 실패 사례 · 책임 있는 AI · 참고문헌)를 작성하고, 실패 사례는 실제 출력이나 그래프를 근거로 든다.",
    "모델카드 여섯 항목(의도된 용도, 의도하지 않은 용도, 데이터 출처, 집단별 또는 유형별 성능, 한계, 윤리적 고려)을 빠짐없이 채운다.",
    "10분 발표 개요와 예상 질문 세 가지에 대한 답을 준비하고, 성찰문과 AI 전체 지도를 정리한다.",
    "마지막에 실행 환경 초기화 후 전체 실행으로 모든 셀이 오류 없이 재현되는지 확인한다.",
    "(보충) 캡스톤 모델의 집단별(또는 유형별) 성능 격차를 재고, 완화 방법 하나를 적용해 격차와 성능의 변화를 함께 보고한다.",
    "(심화) 결과의 불확실성(신뢰구간·짝지은 비교), 멤버십 추론 위험, 드리프트·라벨 드리프트 중 하나 이상을 정량적으로 점검한다.",
  ],
  tasks: [
    {
      id: "plan",
      title: "문제 정의와 설계",
      tier: "core",
      instructions: md`
프로젝트 유형, 풀려는 문제, 검증할 가설, 성공 기준(어떤 평가 데이터에서 어떤 지표가 얼마 이상이면 성공인지), 사용할 데이터와 기준 모델(baseline)을 적습니다. 주제 초안 단계에서 쓴 한 문단 계획서([[lesson:capstone-design]])를 고쳐 옮겨도 됩니다. 데이터는 scikit-learn 내장 데이터셋, 학습 자료 문서, 또는 코드 셀에 직접 붙여 넣은 작은 표(CSV 문자열) 등 이 작업 공간에서 읽을 수 있는 것을 사용합니다.
`,
      cells: [
        { kind: "text", id: "plan-answer", prompt: "프로젝트 설계를 작성해 주십시오.", minChars: 250, template: md`
- 유형: 
- 문제: 
- 가설: 
- 성공 기준: 
- 데이터: 
- 기준 모델(baseline):
` },
      ],
    },
    {
      id: "code",
      title: "구현과 실험",
      tier: "core",
      instructions: md`
프로젝트 코드를 작성합니다. 필요한 만큼 **+ 코드 셀 추가**로 셀을 늘리고, 셀 사이에 **+ 메모 추가**로 설명을 남깁니다. 다음을 지킵니다([[lesson:research-methods]]).

- 첫 셀에서 시드를 고정하고, 그 값을 출력합니다.
- 기준 모델과 제안 방법을 같은 조건(같은 분할, 같은 시드)에서 비교하고, 여러 시드의 평균과 표준편차를 보고합니다.
- 결과 표와 그래프는 셀 출력으로 남깁니다.
`,
      cells: [
        { kind: "code", id: "code-setup", label: "설정과 데이터 준비", starter: py`
import numpy as np
import random

SEED = 0
random.seed(SEED)
np.random.seed(SEED)
rng = np.random.default_rng(SEED)
print("SEED =", SEED)

# 데이터 준비 코드를 작성합니다.
` },
        { kind: "code", id: "code-experiment", label: "실험", starter: py`
# 기준 모델(baseline)과 제안 방법을 같은 조건에서 비교합니다.
` },
      ],
    },
    {
      id: "report",
      title: "리포트",
      tier: "core",
      instructions: md`
A4 3~5쪽 분량의 리포트를 작성합니다. 결과에는 기준 모델과의 비교를 포함하고, **한계와 실패 사례** 항목에는 실제 출력이나 그래프를 근거로 구체적인 사례를 적습니다. "시간이 부족해 하지 못했다" 수준의 문장은 실패 사례로 보지 않습니다. **책임 있는 AI 고려 사항** 항목에는 위험 점검표([[lesson:model-cards]])의 영역별 점검 결과를 적습니다.
`,
      cells: [
        { kind: "text", id: "report-answer", prompt: "리포트를 작성해 주십시오.", minChars: 1500, template: md`
## 1. 문제 정의


## 2. 방법


## 3. 실험 설정


## 4. 결과


## 5. 한계와 실패 사례


## 6. 책임 있는 AI 고려 사항


## 7. 참고문헌
` },
      ],
    },
    {
      id: "modelcard",
      title: "모델카드",
      tier: "core",
      instructions: md`
만든 모델이나 시스템에 대한 모델카드(또는 시스템카드)를 한 쪽 분량으로 작성합니다([[lesson:model-cards]]). 여섯 항목을 빠짐없이 채웁니다. 집단별 성능은 집단마다 표본 수와 같은 지표로 보고하며, 데이터에 집단 구분이 없다면 입력 유형별(예: 클래스별, 질문 난이도별) 성능으로 대신합니다.
`,
      cells: [
        { kind: "text", id: "modelcard-answer", prompt: "모델카드를 작성해 주십시오.", minChars: 600, template: md`
### 의도된 용도


### 의도하지 않은 용도


### 데이터 출처


### 집단별(또는 유형별) 성능


### 한계


### 윤리적 고려 사항
` },
      ],
    },
    {
      id: "presentation",
      title: "발표 개요",
      tier: "core",
      instructions: md`
10분 발표(문제 3분 · 방법 3분 · 결과 3분 · 한계와 교훈 1분)와 질의응답 5분을 준비합니다. 슬라이드별 핵심 메시지를 개요로 적고, 예상 질문 세 가지(왜 이 방법을 택했는가, 왜 이 지표를 썼는가, 실패하면 누가 피해를 보는가 등)에 대한 답을 준비합니다. 별도 슬라이드 파일은 선택 사항입니다.
`,
      cells: [
        { kind: "text", id: "presentation-answer", prompt: "발표 개요와 예상 질문·답변을 작성해 주십시오.", minChars: 400, template: md`
### 슬라이드 개요
1. 
2. 
3. 

### 예상 질문과 답변
- Q: 
  A:
` },
      ],
    },
    {
      id: "reflection",
      title: "성찰문",
      tier: "core",
      instructions: md`
과정을 시작할 때와 지금의 이해가 어떻게 달라졌는지 적고, 백지에서 다시 그린 "AI 전체 지도"(주요 개념과 그 관계)를 목록이나 표로 정리합니다. 과정 첫 모듈의 AI 지형도([[lesson:ai-landscape]])와 비교해 보면 달라진 점이 드러납니다. 앞으로의 학습 계획도 함께 적습니다. 아래 로드맵을 참고할 수 있습니다.

| 관심 분야 | 다음 단계 |
| --- | --- |
| 이론·연구 | [CS229](https://cs229.stanford.edu/), [CS224n](https://web.stanford.edu/class/cs224n/), [CS336](https://stanford-cs336.github.io/) 과제, 주 1편 논문 스터디 |
| 강화학습 | [Berkeley CS285](https://rail.eecs.berkeley.edu/deeprlcourse/), [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit0/introduction) |
| LLM 엔지니어링 | 미세조정(LoRA·[PEFT](https://huggingface.co/docs/peft/index)), 서빙([vLLM](https://docs.vllm.ai/)), 평가, 에이전트 프레임워크 |
| 비전·멀티모달 | [CS231n](https://cs231n.github.io/) 과제, CLIP·확산 모델 |
| 정책·윤리 | [Stanford HAI](https://hai.stanford.edu/), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) |
`,
      cells: [
        { kind: "text", id: "reflection-answer", prompt: "성찰문과 AI 전체 지도, 앞으로의 학습 계획을 작성해 주십시오.", minChars: 500, template: md`
### 과정을 시작할 때와 지금


### AI 전체 지도


### 앞으로의 학습 계획
` },
      ],
    },
    {
      id: "audit",
      title: "보충: 서브그룹 감사와 편향 완화 실험",
      tier: "supplement",
      instructions: md`
캡스톤 모델(또는 시스템)의 성능을 집단별로 나눠 봅니다([[lesson:fairness]]). 데이터에 집단 구분이 없다면 입력 유형별(클래스, 질문 난이도, 문서 출처 등)로 나눕니다. 집단마다 표본 수와 함께 정확도(분류라면 선택률·TPR·FPR도)를 표로 보고하고, 가장 큰 격차를 하나 고릅니다.

이어서 [[lesson:bias-mitigation]]의 방법 하나(재가중, 학습 중 벌점, 집단별 임계값, 부족한 유형의 데이터 보강 등)를 적용해 **격차와 전체 성능이 함께** 어떻게 변하는지 비교합니다. 표본이 적은 집단의 수치가 얼마나 흔들릴 수 있는지(윌슨 구간, [[lesson:eval-statistics]])도 함께 적으면 좋습니다. 점수에는 들어가지 않습니다.
`,
      cells: [
        { kind: "code", id: "audit-code", label: "집단별 성능과 완화 실험", starter: py`
# 집단(또는 유형)별 표본 수와 지표를 표로 출력하고, 완화 전후를 비교합니다.
` },
        { kind: "text", id: "audit-answer", prompt: "집단별 성능 표, 고른 격차와 그 원인에 대한 가설, 적용한 완화 방법과 전후 비교, 그 대가를 정리해 주십시오." },
      ],
    },
    {
      id: "advanced",
      title: "심화: 결과의 불확실성 · 프라이버시 · 드리프트 점검",
      tier: "advanced",
      instructions: md`
다음 중 하나 이상을 골라 캡스톤에 적용합니다. 점수에는 들어가지 않습니다.

- **결과의 불확실성:** 핵심 지표에 부트스트랩이나 윌슨 신뢰구간을 붙이고, 기준 모델과 제안 방법을 같은 시드·같은 문항으로 짝지어 비교합니다(순열 검정, McNemar, 짝지은 부트스트랩 중 하나, [[lesson:eval-statistics]]). 여러 설정 중 최고를 골랐다면 개발용과 보고용 데이터를 나눠 선택 편향을 확인합니다. 심화 문제 「부트스트랩 신뢰구간으로 캡스톤 결과의 불확실성 보고하기」를 그대로 활용할 수 있습니다.
- **프라이버시:** 학습 데이터와 학습에 쓰지 않은 데이터에서 모델의 확신도를 비교해 멤버십 추론 공격의 이득(TPR − FPR)을 재고, 규제 강도나 모델 크기를 바꿔 그 이득과 성능이 어떻게 변하는지 봅니다([[lesson:privacy-math]]).
- **드리프트:** 캡스톤 데이터를 시간·출처 등으로 나눠 "학습"과 "운영"으로 삼고 특성별 PSI를 잽니다. 운영 표본 크기에서 드리프트가 없을 때의 PSI와 비교하고, 라벨 비율이 달라졌다면 BBSE로 라벨 없이 추정해 실제 값과 비교합니다([[lesson:drift-statistics]]).
- **공정성의 한계:** 집단별 기저율과 PPV·FNR·FPR을 재어 Chouldechova 항등식이 맞는지 확인하고, 어떤 공정성 기준을 택할지와 그 비용을 정리합니다([[lesson:fairness-impossibility]]).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 심화 점검을 이 셀에서 진행합니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 점검했고 어떤 결과를 얻었는지, 그 결과가 캡스톤의 결론을 어떻게 바꾸거나 뒷받침하는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "problem", label: "문제 정의와 설계", points: 1.5, guide: "가설과 성공 기준이 명확하고, 데이터와 기준 모델이 문제에 맞습니다." },
    { id: "depth", label: "기술적 깊이", points: 2.5, guide: "핵심 부분을 직접 구현하거나 분석했으며, 사용한 도구의 동작을 이해하고 있습니다." },
    { id: "rigor", label: "실험과 평가의 엄밀성", points: 2.5, guide: "기준 모델과의 비교, 여러 지표, 여러 시드의 평균·표준편차 등으로 결론을 뒷받침했습니다." },
    { id: "responsible", label: "책임 있는 AI와 한계", points: 1.5, guide: "구체적인 위험과 실패 사례를 근거와 함께 분석하고, 모델카드를 빠짐없이 작성했습니다." },
    { id: "reproducible", label: "재현성과 문서화", points: 1, guide: "초기화 후 전체 실행으로 모든 셀이 오류 없이 재현되고, 설명이 충분합니다." },
    { id: "communication", label: "발표와 소통", points: 1, guide: "발표 개요가 시간 배분에 맞고 핵심이 분명하며, 예상 질문에 대한 답이 준비되어 있습니다." },
  ],
  gradingNotes: md`
- 결과의 크기보다 무엇을 확인했고 무엇이 실패했는지를 그대로 보고했는지에 비중을 둔다.
- 실행 환경을 초기화한 뒤 전체 실행으로 재현되지 않으면 "재현성과 문서화" 항목은 최대 0.5점으로 제한한다.
- 기준 모델(baseline) 없는 비교는 "실험과 평가의 엄밀성" 항목에서 1점 이하로 채점한다.
- 모델카드의 여섯 항목 중 빠진 것이 있으면 "책임 있는 AI와 한계" 항목에서 감점한다.
- (채점 외) 집단별 격차를 표본 수와 함께 보고하고 완화의 대가까지 적었거나, 신뢰구간·짝지은 비교·멤버십 추론·드리프트 점검으로 결론의 불확실성과 위험을 정량화했다면 피드백에서 언급한다.
`,
  maxScore: 10,
  autoTests: [
    { id: "w8-at-seed", taskId: "code", title: "첫 셀에서 정수 SEED와 그 시드로 만든 난수 생성기 rng를 정의했다", hint: "「설정과 데이터 준비」 셀의 SEED·rng 줄을 지우지 말고 먼저 실행하십시오.", code: py`
import numpy as np
assert isinstance(SEED, int), "첫 셀에서 SEED를 정수로 정하십시오."
assert isinstance(rng, np.random.Generator), "rng = np.random.default_rng(SEED)를 만드십시오."
` },
    { id: "w8-at-results", taskId: "code", title: "results: baseline 포함 2개 이상의 방법, 방법마다 같은 개수(3개 이상)의 시드 점수", hint: "실험 셀 끝에서 `results = {\"baseline\": baseline_scores, \"제안 방법\": proposed_scores}`처럼 시드별 점수 리스트를 모읍니다. 이름은 자유지만 baseline 키는 하나 있어야 합니다.", code: py`
import math
assert isinstance(results, dict) and len(results) >= 2, "results = {'baseline': [...], '제안 방법': [...]}처럼 방법별 시드 점수 리스트를 모으십시오."
assert any("baseline" in str(k).lower() or "기준" in str(k) for k in results), "baseline(또는 '기준')이 들어간 키가 필요합니다."
lens = {k: len(v) for k, v in results.items()}
assert min(lens.values()) >= 3, f"방법마다 시드 3개 이상의 점수가 필요합니다: {lens}"
assert len(set(lens.values())) == 1, f"모든 방법을 같은 시드들로 비교하십시오: {lens}"
assert all(math.isfinite(float(x)) for v in results.values() for x in v), "점수에 숫자가 아닌 값이나 nan이 있습니다."
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "적대적 학습으로 FGSM에 강한 분류기 만들기",
      prompt: md`
숫자 3과 8을 구별하는 로지스틱 회귀를 NumPy 경사하강으로 직접 학습시키고, FGSM에 대한 강건성을 높입니다([[lesson:adversarial-examples]]).

1. \`fgsm(w, b, X, y, eps)\`: 모델 $(w, b)$에 대한 FGSM 예제. $p = \sigma(Xw + b)$, $x' = \mathrm{clip}(x + \varepsilon\,\mathrm{sign}((p - y)\,w), 0, 1)$
2. \`train(X, y, adv_eps=0.0, epochs=300, lr=0.5, l2=1e-3)\`: 0에서 시작해 교차 엔트로피 + L2로 \`epochs\`번 경사하강하고 \`(w, b)\`를 돌려줍니다. \`adv_eps > 0\`이면 매 epoch마다 **현재 모델**로 만든 FGSM 예제를 원본과 함께 학습합니다(적대적 학습).
3. \`logit_shift(w, eps)\`: 클리핑이 없을 때 FGSM이 logit을 최대 얼마나 움직이는지. 선형 모델에서는 $\varepsilon\,\lVert w \rVert_1$입니다.

적대적 학습이 강건 정확도를 높이는 방식이 $\lVert w \rVert_1$과 어떤 관계인지 확인하십시오.
`,
      starter: py`
import numpy as np
from sklearn.datasets import load_digits

d = load_digits()
m = np.isin(d.target, [3, 8])
X, y = d.data[m] / 16.0, (d.target[m] == 8).astype(float)
idx = np.random.default_rng(0).permutation(len(X))
Xtr, ytr, Xte, yte = X[idx[:250]], y[idx[:250]], X[idx[250:]], y[idx[250:]]
sig = lambda z: 1 / (1 + np.exp(-z))
acc = lambda w, b, X, y: float(np.mean((sig(X @ w + b) >= 0.5) == y))

def fgsm(w, b, X, y, eps):
    return X  # TODO

def train(X, y, adv_eps=0.0, epochs=300, lr=0.5, l2=1e-3):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        Xb, yb = X, y
        # TODO: adv_eps > 0이면 현재 (w, b)로 만든 FGSM 예제를 원본에 이어 붙입니다.
        p = sig(Xb @ w + b)
        # TODO: w, b를 교차 엔트로피 + L2 기울기로 갱신합니다.
    return w, b

def logit_shift(w, eps):
    return 0.0  # TODO

for name, ae in [("일반 학습", 0.0), ("적대적 학습", 0.1)]:
    w, b = train(Xtr, ytr, adv_eps=ae)
    print(f"{name}: 깨끗한 정확도 {acc(w, b, Xte, yte):.3f}, ε=0.1 FGSM 정확도 {acc(w, b, fgsm(w, b, Xte, yte, 0.1), yte):.3f}, ‖w‖₁ = {np.abs(w).sum():.1f}")
`,
      tests: py`
import numpy as np
from sklearn.datasets import load_digits

d = load_digits()
m = np.isin(d.target, [3, 8])
X, y = d.data[m] / 16.0, (d.target[m] == 8).astype(float)
idx = np.random.default_rng(0).permutation(len(X))
Xtr, ytr, Xte, yte = X[idx[:250]], y[idx[:250]], X[idx[250:]], y[idx[250:]]
sig = lambda z: 1 / (1 + np.exp(-z))
acc = lambda w, b, X, y: float(np.mean((sig(X @ w + b) >= 0.5) == y))

@test("일반 학습: 깨끗한 정확도 0.97 이상, ε = 0.1 FGSM에서는 0.8 미만")
def _():
    w, b = train(Xtr, ytr)
    clean, robust = acc(w, b, Xte, yte), acc(w, b, fgsm(w, b, Xte, yte, 0.1), yte)
    assert clean >= 0.97 and robust < 0.8, (clean, robust)

@test("적대적 학습: 강건 정확도가 0.1 이상 오르고 깨끗한 정확도는 0.95 이상 유지")
def _():
    w0, b0 = train(Xtr, ytr)
    w1, b1 = train(Xtr, ytr, adv_eps=0.1)
    r0, r1 = acc(w0, b0, fgsm(w0, b0, Xte, yte, 0.1), yte), acc(w1, b1, fgsm(w1, b1, Xte, yte, 0.1), yte)
    assert r1 >= r0 + 0.1 and acc(w1, b1, Xte, yte) >= 0.95, (r0, r1)

@test("FGSM의 logit 변화 = ε‖w‖₁(클리핑 없을 때), 적대적 학습은 ‖w‖₁을 줄인다")
def _():
    rng = np.random.default_rng(3)
    w, b = rng.normal(size=64), 0.1
    x = np.full((1, 64), 0.5)
    xa = np.clip(x + 0.01 * np.sign((sig(x @ w + b) - 1.0)[:, None] * w), 0, 1)
    assert approx(abs((xa @ w - x @ w)[0]), logit_shift(w, 0.01)), (abs((xa @ w - x @ w)[0]), logit_shift(w, 0.01))
    w0, _ = train(Xtr, ytr)
    w1, _ = train(Xtr, ytr, adv_eps=0.1)
    assert np.abs(w1).sum() < np.abs(w0).sum(), (np.abs(w0).sum(), np.abs(w1).sum())
`,
      hints: ["`p = sig(X @ w + b)`, `return np.clip(X + eps * np.sign((p - y)[:, None] * w[None, :]), 0, 1)`", "적대적 학습은 `Xb = np.vstack([X, fgsm(w, b, X, y, adv_eps)])`, `yb = np.concatenate([y, y])`. 갱신은 `w -= lr * (Xb.T @ (p - yb) / len(yb) + l2 * w)`, `b -= lr * np.mean(p - yb)`", "FGSM은 모든 픽셀을 $\\varepsilon$씩 $w$의 부호 방향으로 밀므로 logit 변화는 $\\sum_j \\varepsilon |w_j| = \\varepsilon\\,\\lVert w \\rVert_1$입니다. 적대적 학습은 이 최악의 변화를 견디도록 $\\lVert w \\rVert_1$을 줄이는 쪽으로 학습됩니다."],
      solution: py`
import numpy as np
from sklearn.datasets import load_digits

d = load_digits()
m = np.isin(d.target, [3, 8])
X, y = d.data[m] / 16.0, (d.target[m] == 8).astype(float)
idx = np.random.default_rng(0).permutation(len(X))
Xtr, ytr, Xte, yte = X[idx[:250]], y[idx[:250]], X[idx[250:]], y[idx[250:]]
sig = lambda z: 1 / (1 + np.exp(-z))
acc = lambda w, b, X, y: float(np.mean((sig(X @ w + b) >= 0.5) == y))

def fgsm(w, b, X, y, eps):
    p = sig(X @ w + b)
    return np.clip(X + eps * np.sign((p - y)[:, None] * w[None, :]), 0, 1)

def train(X, y, adv_eps=0.0, epochs=300, lr=0.5, l2=1e-3):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        Xb, yb = X, y
        if adv_eps > 0:
            Xb = np.vstack([X, fgsm(w, b, X, y, adv_eps)])
            yb = np.concatenate([y, y])
        p = sig(Xb @ w + b)
        w = w - lr * (Xb.T @ (p - yb) / len(yb) + l2 * w)
        b = b - lr * np.mean(p - yb)
    return w, b

def logit_shift(w, eps):
    return eps * float(np.abs(w).sum())

for name, ae in [("일반 학습", 0.0), ("적대적 학습", 0.1)]:
    w, b = train(Xtr, ytr, adv_eps=ae)
    print(f"{name}: 깨끗한 정확도 {acc(w, b, Xte, yte):.3f}, ε=0.1 FGSM 정확도 {acc(w, b, fgsm(w, b, Xte, yte, 0.1), yte):.3f}, ‖w‖₁ = {np.abs(w).sum():.1f}")
`,
    },
    {
      key: "ch2",
      title: "부트스트랩 신뢰구간으로 캡스톤 결과의 불확실성 보고하기",
      prompt: md`
캡스톤 리포트의 "정확도 0.75"에는 얼마만큼의 불확실성이 있을까요? 문항별 정답 여부(0/1)를 복원추출로 다시 뽑는 **부트스트랩**으로 신뢰구간을 구합니다.

1. \`bootstrap_ci(correct, n_boot=2000, alpha=0.05, seed=0)\`: 문항 인덱스를 \`len(correct)\`개 복원추출해 평균을 \`n_boot\`번 구하고, 백분위수 $100\cdot\alpha/2$, $100\cdot(1-\alpha/2)$로 \`(lo, hi)\`를 돌려줍니다.
2. \`paired_bootstrap_diff(v1, v2, n_boot=2000, alpha=0.05, seed=0)\`: 두 시스템이 같은 문항을 풀었으므로 **같은 인덱스**로 함께 복원추출해 정확도 차이(v2 − v1)의 \`(관측 차이, lo, hi)\`를 돌려줍니다.

골든셋 20문항에서 정확도가 0.75에서 0.85로 오른 회귀 테스트 결과가, 20문항으로는 확신할 수 없는 차이라는 것을 신뢰구간으로 확인합니다([[lesson:eval-statistics]]).
`,
      starter: py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])    # 회귀 테스트 20문항의 문항별 정답 여부 (변경 전)
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])    # 변경 후

def bootstrap_ci(correct, n_boot=2000, alpha=0.05, seed=0):
    m = float(np.mean(correct))
    return m, m  # TODO

def paired_bootstrap_diff(v1, v2, n_boot=2000, alpha=0.05, seed=0):
    d = float(np.mean(v2) - np.mean(v1))
    return d, d, d  # TODO: 같은 인덱스로 v1, v2를 함께 뽑습니다.

print("v1 정확도 95% CI:", np.round(bootstrap_ci(v1), 3))
print("v2 - v1 차이와 95% CI:", np.round(paired_bootstrap_diff(v1, v2), 3))
`,
      tests: py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])    # 회귀 테스트 20문항의 문항별 정답 여부 (변경 전)
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])    # 변경 후

@test("20문항 정확도 0.75의 95% CI는 0.75를 포함하고 폭이 0.25 이상")
def _():
    lo, hi = bootstrap_ci(v1)
    assert lo < 0.75 < hi and hi - lo > 0.25, (lo, hi)

@test("문항이 2,000개면 같은 정확도라도 CI 폭이 0.06 미만")
def _():
    big = np.tile(v1, 100)
    lo, hi = bootstrap_ci(big)
    assert lo < 0.75 < hi and hi - lo < 0.06, (lo, hi)

@test("같은 시드면 같은 구간(재현성)")
def _():
    assert tuple(bootstrap_ci(v1, seed=5)) == tuple(bootstrap_ci(v1, seed=5))

@test("v1 → v2 차이 0.10의 95% CI는 0을 포함하고, 200문항에서 30개 개선·2개 회귀면 0을 넘는다")
def _():
    d, lo, hi = paired_bootstrap_diff(v1, v2)
    assert approx(d, 0.10) and lo < 0 < hi, (d, lo, hi)
    a = np.array([0] * 30 + [1] * 2 + [1] * 150 + [0] * 18)
    b = np.array([1] * 30 + [0] * 2 + [1] * 150 + [0] * 18)
    d2, lo2, hi2 = paired_bootstrap_diff(a, b)
    assert approx(d2, 0.14) and lo2 > 0, (d2, lo2, hi2)
`,
      hints: ["`rng = np.random.default_rng(seed)`, `idx = rng.integers(0, n, size=(n_boot, n))`, `means = np.asarray(correct)[idx].mean(axis=1)`", "`lo, hi = np.percentile(means, [100 * alpha / 2, 100 * (1 - alpha / 2)])`", "짝지은 부트스트랩은 같은 `idx`로 `np.asarray(v2)[idx].mean(axis=1) - np.asarray(v1)[idx].mean(axis=1)`을 구합니다. 문항 난이도를 공유하므로 두 시스템을 따로 뽑을 때보다 구간이 좁아집니다."],
      solution: py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])    # 회귀 테스트 20문항의 문항별 정답 여부 (변경 전)
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])    # 변경 후

def bootstrap_ci(correct, n_boot=2000, alpha=0.05, seed=0):
    correct = np.asarray(correct)
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(correct), size=(n_boot, len(correct)))
    means = correct[idx].mean(axis=1)
    lo, hi = np.percentile(means, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(lo), float(hi)

def paired_bootstrap_diff(v1, v2, n_boot=2000, alpha=0.05, seed=0):
    v1, v2 = np.asarray(v1), np.asarray(v2)
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(v1), size=(n_boot, len(v1)))
    diffs = v2[idx].mean(axis=1) - v1[idx].mean(axis=1)
    lo, hi = np.percentile(diffs, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(v2.mean() - v1.mean()), float(lo), float(hi)

print("v1 정확도 95% CI:", np.round(bootstrap_ci(v1), 3))
print("v2 - v1 차이와 95% CI:", np.round(paired_bootstrap_diff(v1, v2), 3))
`,
    },
  ],
  provideCourseDocs: true,
});
