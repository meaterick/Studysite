import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/self-attention";

export default defineLesson({
  id: "self-attention",
  title: "셀프 어텐션: 쿼리·키·값",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "$\\text{softmax}(QK^\\top/\\sqrt{d_k})V$의 각 부분($QK^\\top$, softmax, $\\sqrt{d_k}$, Value 가중합)이 왜 필요한지 설명하고, 작은 예제를 손과 코드로 계산할 수 있다.",
  why: "",
  body: md`
[[diagram:attention-qkv]]

위 그림에서 토큰을 하나씩 클릭해보라. 클릭한 토큰이 Query가 되고, 나머지 화살표의 굵기가 실시간으로 바뀌는 것을 볼 수 있다. 이 상호작용이 사실 Self-Attention의 전부다. 이제 그 안에서 벌어지는 계산을 수식 단계별로 하나씩 풀어보자.

Self-Attention은 입력 시퀀스의 각 토큰 임베딩 $x_i$에 서로 다른 세 개의 학습 가능한 가중치 행렬 $W_q, W_k, W_v$를 각각 곱해 세 종류의 벡터, Query $q_i = x_iW_q$, Key $k_i = x_iW_k$, Value $v_i = x_iW_v$를 만드는 것에서 시작한다. $i$번째 토큰의 Query 벡터 $q_i$를 문장 내 모든 토큰의 Key 벡터 $k_j$와 각각 내적해 관련도 점수 $q_i \cdot k_j$를 구하고, 이 점수들을 $\sqrt{d_k}$로 스케일링한 뒤 softmax에 통과시켜 합이 1이 되는 가중치 $a_{ij}$로 바꾼다. 최종적으로 $i$번째 토큰의 새로운 표현은 이 가중치로 모든 토큰의 Value 벡터를 가중합한 것, 즉 $\text{output}_i = \sum_j a_{ij} v_j$이다. 정리하면 Key는 "i번째 토큰이 j번째 토큰을 얼마나 참조할지"를 정하는 데만 쓰이는 벡터이고, Value는 그 가중치에 따라 실제로 가중합되어 출력에 반영되는 정보이다. Key와 Value를 서로 다른 가중치 행렬($W_k$, $W_v$)로 분리해두면, "얼마나 참조할지 결정하는 기준"과 "실제로 전달되는 내용"을 독립적으로 학습할 수 있다는 이점이 생긴다.

도서관 비유로 정리해두면 기억하기 쉽다. **Query**는 내가 지금 찾는 주제가 적힌 질문지, **Key**는 서가의 책마다 붙은 책등의 색인표, **Value**는 책 속의 실제 내용이다. 사서는 내 질문지(Query)를 모든 책의 색인표(Key)와 대조해 관련도를 매기고(내적), 그 관련도를 비율로 바꾼 뒤(softmax), 비율만큼 여러 책의 내용(Value)을 발췌해 한 장의 요약으로 엮어준다(가중합). 색인표는 어떤 책을 펼칠지 고르는 데만 쓰이고, 내가 실제로 가져가는 것은 책의 내용이다. 그래서 출력은 Key가 아니라 Value의 가중합이다. Self-Attention에서는 문장의 모든 토큰이 동시에 질문지·색인표·내용을 하나씩 갖고, 각자 사서 노릇을 한다.

입력 $X$($n \times d$)에 세 행렬을 곱해 $Q = XW_q$, $K = XW_k$, $V = XW_v$(각각 $n \times d_k$)를 만들면, 위 과정 전체가 다음 한 줄의 수식이 된다.

\`\`\`math
\text{Attention}(Q,K,V) = \text{softmax}\left(\dfrac{QK^\top}{\sqrt{d_k}}\right)V
\`\`\`

이제 이 수식을 기호 하나하나 왜 거기 있는지, 정말 밑바닥부터 따져보자.

**왜 $QK^\top$인가.** 벡터 두 개를 내적하면 "두 벡터가 얼마나 같은 방향을 향하는가"를 숫자 하나로 요약할 수 있다는 사실을 1주차 코사인 유사도에서 이미 확인했다. 즉 내적은 Query 벡터와 Key 벡터가 임베딩 공간에서 얼마나 같은 방향을 향하는지, 다시 말해 두 토큰이 표현하는 특징이 얼마나 겹치는지를 재는 도구다. 문장의 모든 토큰이 각자 하나의 Query 벡터와 하나의 Key 벡터를 갖고 있으므로, $n$개 토큰이 있다면 $Q(n \times d_k)$와 $K^\top(d_k \times n)$를 곱한 결과는 $n \times n$짜리 행렬이 된다. 이 행렬의 $(i,j)$ 칸에 적힌 숫자는 "$i$번째 토큰이 $j$번째 토큰을 얼마나 눈여겨보는가"에 대한 점수다. 즉 $QK^\top$ 단 한 번의 행렬곱으로, 모든 토큰 쌍 사이의 관련성 점수표가 통째로 완성된다.

**왜 softmax인가.** $QK^\top$이 출력하는 점수는 임의의 실수(음수도 될 수 있고 크기도 제각각인 숫자)일 뿐이다. 이것을 그대로 Value에 곱해서 더하면 각 항의 부호와 크기가 제각각이라 "몇 퍼센트를 어느 토큰에서 가져왔다"는 비율로 해석할 수 없다. 우리가 원하는 것은 각 행(하나의 Query 입장에서 본 모든 토큰에 대한 점수)의 숫자들을 전부 0 이상으로 만들고, 합이 정확히 1이 되게 만드는 변환이다. softmax가 정확히 이 일을 한다. 큰 점수는 지수함수(exp)를 거치며 상대적으로 훨씬 크게 부풀려지고(그래서 가장 관련 있는 토큰에 관심이 쏠리는 효과가 생긴다), 그다음 전체 합으로 나눠서 비율(확률처럼 보이는 값)로 바꿔준다. 그 결과가 곧 "몇 퍼센트는 이 토큰에서, 몇 퍼센트는 저 토큰에서 가져올지"를 정하는 attention 가중치다.

**왜 $\sqrt{d_k}$로 나누는가.** 처음 보면 가장 뜬금없게 느껴지는 부분이지만, 사실은 순전히 숫자가 지나치게 커지는 것을 막기 위한 안전장치다. $q$와 $k$의 각 성분이 평균 0, 분산 1 정도로 적당히 작게 유지된다고 하자. 이 둘을 $d_k$개의 성분끼리 곱해서 다 더한 것이 내적 $q \cdot k$인데, 서로 독립인 $d_k$개의 항을 더하면 분산은 대략 $d_k$배로 불어난다(독립인 확률변수를 더하면 분산도 더해진다. 1주차 확률 참고). 즉 $d_k$가 클수록(임베딩 차원이 클수록) 내적 값 자체가 아주 크거나 아주 작은 극단값으로 튈 위험이 커진다. 그런데 softmax에 유난히 큰 값 하나와 나머지 작은 값들을 넣으면, exp가 그 큰 값만 극단적으로 부풀려서 결과가 "1등 토큰에 확률 거의 100%, 나머지는 거의 0%"인 원-핫에 가까운 모양이 된다. 이렇게 되면 역전파로 계산되는 기울기가 거의 0에 수렴해서(softmax가 완만한 구간이 아니라 뾰족한 절벽 근처에 있으면 그 지점의 기울기는 0에 가깝다) 학습이 사실상 멈춰버린다. $\sqrt{d_k}$로 나누면 내적 값의 분산이 다시 1 근처로 돌아오기 때문에, softmax가 지나치게 뾰족해지지 않고 여러 토큰에 골고루 관심을 분배할 여지가 남는다. 결국 $\sqrt{d_k}$ 스케일링은 "학습이 잘 굴러가도록 점수의 스케일을 적당히 눌러주는" 지극히 실용적인 안전핀이다.

이 세 가지가 합쳐지면 다음과 같은 아주 작은 숫자 예제로 손에 잡히게 확인할 수 있다.

:::example 숫자로 직접 따라가는 Self-Attention: "고양이가 생선을 맛있게 먹었다"
위 그림과 같은 4개 토큰 문장에서 "생선을"이 Query가 된 경우를 생각해보자. 설명을 위해 $d_k=4$인 아주 작은 임베딩 공간을 쓰고, 학습이 이미 끝나 각 토큰의 Key 벡터가 다음과 같이 나왔다고 하자. 고양이가=[1,0,0,0], 생선을=[1,1,1,1], 맛있게=[0,0,1,0], 먹었다=[1,1,0,-1]. "생선을"의 Query 벡터는 [1,1,0,1]이라고 하자.

먼저 Query와 각 Key를 내적한다(같은 자리 성분끼리 곱해서 전부 더하기). 고양이가: $1 \times 1 + 1 \times 0 + 0 \times 0 + 1 \times 0$ = **1**. 생선을(자기 자신): $1 \times 1 + 1 \times 1 + 0 \times 1 + 1 \times 1$ = **3**. 맛있게: $1 \times 0 + 1 \times 0 + 0 \times 1 + 1 \times 0$ = **0**. 먹었다: $1 \times 1 + 1 \times 1 + 0 \times 0 + 1 \times (-1)$ = **1**. 이렇게 나온 점수 [1, 3, 0, 1]이 $QK^\top$ 행렬의 한 행이다.

여기에 $\sqrt{d_k} = \sqrt{4} = 2$로 나누면 [0.5, 1.5, 0, 0.5]가 된다. 이제 이 네 숫자에 softmax를 적용한다. 각각 지수를 취하면 $e^{0.5} \approx 1.65$, $e^{1.5} \approx 4.48$, $e^0 = 1$, $e^{0.5} \approx 1.65$이고, 이들의 합은 약 8.78이다. 각 값을 이 합으로 나누면 최종 attention 가중치는 고양이가 $\approx$ **18.8%**, 생선을 $\approx$ **51.0%**, 맛있게 $\approx$ **11.4%**, 먹었다 $\approx$ **18.8%**가 된다. 즉 "생선을"이라는 Query는 자기 자신의 Value를 절반 가까이 가져오면서, 나머지는 "고양이가"와 "먹었다"에 골고루, "맛있게"에는 상대적으로 적게 관심을 나눠준다.

마지막으로 이 비율대로 Value를 섞어보자. Value를 2차원으로 단순화해서 고양이가=[2,0], 생선을=[0,3], 맛있게=[1,1], 먹었다=[4,0]이라 하면, 출력 $= 0.188 \times [2,0] + 0.510 \times [0,3] + 0.114 \times [1,1] + 0.188 \times [4,0] \approx$ **[1.24, 1.65]**. 이 벡터 하나가 바로 "생선을"이라는 토큰이 문장 전체를 한 번 둘러보고 새로 얻은, 문맥이 반영된 표현이다. 위 그림에서 "생선을"을 클릭했을 때 나오는 퍼센트(19%, 51%, 11%, 19%)가 바로 이 계산 결과다.
:::

[[diagram:attention-steps]]

### 코드로 같은 계산 확인하기

위에서 손으로 따라간 계산을 NumPy로 그대로 옮겨 보자. \`K @ q\`는 Key 네 개와 Query의 내적을 한 번에 구하는 행렬-벡터 곱이다.

\`\`\`python
import numpy as np

K = np.array([[1, 0, 0, 0],     # 고양이가
              [1, 1, 1, 1],     # 생선을
              [0, 0, 1, 0],     # 맛있게
              [1, 1, 0, -1]])   # 먹었다
V = np.array([[2, 0], [0, 3], [1, 1], [4, 0]])
q = np.array([1, 1, 0, 1])      # "생선을"의 Query

scores = K @ q                  # 내적 4개를 한 번에: [1, 3, 0, 1]
scaled = scores / np.sqrt(4)    # √d_k = 2로 나누기
weights = np.exp(scaled) / np.exp(scaled).sum()
print("점수:", scores, "→ 스케일:", scaled)
print("가중치:", weights.round(3), "합 =", round(weights.sum(), 6))
print("출력:", (weights @ V).round(2))
\`\`\`

손 계산과 같은 가중치(18.8%, 51.0%, 11.4%, 18.8%)와 출력 [1.24, 1.65]가 나온다.

### 모든 Query를 한꺼번에: shape으로 읽기

위 예제는 Query 하나("생선을")만 계산했다. 실제로는 네 토큰이 모두 Query가 되어 동시에 계산한다. 그래서 수식의 각 단계를 shape으로 읽을 수 있어야 한다. 토큰 $n$개, Query·Key 차원 $d_k$, Value 차원 $d_v$라 하면 다음과 같다.

| 단계 | 계산 | shape | 의미 |
| --- | --- | --- | --- |
| ① | $Q$, $K$ | $(n, d_k)$ | 토큰마다 질문지·색인표 하나씩 |
| ② | $QK^\top$ | $(n, n)$ | 모든 토큰 쌍의 점수표 |
| ③ | $\div \sqrt{d_k}$, 행별 softmax | $(n, n)$ | 각 행의 합이 1인 비율표 |
| ④ | $\times V$ | $(n, d_v)$ | 토큰마다 새 표현 하나씩 |

③의 softmax는 **행마다** 따로 적용한다는 점이 중요하다. 한 행은 "한 Query가 모든 토큰에 나눠 주는 관심"이라 그 행 안에서만 합이 1이 된다.

[[diagram:attention-matrix-shapes]]

:::tip softmax는 모든 점수에 같은 수를 더해도 결과가 같다
점수 $[1, 3, 0, 1]$에 모두 10을 더한 $[11, 13, 10, 11]$을 softmax에 넣어도 결과는 똑같다. $e^{s_i + c} = e^{s_i}e^c$에서 $e^c$가 분자와 분모에 똑같이 곱해져 약분되기 때문이다. softmax는 점수의 **차이**에만 반응한다. 「멀티헤드 Attention과 Causal Mask」 단계의 코드가 최댓값을 빼고 계산하는 것도 이 성질 덕분이다. 반면 점수에 같은 수를 **곱하면**(예: 10배) 차이도 10배가 되어 결과가 더 뾰족해진다. $\sqrt{d_k}$로 나누는 것이 바로 이 "곱하기" 쪽을 조절하는 일이다.
:::

### $\sqrt{d_k}$의 효과를 숫자로 보기

무작위 $q$, $k$ 1만 쌍의 내적 분산을 직접 재 보고, 같은 점수를 크게 키웠을 때 softmax가 어떻게 변하는지도 비교해 보자.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
for dk in [4, 64, 512]:
    q = rng.normal(size=(10000, dk))
    k = rng.normal(size=(10000, dk))
    dots = (q * k).sum(axis=1)                 # 무작위 q·k 1만 쌍
    print(f"d_k={dk:3d}: 내적 분산 {dots.var():7.1f},  √d_k로 나눈 뒤 분산 {(dots / np.sqrt(dk)).var():.2f}")

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

s = rng.normal(size=8)                         # 분산 1인 점수 8개
print("스케일 맞춘 점수 → softmax:", softmax(s).round(2))
print("√512배로 커진 점수 → softmax:", softmax(s * np.sqrt(512)).round(2))
\`\`\`

내적의 분산이 $d_k$와 거의 같고(4, 65, 510), $\sqrt{d_k}$로 나누면 1 근처로 돌아온다. 아래 두 줄은 같은 점수의 softmax다. 스케일이 맞으면 여러 토큰에 관심이 고루 나뉘지만, $\sqrt{512} \approx 22.6$배로 커진 점수에서는 두 칸만 남고 나머지가 전부 0이 된다. 이렇게 거의 원-핫이 된 softmax는 기울기가 거의 0이라 학습이 멈춘다.

[[diagram:sqrt-dk-softmax]]
`,
  checks: [
    {
      key: "c1",
      question: "토큰 $n$개, $d_k = 64$일 때 $QK^\\top$의 shape은?",
      choices: ["$(n, 64)$", "$(64, 64)$", "$(n, n)$", "$(n, 1)$"],
      answer: 2,
      explanation: "$(n, d_k) \\times (d_k, n) = (n, n)$. 모든 토큰 쌍의 점수표다. 그래서 문맥이 2배가 되면 점수표 원소는 4배가 된다.",
    },
    {
      key: "c2",
      question: "$q = [1, 1, 0, 1]$, $k = [1, 1, 0, -1]$일 때 $\\sqrt{d_k}$로 나눈 점수는?",
      choices: ["$1$", "$0.5$", "$0.25$", "$2$"],
      answer: 1,
      explanation: "$q \\cdot k = 1 + 1 + 0 - 1 = 1$, $\\sqrt{4} = 2$로 나누면 $0.5$. 본문 예제의 \"먹었다\" 칸이다.",
    },
    {
      key: "c3",
      question: "$\\sqrt{d_k}$로 나누지 않으면 생기는 문제는?",
      choices: ["점수가 모두 0이 된다", "내적의 분산이 $d_k$에 비례해 커져 softmax가 한 토큰에 쏠리고 기울기가 사라진다", "출력 shape이 바뀐다", "causal mask가 작동하지 않는다"],
      answer: 1,
      explanation: "무작위 벡터로 실험하면 $d_k = 512$일 때 나누지 않으면 최대 가중치 평균이 0.96까지 치솟고, 나누면 0.3 안팎으로 유지된다.",
    },
    {
      key: "c4",
      question: "도서관 비유에서 최종적으로 가중합되어 출력에 담기는 것은?",
      choices: ["Query(질문지)", "Key(색인표)", "Value(책 내용)", "점수표"],
      answer: 2,
      explanation: "Key는 어떤 책을 펼칠지 고르는 데만 쓰이고, 실제로 가져가는 정보는 Value다.",
    },
    {
      key: "c5",
      question: "토큰 10개, $d_k = 64$, $d_v = 32$일 때 $\\text{softmax}(QK^\\top/\\sqrt{d_k})V$의 shape은?",
      choices: ["$(10, 32)$", "$(10, 10)$", "$(10, 64)$", "$(64, 32)$"],
      answer: 0,
      explanation: "$QK^\\top$은 $(10, 10)$이고, 여기에 $V$ $(10, 32)$를 곱하면 $(10, 32)$다. 토큰마다 $d_v$차원의 새 표현이 하나씩 나온다.",
    },
    {
      key: "c6",
      question: "어떤 Query의 점수 $[1, 3, 0, 1]$에 모두 10을 더해 $[11, 13, 10, 11]$로 만들면 softmax 가중치는?",
      choices: ["변하지 않는다", "모두 10배가 된다", "가장 큰 값에 더 쏠린다", "모두 같아진다"],
      answer: 0,
      explanation: "softmax는 점수의 차이에만 반응한다. 공통으로 더한 $e^{10}$이 분자·분모에서 약분되기 때문이다. 반대로 점수에 같은 수를 곱하면 차이가 커져 분포가 뾰족해진다.",
    },
    {
      key: "c7",
      question: "Query 5개(`Q`: (5, 8))와 Key 7개(`K`: (7, 8))로 `S = Q @ K.T`를 만들었다. attention 가중치를 만들 때 softmax는 어느 축으로 해야 하는가?",
      choices: ["axis=0: Key마다 Query들에 대한 분포", "axis=-1: Query(행)마다 Key 7개에 대한 분포", "전체 35칸에 한 번", "축과 상관없다"],
      answer: 1,
      explanation: "`S`는 (5, 7)이고 행 하나가 Query 하나입니다. 각 Query가 어떤 Key를 얼마나 참고할지의 확률분포가 필요하므로 행마다(마지막 축) softmax해 행 합이 1이 되게 합니다. 그래야 `weights @ V`가 Query마다의 가중합이 됩니다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
q = np.array([1, 1, 0, 1])
K = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]])
print((K @ q).tolist(), (K @ q / np.sqrt(4)).tolist())
`,
      expected: "[1, 3, 0, 1] [0.5, 1.5, 0.0, 0.5]",
      explanation: "Query와 각 Key의 내적은 고양이가 1, 생선을 3, 맛있게 0, 먹었다 1입니다. $\\sqrt{d_k} = 2$로 나누면 `[0.5, 1.5, 0.0, 0.5]`가 되고, 여기에 softmax를 하면 본문의 18.8% · 51.0% · 11.4% · 18.8%가 나옵니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "n=1000, d_model=512 일 때 attention 점수 행렬의 크기와 문맥이 2배가 되면 비용은?",
      answer: md`
헤드마다 $1000\times 1000$ 점수 행렬(100만 원소)이 생긴다. 계산량이 $O(n^2)$이라 문맥이 2배가 되면 4배가 된다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "$\\sqrt{d_k}$ 스케일링을 생략하면 어떤 문제가 생기는가? (분산과 softmax 포화의 관점에서 설명하라)",
      answer: md`
내적의 분산이 $d_k$에 비례해 커져 softmax가 한 곳으로 포화되고, 그 결과 기울기가 소실된다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "도서관 비유에서 Q, K, V는 각각 무엇에 대응하는가? 그리고 왜 최종적으로 가져오는 것은 Key가 아니라 Value인가?",
      answer: md`
Q=내가 찾는 주제, K=책등의 색인표(내 Query와 대조되는 대상), V=책 속 실제 내용. 색인표(Key)는 어떤 책이 관련 있는지 찾는 데만 쓰이는 '검색용 표지'일 뿐이고, 실제로 얻어가는 정보는 책의 내용(Value)이기 때문에 최종적으로 가중합되는 것은 Value다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Jay Alammar — The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", note: "Q·K·V 계산을 벡터 단위로 그린 대표 자료 (영문, 한국어 번역 링크 있음)" },
    { title: "3Blue1Brown — Attention in transformers, visually explained", url: "https://www.3blue1brown.com/lessons/attention", note: "약 25분 영상. 이 단계 전후로 보면 좋다" },
    { title: "Vaswani et al. (2017) — Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", note: "3.2절 Scaled Dot-Product Attention (각주 4에 √dk의 이유)" },
  ],
});
