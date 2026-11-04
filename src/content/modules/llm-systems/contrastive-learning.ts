import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/contrastive-learning";

export default defineLesson({
  id: "contrastive-learning",
  title: "대조 학습의 수학: InfoNCE, 온도, 배치 크기",
  tier: "advanced",
  goal: "InfoNCE를 $N$지선다 cross-entropy로 쓰고, 초기 손실 $\\ln N$, 로짓 기울기 $P - I$와 벡터에 대한 기울기의 방향, 온도가 어려운 오답에 대한 기울기의 집중도를 조절하는 원리, 배치 크기와 상호정보량 하한 $\\ln N - \\mathcal{L}$의 관계를 유도한다.",
  why: "검색에 쓰는 텍스트 임베딩 모델과 CLIP 같은 이미지-텍스트 모델은 대조 학습으로 학습한다. 배치 크기, 온도, 어려운 오답을 어떻게 정하는지에 따라 임베딩의 품질이 달라지므로, 이 설정을 판단하려면 InfoNCE 손실과 그 기울기를 알아야 한다.",
  body: md`
[[lesson:multimodal]]의 CLIP 예제는 기울기 \`G = ((Pi - I) + (Pt - I)) / (2N)\`을 결과로만 썼다. [[lesson:retrieval]]에서 의미가 비슷한 문장의 벡터 방향이 비슷해지도록 학습한다고 설명한 텍스트 임베딩 모델도 같은 손실로 학습한다. 이 레슨은 그 손실이 무엇을 최적화하는지 유도한다. 손실이 왜 $\ln N$에서 출발하는지, 기울기가 왜 어려운 오답에 집중하는지, 온도와 배치 크기가 무엇을 바꾸는지를 차례로 증명한다.

### 대조 손실은 $N$지선다 분류다

배치에 짝지어진 $(u_i, v_i)$가 $N$쌍 있다. $u_i$는 이미지(또는 질문) 벡터, $v_i$는 그 짝인 캡션(또는 정답 문서) 벡터이고 모두 길이 1로 정규화되어 있다. 온도 $\tau$로 나눈 유사도 $s_{ij} = u_i \cdot v_j / \tau$를 모으면 $N \times N$ 행렬이 된다. 행 $i$만 보면 이것은 "이미지 $i$의 짝은 캡션 $N$개 중 무엇인가"를 맞히는 $N$지선다 분류이고, 로짓이 $s_{i1}, \dots, s_{iN}$이고 정답 클래스가 $i$인 cross-entropy를 쓴다.

\`\`\`math
\ell_i = -\log \dfrac{e^{s_{ii}}}{\sum_{j} e^{s_{ij}}} = -s_{ii} + \log \sum_{j} e^{s_{ij}}
\`\`\`

이것이 **InfoNCE** 손실이다(Oord et al., 2018). 배치의 다른 캡션 $N-1$개가 따로 수집할 필요 없는 오답(negative)이 되므로 "in-batch negatives"라고도 부른다. CLIP은 이미지 $\to$ 캡션 방향(행 softmax)과 캡션 $\to$ 이미지 방향(열 softmax)의 손실을 모두 구해 평균 낸다. softmax 회귀의 cross-entropy([[lesson:logistic-regression]])와 같은 식이며, 정답 라벨이 같은 쌍에서 왔다는 사실로 정해지므로 라벨을 따로 만들 필요가 없다는 점만 다르다.

출발점도 바로 계산된다. 학습 전처럼 모든 $s_{ij}$가 같으면 softmax는 $1/N$씩 균등하므로 $\ell_i = \ln N$이다. 대조 손실의 크기는 배치 크기에 따라 달라지므로, 배치 크기가 다른 실험끼리 손실 값을 그대로 비교하면 안 된다.

손실의 출발점 $\ln N$과 아래에서 유도할 기울기 $P - I$를 코드로 먼저 확인해 두자. 마지막 두 줄은 해석적 기울기와 수치 미분(로짓을 아주 조금 바꿔 손실 변화를 잰 값)을 비교한다.

\`\`\`python
import numpy as np

def softmax(S):
    E = np.exp(S - S.max(1, keepdims=True))
    return E / E.sum(1, keepdims=True)

def infonce(U, V, tau):
    S = U @ V.T / tau                          # (N, N) 유사도 행렬, 대각선이 정답 짝
    P = softmax(S)
    loss = -np.log(np.diag(P)).mean()
    return loss, P, S

rng = np.random.default_rng(0)
N, d = 8, 16
for name in ["학습 전(모두 같은 유사도)", "학습 후(짝끼리 비슷)"]:
    if name.startswith("학습 전"):
        U = V = np.ones((N, d)) / np.sqrt(d)
    else:
        base = rng.normal(size=(N, d))
        U = base + 0.3 * rng.normal(size=(N, d)); V = base + 0.3 * rng.normal(size=(N, d))
        U /= np.linalg.norm(U, axis=1, keepdims=True); V /= np.linalg.norm(V, axis=1, keepdims=True)
    loss, P, S = infonce(U, V, tau=0.1)
    print(f"{name}: 손실 {loss:.3f}  (ln N = {np.log(N):.3f})")

# 로짓 기울기 = P − I 를 수치 미분으로 확인 (행 0의 손실만)
G = P[0] - np.eye(N)[0]
eps, num = 1e-6, []
for j in range(N):
    S2 = S.copy(); S2[0, j] += eps
    l1 = -np.log(softmax(S2)[0, 0]); l0 = -np.log(softmax(S)[0, 0])
    num.append((l1 - l0) / eps)
print("해석적 기울기 P − I:", G.round(4))
print("수치 미분        :", np.array(num).round(4))
\`\`\`

모든 유사도가 같으면 손실이 정확히 $\ln 8 \approx 2.079$이고, 짝끼리 비슷해지면 0에 가까워진다. 기울기의 정답 칸은 음수($P_{00} - 1$), 오답 칸은 그 칸의 확률 $P_{0j}$ 그대로이며 수치 미분과 소수 넷째 자리까지 일치한다. 오답 칸 중에서도 확률이 큰 칸(정답과 헷갈리는 오답)의 기울기가 크다.

[[diagram:infonce-matrix]]

### 기울기: 정답의 유사도는 높이고, 오답의 유사도는 확률만큼 낮춘다

$P_{ij} = e^{s_{ij}} / \sum_k e^{s_{ik}}$라 쓰면, softmax와 cross-entropy를 로짓으로 미분한 값은 예측 확률에서 원핫을 뺀 값이다.

\`\`\`math
\dfrac{\partial \ell_i}{\partial s_{ij}} = P_{ij} - \mathbb{1}[i = j]
\`\`\`

배치 평균과 두 방향의 평균을 취하면 $G = \big((P^{\text{행}} - I) + (P^{\text{열}} - I)\big) / (2N)$이 되어 작은 CLIP의 코드 한 줄과 같다. 대각선은 $P_{ii} - 1 < 0$이므로 경사하강이 정답 짝의 유사도를 높이고, 나머지는 $P_{ij} > 0$이므로 낮춘다. 연쇄법칙으로 벡터에 대한 기울기를 구하면 다음과 같다(행 방향만 쓸 때).

\`\`\`math
\dfrac{\partial \ell_i}{\partial u_i} = \dfrac{1}{\tau}\Big(\sum_{j} P_{ij}\, v_j - v_i\Big)
\`\`\`

경사하강은 $u_i$를 짝 $v_i$의 방향으로 이동시키고, 모든 캡션을 $P_{ij}$로 가중 평균한 방향과는 반대로 이동시킨다. 유사도가 이미 낮은 쉬운 오답은 $P_{ij} \approx 0$이므로 기울기에 거의 기여하지 않고, 정답과 헷갈리는 **어려운 오답**(hard negative)이 오답 쪽 기울기의 대부분을 차지한다. 따라서 대조 학습은 별도의 선택 과정 없이 어려운 오답의 유사도를 주로 낮춘다.

### 온도: 어려운 오답에 얼마나 집중할 것인가

온도 $\tau$는 로짓의 배율이다. $\tau$가 작으면 softmax의 확률이 큰 값에 집중되어 오답 쪽 기울기가 가장 어려운 오답 한두 개에 집중되고, $\tau$가 크면 여러 오답에 고르게 나뉜다. $\tau$가 너무 작으면 학습이 불안정해지고, 배치 안에 실제로는 짝과 같은 뜻인 캡션(예: 비슷한 강아지 사진 두 장의 캡션)이 있을 때 그 유사도를 크게 낮추는 **거짓 오답**(false negative) 문제가 커진다. $\tau$가 너무 크면 정답과 오답을 구별하는 신호가 약해진다. CLIP은 $\tau$를 아예 학습하는 파라미터로 두었다(0.07에서 시작하고, 로짓 배율 $1/\tau$가 100을 넘지 않게 제한).

[[diagram:temperature-focus]]

### 배치 크기와 정보량의 상한

InfoNCE에는 정보 이론적 해석이 있다. 짝지은 두 변수의 상호정보량 $I(U; V)$에 대해 다음 하한이 성립한다(Oord et al., 2018; Poole et al., 2019).

\`\`\`math
I(U; V) \ge \ln N - \mathcal{L}_{\text{InfoNCE}}
\`\`\`

손실을 줄이는 것은 상호정보량의 하한을 올리는 것이다. 그런데 손실은 0 아래로 내려갈 수 없으므로, 배치 크기 $N$으로 확인할 수 있는 정보량은 최대 $\ln N$ nats다. 배치 32개로는 약 3.47 nats가 한계이고, CLIP이 쓴 배치 32,768개는 약 10.4 nats다. 큰 배치가 중요한 실질적인 이유는 오답이 많아질수록 그중에 어려운 오답이 섞일 확률도 커지기 때문이다. 대신 유사도 행렬이 $N^2$개(배치 32,768이면 약 $1.07 \times 10^9$개)라, CLIP은 이 행렬을 여러 GPU에 나눠 계산했다. 이 하한은 느슨해서 실제 상호정보량을 정확히 추정하지는 못한다.

[[diagram:infonce-bound]]

### 같은 손실로 학습하는 검색 임베딩

질문 인코더와 문서 인코더를 따로 두고 (질문, 정답 문서) 쌍을 대조 학습시키면 Dense 검색용 임베딩 모델이 된다. DPR(Karpukhin et al., 2020)은 in-batch negatives에 더해, BM25가 높은 순위로 뽑았지만 정답은 담지 않은 문서를 어려운 오답으로 추가해 성능을 크게 올렸다. [[lesson:retrieval]]의 Sparse 검색과 Dense 검색이 서로 보완하는 관계를 학습 단계에서도 쓰는 것이다. 이때도 거짓 오답이 문제가 된다. 같은 질문에 답이 되는 문서가 여러 개일 수 있으므로, 실무에서는 중복을 제거하고 재순위화 모델로 "오답 후보가 사실 정답은 아닌지" 걸러 낸다.
`,
  checks: [
    {
      key: "c1",
      question: "배치 크기 $N = 64$에서 모든 유사도가 같을 때 행 방향 InfoNCE 손실은?",
      choices: ["$0$", "$\\ln 64 \\approx 4.16$", "$64$", "$1/64$"],
      answer: 1,
      explanation: "softmax가 $1/64$씩 균등하므로 $-\\ln(1/64) = \\ln 64$다. 손실의 크기가 배치 크기에 달려 있으므로 배치가 다른 실험끼리 손실 값을 그대로 비교하면 안 된다.",
    },
    {
      key: "c2",
      question: "행 방향 손실 $\\ell_i$를 오답 칸의 로짓 $s_{ij}$($j \\neq i$)로 미분한 값은?",
      choices: ["$P_{ij} - 1$", "$P_{ij}$", "$-P_{ij}$", "$0$"],
      answer: 1,
      explanation: "softmax + cross-entropy의 기울기는 '확률 − 원핫'이고 오답 칸의 원핫은 0이다. 경사하강은 그 유사도를 $P_{ij}$에 비례해 낮추므로, 확률이 큰(헷갈리는) 오답일수록 유사도가 크게 낮아진다.",
    },
    {
      key: "c3",
      question: "온도 $\\tau$를 크게 낮출 때 일어나는 일로 옳은 것은?",
      choices: ["모든 오답의 유사도를 같은 정도로 낮춘다", "오답 쪽 기울기가 가장 어려운 오답에 집중되고, 그 오답이 사실 짝과 같은 뜻(거짓 오답)이면 그 유사도를 잘못 크게 낮춘다", "손실이 항상 $\\ln N$이 된다", "배치 크기가 커진다"],
      answer: 1,
      explanation: "본문 그림의 예에서 어려운 오답의 몫은 $\\tau = 1$에서 39%, $0.1$에서 99.2%였다. CLIP은 $\\tau$를 학습 파라미터로 두고 로짓 배율을 100 이하로 제한했다.",
    },
    {
      key: "c4",
      question: "배치 크기 $N = 1024$로 InfoNCE를 학습할 때, 하한 $\\ln N - \\mathcal{L}$로 확인할 수 있는 상호정보량의 최댓값은?",
      choices: ["약 6.93 nats", "1024 nats", "약 10.4 nats", "약 3.47 nats"],
      answer: 0,
      explanation: "손실은 0 아래로 내려가지 않으므로 하한은 최대 $\\ln 1024 \\approx 6.93$ nats다. 배치 32면 약 3.47, 32,768이면 약 10.4다.",
    },
    {
      key: "c5",
      question: "행 방향 softmax에서 정답 칸의 확률이 $P_{ii} = 0.9$일 때, 손실 $\\ell_i$를 정답 로짓 $s_{ii}$로 미분한 값은?",
      choices: ["$-0.1$", "$0.9$", "$-0.9$", "$0.1$"],
      answer: 0,
      explanation: "$\\partial \\ell_i / \\partial s_{ii} = P_{ii} - 1 = -0.1$이다. 음수이므로 경사하강이 정답 짝의 유사도를 높이고, 정답 확률이 이미 클수록(0.9) 기울기의 크기가 작아진다.",
    },
    {
      key: "c6",
      question: "온도 $\\tau = 0.1$에서 한 이미지와 캡션들의 코사인 유사도가 [정답 0.9, A 0.85, B 0.4, C 0.1]이다. 경사하강 한 번에 유사도가 가장 크게 **내려가는** 캡션은?",
      choices: ["정답", "A", "B", "C"],
      answer: 1,
      explanation: "오답 칸의 로짓 기울기는 $P_{ij}$이므로 확률이 큰 오답일수록 유사도가 크게 낮아진다. A는 정답과 유사도가 비슷해 확률이 크고(어려운 오답), B와 C는 $e^{(0.4-0.9)/0.1} = e^{-5}$ 이하이므로 기울기에 거의 기여하지 않는다. 정답 칸은 $P - 1 < 0$이므로 유사도가 높아진다. A가 실제로는 같은 뜻의 캡션(거짓 오답)이라면 이 집중이 성능을 떨어뜨린다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
for N in (2, 8, 256):
    S = np.zeros((N, N))                                  # 학습 전: 모든 유사도가 같다
    P = np.exp(S) / np.exp(S).sum(axis=1, keepdims=True)
    print(N, round(-np.log(P[0, 0]), 3))
`,
      expected: "2 0.693\n8 2.079\n256 5.545",
      explanation: "모든 유사도가 같으면 softmax는 $1/N$씩 균등하므로 손실은 $\\ln N$이다($\\ln 2 \\approx 0.693$, $\\ln 8 \\approx 2.079$, $\\ln 256 \\approx 5.545$). 손실의 시작값이 배치 크기에 따라 다르므로, 배치 크기가 다른 실험끼리 손실 값을 그대로 비교하면 안 된다. 이 값은 그 배치로 확인할 수 있는 상호정보량 하한 $\\ln N - \\mathcal{L}$의 최댓값이기도 하다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "InfoNCE 손실이 학습 전에 $\\ln N$에서 출발하는 이유와, 그 기울기가 어려운 오답(hard negative)에 집중하는 이유를 설명하라. 온도 $\\tau$를 낮추면 무엇이 달라지는가?",
      answer: md`
InfoNCE는 행 $i$마다 '이미지 $i$의 짝은 캡션 $N$개 중 무엇인가'를 맞히는 $N$지선다 cross-entropy $\ell_i = -s_{ii} + \log\sum_j e^{s_{ij}}$다. 학습 전에 유사도가 모두 같으면 softmax가 $1/N$씩 균등하므로 손실은 $\ln N$이다. 로짓 기울기는 $\partial \ell_i/\partial s_{ij} = P_{ij} - \mathbb{1}[i=j]$라서, 경사하강은 정답 짝은 올리고 오답은 그 확률 $P_{ij}$에 비례해 내린다. 벡터에 대한 기울기는 $\partial \ell_i/\partial u_i = (\sum_j P_{ij} v_j - v_i)/\tau$이므로, 경사하강은 $u_i$를 짝 $v_i$의 방향으로, 확률 가중 평균의 반대 방향으로 이동시킨다. 유사도가 이미 낮은 쉬운 오답은 $P \approx 0$이므로 기울기에 거의 기여하지 않고, 헷갈리는 어려운 오답이 오답 쪽 기울기의 대부분을 차지한다. $\tau$를 낮추면 softmax의 확률이 큰 값에 더 집중되어 이 경향이 강해진다(예: 어려운 오답의 몫이 $\tau = 1$에서 39%, $0.1$에서 99.2%). 신호는 강해지지만 학습이 불안정해지고, 배치 안의 거짓 오답(사실 같은 뜻인 캡션)의 유사도를 가장 크게 낮추는 문제가 커진다.
`,
      keyPoints: [
        "InfoNCE는 행마다 N지선다 cross-entropy이며 유사도가 모두 같으면 손실은 $\\ln N$이다",
        "로짓 기울기는 $P_{ij} - \\mathbb{1}[i=j]$로 정답 유사도는 높이고 오답 유사도는 확률만큼 낮춘다",
        "쉬운 오답은 확률이 0에 가까워 기울기에 거의 기여하지 않고 어려운 오답이 대부분을 차지한다",
        "온도를 낮추면 기울기가 어려운 오답에 더 집중되어 학습이 불안정해지고 거짓 오답 문제가 커진다",
      ],
    },
  ],
  references: [
    { title: "Oord et al. (2018) — Representation Learning with Contrastive Predictive Coding", url: "https://arxiv.org/abs/1807.03748", note: "InfoNCE 손실과 상호정보량 하한을 제시한 논문 (영문)" },
    { title: "Karpukhin et al. (2020) — Dense Passage Retrieval", url: "https://arxiv.org/abs/2004.04906", note: "in-batch negatives와 BM25의 어려운 오답으로 검색 임베딩을 학습한 논문 (영문)" },
    { title: "Wang & Liu (2021) — Understanding the Behaviour of Contrastive Loss", url: "https://arxiv.org/abs/2012.09740", note: "온도가 어려운 오답에 대한 벌점을 조절한다는 분석 (영문)" },
    { title: "Poole et al. (2019) — On Variational Bounds of Mutual Information", url: "https://arxiv.org/abs/1905.06922", note: "InfoNCE 하한이 $\\ln N$을 넘지 못하는 이유와 다른 추정량의 비교 (영문)" },
  ],
});
