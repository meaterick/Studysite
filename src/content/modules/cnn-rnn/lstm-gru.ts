import { defineLesson, md } from "../../kit";
import exercises from "./labs/lstm-gru";

export default defineLesson({
  id: "lstm-gru",
  title: "LSTM과 GRU",
  tier: "supplement",
  goal: "LSTM의 forget·input·output 게이트와 셀 상태, GRU의 update·reset 게이트를 설명하고, $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$가 기울기 소실을 완화하는 이유를 말할 수 있다.",
  why: "",
  body: md`
LSTM(Long Short-Term Memory)은 RNN의 장기 의존성 문제를 완화하기 위해 고안된 구조로, 핵심 아이디어는 은닉 상태와 별개로 셀 상태(cell state) $c_t$라는 "장기 기억용 컨베이어 벨트"를 하나 더 두고, 이 벨트에 무엇을 지우고 무엇을 새로 쓸지를 게이트(gate)라는 별도의 작은 신경망들이 결정하게 하는 것이다. 각 게이트는 시그모이드 $\sigma$를 거쳐 0~1 사이의 값을 내놓는 벡터로, 이 값이 "얼마나 통과시킬지"를 성분별로 정하는 스위치 역할을 한다. LSTM은 세 개의 게이트를 쓴다.

\`\`\`math
f_t = \sigma(W_f x_t + U_f h_{t-1} + b_f)
\`\`\`
\`\`\`math
i_t = \sigma(W_i x_t + U_i h_{t-1} + b_i)
\`\`\`
\`\`\`math
\tilde{c}_t = \tanh(W_c x_t + U_c h_{t-1} + b_c)
\`\`\`
\`\`\`math
c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t
\`\`\`
\`\`\`math
o_t = \sigma(W_o x_t + U_o h_{t-1} + b_o), \qquad h_t = o_t \odot \tanh(c_t)
\`\`\`

Forget gate $f_t$는 "이전 셀 상태 $c_{t-1}$ 중 얼마를 계속 기억할지"를 정한다. $f_t$의 어떤 성분이 0에 가까우면 그 성분에 해당하는 과거 기억은 지워지고, 1에 가까우면 그대로 유지된다. Input gate $i_t$는 "지금 입력에서 만들어진 새 후보 정보 $\tilde{c}_t$ 중 얼마를 새로 써 넣을지"를 정한다. 이 둘을 합쳐 새 셀 상태 $c_t$는 "이전 기억을 얼마나 지우고(forget), 새 정보를 얼마나 더할지(input)"를 성분별로 독립적으로 조절한 결과가 된다. 마지막으로 Output gate $o_t$는 "지금 갱신된 셀 상태 $c_t$ 중 얼마를 이번 시점의 은닉 상태(다음 층이나 다음 시점에 보여줄 출력) $h_t$로 내보낼지"를 정한다. 즉 셀 상태 $c_t$는 내부적으로 계속 유지·갱신되는 장기 기억이고, 은닉 상태 $h_t$는 그중 지금 당장 밖으로 내보일 부분만 걸러낸 결과라는 역할 분담이다.

이 구조가 장기 의존성에 유리한 이유는 $c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$라는 갱신식 자체에 있다. RNN의 $h_t = f(Wh_{t-1} + \cdots)$처럼 매 스텝 행렬을 곱하고 비선형함수를 통과시키는 대신, LSTM의 셀 상태는 이전 값에 (성분별) 곱셈과 덧셈만을 거친다. forget gate $f_t$가 1에 가까운 값을 유지하도록 학습되면 $c_{t-1}$의 정보는 거의 그대로 $c_t$에 전달되고, 역전파 시 이 경로를 타고 흐르는 기울기도 매 스텝 작은 값을 반복해서 곱하는 대신 거의 손실 없이 먼 과거까지 전달될 수 있다. BPTT에서 문제가 됐던 "지수적으로 작아지는 곱셈의 반복"을, 곱셈이 아닌 덧셈 위주의 경로 하나를 별도로 마련해 우회하는 셈이다.

:::example 셀 상태를 숫자로 한 스텝
성분 하나만 보자. 이전 셀 상태 $c_{t-1} = 2.0$, forget gate $f_t = 0.9$, input gate $i_t = 0.5$, 새 후보 $\tilde{c}_t = 0.4$라면

$$c_t = 0.9 \times 2.0 + 0.5 \times 0.4 = 1.8 + 0.2 = 2.0$$

이전 기억의 90%를 남기고 새 정보를 조금 더했다. 극단적인 경우도 보자. $f_t = 1$, $i_t = 0$이면 $c_t = c_{t-1}$로 기억이 그대로 보존되고, $f_t = 0$, $i_t = 1$이면 과거를 모두 지우고 새 후보로 덮어쓴다.

기울기 쪽에서는 셀 상태 경로를 따라 한 스텝 거슬러 올라갈 때 대략 $f_t$가 곱해진다. $f_t = 0.99$를 유지하면 50스텝 뒤에도 $0.99^{50} \approx 0.61$배가 남는다. 「RNN과 BPTT」 단계에서 $0.9^{50} \approx 0.005$였던 것과 비교해 보라. 게다가 $f_t$는 고정된 값이 아니라 입력을 보고 게이트가 정하므로, "기억할 때"와 "잊을 때"를 모델이 스스로 고를 수 있다.
:::

[[diagram:lstm-cell-step]]

아래 코드는 LSTM 셀을 다섯 스텝 돌리며 forget gate와 셀 상태를 출력한다. 실전 구현처럼 게이트 4개의 가중치를 행렬 하나에 쌓아 한 번에 곱한 뒤 잘라 쓴다. forget gate 편향을 크게 잡아 두는 것도 실제로 쓰이는 요령이다(학습 초기에 "일단 기억을 유지"하는 쪽에서 출발한다).

\`\`\`python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

rng = np.random.default_rng(0)
d_x, d_h = 3, 2
# 게이트 4개(f, i, c~, o)의 가중치를 한 행렬에 쌓아 둔다: (4·d_h, d_x + d_h)
Wall = rng.normal(size=(4 * d_h, d_x + d_h)) * 0.5
ball = np.zeros(4 * d_h)
ball[:d_h] = 3.0                      # forget gate 편향을 크게: 처음엔 "기억을 유지"하는 쪽으로

def lstm_step(x, h, c):
    z = Wall @ np.concatenate([x, h]) + ball
    f, i, o = sigmoid(z[:d_h]), sigmoid(z[d_h:2 * d_h]), sigmoid(z[3 * d_h:])
    c_tilde = np.tanh(z[2 * d_h:3 * d_h])
    c = f * c + i * c_tilde           # 이전 기억 × f  +  새 후보 × i
    h = o * np.tanh(c)
    return h, c, f

h, c = np.zeros(d_h), np.array([1.0, -1.0])    # 셀에 기억 [1, -1]이 들어 있다고 하자
for t in range(5):
    h, c, f = lstm_step(rng.normal(size=d_x), h, c)
    print(f"t={t + 1}: f = {f.round(2)}, c = {c.round(2)}")

print("파라미터 수:", Wall.size + ball.size)   # 4 × (d_h·(d_x + d_h) + d_h) = 48
\`\`\`

$f$가 1에 가까워서, 처음 넣은 기억 $[1, -1]$의 부호와 크기가 여러 스텝이 지나도 크게 흐트러지지 않는다. 파라미터 수는 게이트(와 후보) 4개가 각각 $d_h \times (d_x + d_h)$ 가중치와 $d_h$개 편향을 가지므로 $4(d_h(d_x + d_h) + d_h)$다. 같은 크기의 단순 RNN보다 4배 많다.

[[diagram:lstm-retention]]

\`\`\`image
src: /images/week5/lstm-cell.png
alt: LSTM 셀 내부 구조도: forget/input/output 게이트와 셀 상태, 은닉 상태의 흐름
caption: 가로로 관통하는 윗줄이 셀 상태 c_t의 컨베이어 벨트다. 시그모이드(σ) 게이트들이 이 벨트에 무엇을 지우고(forget) 더할지(input), 그리고 무엇을 밖으로 내보낼지(output)를 결정한다.
credit: fdeloche, CC BY-SA 4.0, Wikimedia Commons (C. Olah, "Understanding LSTM Networks"의 도식에서 착안)
width: 1200
height: 533
\`\`\`

GRU(Gated Recurrent Unit)는 LSTM보다 게이트 수를 줄인 간소화 버전이다. 셀 상태와 은닉 상태를 하나로 합치고, forget/input 두 게이트를 업데이트 게이트(update gate) $z_t$ 하나로 통합해 "이전 상태를 얼마나 유지할지"와 "새 후보를 얼마나 받아들일지"를 $1-z_t$와 $z_t$라는 하나의 대응 관계로 묶는다. 여기에 리셋 게이트(reset gate) $r_t$가 추가로 "이전 은닉 상태를 새 후보 계산에 얼마나 반영할지"를 조절한다.

\`\`\`math
z_t = \sigma(W_z x_t + U_z h_{t-1}), \qquad r_t = \sigma(W_r x_t + U_r h_{t-1})
\`\`\`
\`\`\`math
\tilde{h}_t = \tanh(W_h x_t + U_h(r_t \odot h_{t-1})), \qquad h_t = (1-z_t)\odot h_{t-1} + z_t \odot \tilde{h}_t
\`\`\`

LSTM과 비교하면 GRU는 게이트가 3개에서 2개로, 상태가 2개($c_t$, $h_t$)에서 1개($h_t$)로 줄어 학습할 파라미터 수가 더 적다. 그만큼 학습이 빠르고 데이터가 적을 때 과적합에 덜 취약하다는 실용적 이점이 있는 반면, 셀 상태를 별도로 유지하는 LSTM 쪽이 아주 긴 시퀀스에서는 표현력 면에서 약간 더 유리하다고 보고되기도 한다. 실무에서는 두 구조의 성능 차이가 태스크에 따라 엇갈리는 경우가 많아, 파라미터 수와 학습 속도를 고려해 GRU를 기본값으로 먼저 시도해보는 경우가 흔하다.

[[diagram:gru-vs-lstm]]
`,
  checks: [
    {
      key: "c1",
      question: "LSTM에서 \"이전 셀 상태 $c_{t-1}$ 중 얼마를 계속 기억할지\"를 정하는 것은?",
      choices: ["input gate $i_t$", "forget gate $f_t$", "output gate $o_t$", "후보 $\\tilde{c}_t$"],
      answer: 1,
      explanation: "forget gate가 0에 가까우면 그 성분의 기억을 지우고, 1에 가까우면 유지한다.",
    },
    {
      key: "c2",
      question: "LSTM 셀 상태 경로가 RNN보다 기울기 소실에 강한 핵심 이유는?",
      choices: ["게이트가 많아 파라미터가 많기 때문에", "셀 상태가 행렬곱·tanh 대신 성분별 곱과 덧셈으로 갱신되어, $f_t \\approx 1$이면 기울기가 거의 그대로 전달되기 때문에", "시그모이드가 항상 1을 출력하기 때문에", "은닉 상태를 사용하지 않기 때문에"],
      answer: 1,
      explanation: "forget bias를 올려 $f$를 1에 가깝게 하면 40스텝 전의 영향이 살아남는다. 반대로 $f \\approx 0.5$면 RNN보다도 빨리 사라진다.",
    },
    {
      key: "c3",
      question: "GRU와 LSTM의 비교로 옳은 것은?",
      choices: ["GRU는 게이트 3개, 상태 2개를 쓴다", "GRU는 게이트 2개(update, reset)와 상태 1개로, 같은 크기에서 파라미터가 LSTM의 약 3/4이다", "GRU는 게이트가 없다", "GRU가 항상 LSTM보다 정확하다"],
      answer: 1,
      explanation: "같은 크기라면 예컨대 GRU 1008개, LSTM 1344개로 파라미터가 3:4다. 성능 차이는 태스크마다 엇갈린다.",
    },
    {
      key: "c4",
      question: "입력 차원 $d_x = 10$, 은닉 차원 $d_h = 20$인 LSTM의 파라미터 수는? (게이트·후보 4개, 편향 포함)",
      choices: ["2,480개", "620개", "1,860개", "2,400개"],
      answer: 0,
      explanation: "하나당 $20 \\times (10 + 20) + 20 = 620$개이고 4개라 2,480개다. 같은 크기의 RNN(620개)의 4배, GRU(3개, 1,860개)의 4/3배다.",
    },
    {
      key: "c5",
      question: "LSTM에서 $f_t = 0$, $i_t = 1$이면 새 셀 상태 $c_t$는?",
      choices: ["과거 기억을 모두 지우고 새 후보 $\\tilde{c}_t$로 채워진다", "이전 셀 상태 $c_{t-1}$이 그대로 유지된다", "0이 된다", "$c_{t-1} + \\tilde{c}_t$가 된다"],
      answer: 0,
      explanation: "$c_t = 0 \\cdot c_{t-1} + 1 \\cdot \\tilde{c}_t = \\tilde{c}_t$다. 반대로 $f_t = 1$, $i_t = 0$이면 $c_t = c_{t-1}$로 기억이 그대로 보존된다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "LSTM의 forget gate, input gate, output gate는 각각 무엇을 결정하는가?",
      answer: md`
forget gate는 이전 셀 상태 중 얼마나 유지할지, input gate는 새 정보를 얼마나 반영할지, output gate는 갱신된 셀 상태 중 얼마나 은닉상태로 내보낼지를 각각 결정한다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "LSTM의 셀 상태 업데이트 식 $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$이 RNN의 $h_t=f(Wh_{t-1}+\\cdots)$보다 기울기 소실에 덜 취약한 이유를 구조적으로 설명하라.",
      answer: md`
LSTM의 셀 상태는 곱셈이 반복되는 경로 대신, forget gate가 1에 가까울 때 이전 값을 거의 그대로 통과시키는 덧셈 위주의 경로(gradient highway)를 통해 갱신된다. 곱셈이 누적되지 않으므로 기울기가 소실되지 않고 먼 과거까지 전달될 수 있다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "GRU는 LSTM보다 게이트와 상태를 몇 개로, 어떻게 줄였는가? 이 차이가 실무에서 어떤 트레이드오프를 만드는가?",
      answer: md`
GRU는 LSTM의 3개 게이트를 update gate와 reset gate 2개로, 2개의 상태(셀 상태+은닉상태)를 은닉상태 1개로 줄인 간소화 버전이다. 파라미터가 적어 학습이 빠르고 과적합에도 강하지만, 매우 긴 시퀀스에서는 LSTM이 더 유리하다는 보고도 있다.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "LSTM을 실험해 보면 forget bias가 0일 때 RNN보다 오히려 첫 시점의 영향이 더 빨리 사라지는데, bias를 2 이상으로 올리면 40스텝 뒤에도 살아남습니다. 셀 상태 식 $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde c_t$로 이유를 설명하십시오.",
      answer: md`
첫 시점의 기억이 $T$스텝 뒤까지 전달되는 정도는 대략 forget gate 값들의 곱 $\prod f_t$에 비례합니다(셀 경로에는 행렬곱이나 tanh가 없고 원소별 곱셈과 덧셈만 있기 때문). bias가 0이면 $f_t \approx \sigma(0) = 0.5$ 근처라 40스텝 뒤에는 $0.5^{40} \approx 10^{-12}$ 수준으로 사라져 RNN보다도 나빠집니다. bias를 2~4로 올리면 $f_t$가 0.87~0.98이 되어 곱이 천천히 줄고 기억이 살아남습니다. 즉 장기 기억의 핵심은 게이트가 있다는 사실 자체가 아니라 $f_t \approx 1$로 유지되는 덧셈 경로이고, 그래서 실무에서 forget bias를 1 이상으로 초기화합니다.
`,
      keyPoints: ["기억의 전달은 forget gate 값들의 곱에 비례", "셀 경로는 원소별 곱셈과 덧셈뿐(행렬곱·tanh 없음)", "bias 0이면 $f \\approx 0.5$라 빠르게 사라진다", "bias를 올려 $f \\approx 1$이면 기억이 유지된다"],
    },
  ],
  references: [
    { title: "Chris Olah — Understanding LSTM Networks", url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/", note: "LSTM 게이트를 그림으로 설명하는 가장 유명한 글 (영문)" },
    { title: "d2l.ai — Long Short-Term Memory (LSTM)", url: "https://d2l.ai/chapter_recurrent-modern/lstm.html", note: "수식과 구현을 함께 (한국어판: ko.d2l.ai)" },
    { title: "Jozefowicz et al. (2015) — An Empirical Exploration of Recurrent Network Architectures", url: "https://proceedings.mlr.press/v37/jozefowicz15.pdf", note: "forget bias를 1로 초기화하는 관행의 근거 (심화)" },
  ],
});
