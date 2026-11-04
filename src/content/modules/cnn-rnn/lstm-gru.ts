import { defineLesson, md } from "../../kit";
import exercises from "./labs/lstm-gru";

export default defineLesson({
  id: "lstm-gru",
  title: "LSTM과 GRU",
  tier: "supplement",
  goal: "LSTM의 forget·input·output 게이트와 셀 상태, GRU의 update·reset 게이트를 설명하고, 셀 상태의 갱신식 $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$가 기울기 소실을 줄이는 이유를 계산으로 보인다.",
  why: "LSTM과 GRU는 Transformer 이전에 번역, 음성 인식, 시계열 예측의 표준 모델이었고, 지금도 계산 자원이 제한된 시계열 모델에 쓰인다. 게이트로 정보의 유지와 갱신을 조절하는 방식은 이후 모델의 구조를 이해하는 데에도 필요하다.",
  body: md`
### LSTM의 게이트와 셀 상태

**LSTM**(Long Short-Term Memory)은 RNN의 장기 의존성 문제를 줄이려고 고안된 구조다([[lesson:rnn]]). 은닉 상태 $h_t$와 별도로 **셀 상태**(cell state) $c_t$를 두고, 셀 상태에서 무엇을 지우고 무엇을 새로 더할지를 **게이트**(gate)가 정한다. 각 게이트는 시그모이드 $\sigma$를 거쳐 성분이 0과 1 사이인 벡터를 출력하고, 이 값을 다른 벡터에 성분별로 곱해 각 성분을 얼마나 통과시킬지 정한다.

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

- **forget gate** $f_t$: 이전 셀 상태 $c_{t-1}$의 각 성분을 얼마나 남길지 정한다. 0에 가까운 성분은 지워지고, 1에 가까운 성분은 유지된다.
- **input gate** $i_t$: 현재 입력으로 계산한 후보 $\tilde{c}_t$를 얼마나 더할지 정한다.
- **output gate** $o_t$: 갱신된 셀 상태 $c_t$ 중 얼마를 이번 시점의 은닉 상태 $h_t$로 출력할지 정한다.

셀 상태 $c_t$는 시점 사이에 전달되며 계속 갱신되는 값이고, 은닉 상태 $h_t$는 그중 output gate가 고른 부분을 다음 층과 다음 시점에 전달하는 값이다.

### 셀 상태가 기울기 소실을 줄이는 이유

RNN의 은닉 상태는 스텝마다 행렬 $U$를 곱하고 $\tanh$를 거친다. LSTM의 셀 상태는 $c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$로 갱신되므로, $c_{t-1}$에서 $c_t$로 가는 경로에는 행렬 곱이나 비선형 함수가 없고 성분별 곱셈과 덧셈만 있다. 이 경로의 국소 미분은 대략 $f_t$다. forget gate가 1에 가깝게 학습되면 $c_{t-1}$의 정보가 거의 그대로 $c_t$로 전달되고, 역전파에서도 기울기가 같은 경로로 크게 줄지 않고 먼 시점까지 전달된다.

성분 하나에서 이전 셀 상태 $c_{t-1} = 2.0$, forget gate $f_t = 0.9$, input gate $i_t = 0.5$, 후보 $\tilde{c}_t = 0.4$이면 다음과 같다.

$$c_t = 0.9 \times 2.0 + 0.5 \times 0.4 = 1.8 + 0.2 = 2.0$$

이전 값의 90%를 남기고 새 값을 조금 더했다. $f_t = 1$, $i_t = 0$이면 $c_t = c_{t-1}$로 이전 값이 그대로 유지되고, $f_t = 0$, $i_t = 1$이면 이전 값을 모두 지우고 후보 $\tilde{c}_t$로 바뀐다.

역전파에서 셀 상태 경로를 따라 한 스텝 지날 때마다 기울기에 대략 $f_t$가 곱해진다. $f_t = 0.99$이면 50스텝 뒤에도 $0.99^{50} \approx 0.61$배가 남는다. 기본 RNN에서 스텝마다 0.9배가 되면 $0.9^{50} \approx 0.005$배인 것과 비교된다. 또 $f_t$는 고정된 값이 아니라 입력에 따라 게이트가 계산하므로, 어떤 시점의 정보를 유지하고 어떤 시점에 지울지를 학습한다.

[[diagram:lstm-cell-step]]

아래 코드는 LSTM 셀을 다섯 스텝 실행하며 forget gate와 셀 상태를 출력한다. 실제 구현처럼 게이트 4개의 가중치를 행렬 하나에 쌓아 한 번에 곱한 뒤 나눠 쓴다. forget gate의 편향을 크게(여기서는 3) 초기화하는 것도 실제로 쓰는 설정으로, 학습 초기에 셀 상태의 값을 유지하는 쪽에서 출발하게 한다.

\`\`\`python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

rng = np.random.default_rng(0)
d_x, d_h = 3, 2
Wall = rng.normal(size=(4 * d_h, d_x + d_h)) * 0.5   # 게이트 4개(f, i, c~, o)의 가중치: (4·d_h, d_x + d_h)
ball = np.zeros(4 * d_h)
ball[:d_h] = 3.0                                     # forget gate 편향을 크게 초기화

def lstm_step(x, h, c):
    z = Wall @ np.concatenate([x, h]) + ball
    f, i, o = sigmoid(z[:d_h]), sigmoid(z[d_h:2 * d_h]), sigmoid(z[3 * d_h:])
    c_tilde = np.tanh(z[2 * d_h:3 * d_h])
    c = f * c + i * c_tilde                          # 이전 셀 상태 × f + 후보 × i
    h = o * np.tanh(c)
    return h, c, f

h, c = np.zeros(d_h), np.array([1.0, -1.0])          # 셀 상태의 초깃값 [1, -1]
for t in range(5):
    h, c, f = lstm_step(rng.normal(size=d_x), h, c)
    print(f"t={t + 1}: f = {f.round(2)}, c = {c.round(2)}")
print("파라미터 수:", Wall.size + ball.size)          # 4 × (d_h·(d_x + d_h) + d_h) = 48
# t=1: f = [0.96 0.99], c = [ 1.1  -1.38]
# ...
# t=5: f = [0.94 0.95], c = [ 1.88 -1.12]
\`\`\`

$f$가 0.94~0.99로 1에 가까워, 처음 넣은 셀 상태 $[1, -1]$의 부호가 다섯 스텝 동안 유지된다. 게이트와 후보 4개가 각각 $d_h \times (d_x + d_h)$개의 가중치와 $d_h$개의 편향을 가지므로 파라미터 수는 $4(d_h(d_x + d_h) + d_h)$로, 같은 크기의 기본 RNN의 4배다.

[[diagram:lstm-retention]]

\`\`\`image
src: /images/week5/lstm-cell.png
alt: LSTM 셀의 내부 구조도. forget·input·output 게이트와 셀 상태, 은닉 상태의 흐름이 표시되어 있다
caption: 위쪽을 가로지르는 선이 셀 상태 c_t의 경로다. 시그모이드(σ) 게이트들이 셀 상태에서 지울 값(forget)과 더할 값(input), 은닉 상태로 출력할 값(output)을 정한다.
credit: fdeloche, CC BY-SA 4.0, Wikimedia Commons (C. Olah, "Understanding LSTM Networks"의 도식을 바탕으로 함)
width: 1200
height: 533
\`\`\`

### GRU

**GRU**(Gated Recurrent Unit)는 LSTM의 게이트와 상태를 줄인 구조다. 셀 상태와 은닉 상태를 은닉 상태 하나로 합치고, forget gate와 input gate를 **update gate** $z_t$ 하나로 합쳐 이전 상태를 $1 - z_t$만큼, 새 후보를 $z_t$만큼 섞는다. **reset gate** $r_t$는 새 후보를 계산할 때 이전 은닉 상태를 얼마나 반영할지 정한다.

\`\`\`math
z_t = \sigma(W_z x_t + U_z h_{t-1}), \qquad r_t = \sigma(W_r x_t + U_r h_{t-1})
\`\`\`
\`\`\`math
\tilde{h}_t = \tanh(W_h x_t + U_h(r_t \odot h_{t-1})), \qquad h_t = (1-z_t)\odot h_{t-1} + z_t \odot \tilde{h}_t
\`\`\`

GRU는 게이트와 후보가 3개(LSTM은 4개)이고 상태가 1개(LSTM은 $c_t$, $h_t$ 2개)이므로, 같은 크기에서 파라미터가 LSTM의 약 3/4이다. 파라미터가 적어 학습이 빠르고 데이터가 적을 때 과적합 위험이 작다. 셀 상태를 따로 두는 LSTM이 아주 긴 시퀀스에서 조금 더 낫다는 보고도 있지만, 두 구조의 성능 차이는 과제에 따라 다르다. 그래서 파라미터 수와 학습 속도를 고려해 GRU를 먼저 시도하는 경우가 많다.

[[diagram:gru-vs-lstm]]
`,
  checks: [
    {
      key: "c1",
      question: "LSTM에서 이전 셀 상태 $c_{t-1}$의 각 성분을 얼마나 남길지 정하는 것은?",
      choices: ["input gate $i_t$", "forget gate $f_t$", "output gate $o_t$", "후보 $\\tilde{c}_t$"],
      answer: 1,
      explanation: "forget gate의 성분이 0에 가까우면 그 성분의 값을 지우고, 1에 가까우면 유지한다.",
    },
    {
      key: "c2",
      question: "LSTM의 셀 상태 경로에서 RNN보다 기울기 소실이 적게 일어나는 이유는?",
      choices: ["게이트가 많아 파라미터가 많기 때문에", "셀 상태가 행렬 곱과 tanh 없이 성분별 곱과 덧셈으로 갱신되어, $f_t \\approx 1$이면 기울기가 거의 그대로 전달되기 때문에", "시그모이드가 항상 1을 출력하기 때문에", "은닉 상태를 사용하지 않기 때문에"],
      answer: 1,
      explanation: "셀 상태 경로에서 기울기에 곱해지는 값은 대략 $f_t$다. forget gate의 편향을 크게 해 $f$를 1에 가깝게 하면 40스텝 전의 영향도 유지되고, $f \\approx 0.5$이면 기본 RNN보다도 빨리 0에 가까워진다.",
    },
    {
      key: "c3",
      question: "GRU와 LSTM의 비교로 옳은 것은?",
      choices: ["GRU는 게이트 3개, 상태 2개를 쓴다", "GRU는 게이트 2개(update, reset)와 상태 1개를 쓰고, 같은 크기에서 파라미터가 LSTM의 약 3/4이다", "GRU는 게이트가 없다", "GRU가 항상 LSTM보다 정확하다"],
      answer: 1,
      explanation: "게이트와 후보가 GRU는 3개, LSTM은 4개이므로 같은 크기에서 파라미터 수의 비가 3:4다. 성능 차이는 과제에 따라 다르다.",
    },
    {
      key: "c4",
      question: "입력 차원 $d_x = 10$, 은닉 차원 $d_h = 20$인 LSTM의 파라미터 수는? (게이트·후보 4개, 편향 포함)",
      choices: ["2,480개", "620개", "1,860개", "2,400개"],
      answer: 0,
      explanation: "게이트와 후보 하나당 $20 \\times (10 + 20) + 20 = 620$개이고 4개이므로 2,480개다. 같은 크기의 기본 RNN(620개)의 4배, GRU(1,860개)의 4/3배다.",
    },
    {
      key: "c5",
      question: "LSTM에서 $f_t = 0$, $i_t = 1$이면 새 셀 상태 $c_t$는?",
      choices: ["이전 셀 상태를 모두 지우고 후보 $\\tilde{c}_t$가 된다", "이전 셀 상태 $c_{t-1}$이 그대로 유지된다", "0이 된다", "$c_{t-1} + \\tilde{c}_t$가 된다"],
      answer: 0,
      explanation: "$c_t = 0 \\cdot c_{t-1} + 1 \\cdot \\tilde{c}_t = \\tilde{c}_t$다. 반대로 $f_t = 1$, $i_t = 0$이면 $c_t = c_{t-1}$로 이전 값이 그대로 유지된다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "LSTM의 forget gate, input gate, output gate가 각각 정하는 것을 쓰고, 셀 상태의 갱신식 $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$가 RNN의 $h_t = f(Wx_t + Uh_{t-1} + b)$보다 기울기 소실이 적은 이유를 쓰라.",
      answer: md`
forget gate는 이전 셀 상태의 각 성분을 얼마나 남길지, input gate는 현재 입력으로 계산한 후보를 얼마나 더할지, output gate는 갱신된 셀 상태 중 얼마를 은닉 상태로 출력할지를 정한다.

RNN의 은닉 상태는 스텝마다 행렬 $U$를 곱하고 tanh를 거치므로, 역전파에서 야코비안이 시점 수만큼 곱해져 기울기가 지수적으로 작아지기 쉽다. LSTM의 셀 상태는 성분별 곱셈과 덧셈만으로 갱신되어, $c_{t-1}$에서 $c_t$로 가는 경로의 국소 미분이 대략 $f_t$다. forget gate가 1에 가깝게 학습되면 이 경로를 따라 기울기가 크게 줄지 않고 먼 시점까지 전달된다.
`,
      keyPoints: [
        "forget: 이전 셀 상태를 남길 비율, input: 후보를 더할 비율, output: 출력할 비율",
        "RNN은 스텝마다 행렬 곱과 tanh를 거쳐 기울기가 지수적으로 줄기 쉽다",
        "셀 상태 경로는 성분별 곱셈과 덧셈뿐이고 국소 미분이 대략 $f_t$다",
        "$f_t \\approx 1$이면 기울기가 먼 시점까지 전달된다",
      ],
    },
    {
      key: "d2",
      question: "forget gate의 편향이 0이면 LSTM에서 첫 시점의 영향이 기본 RNN보다도 빨리 사라지고, 편향을 2 이상으로 크게 하면 40스텝 뒤에도 유지되는 이유를 셀 상태의 갱신식으로 쓰라.",
      answer: md`
첫 시점의 값이 $T$스텝 뒤의 셀 상태에 전달되는 정도는 대략 forget gate 값들의 곱 $\prod_t f_t$에 비례한다. 셀 상태 경로에는 행렬 곱이나 tanh가 없고 성분별 곱셈과 덧셈만 있기 때문이다. 편향이 0이면 $f_t \approx \sigma(0) = 0.5$ 근처이므로 40스텝 뒤에는 $0.5^{40} \approx 10^{-12}$ 수준이 되어 기본 RNN보다도 빨리 0에 가까워진다. 편향을 2~4로 크게 하면 $f_t$가 약 0.88~0.98이 되어 곱이 천천히 줄어든다. 따라서 셀 상태가 값을 오래 유지하려면 $f_t \approx 1$이어야 하고, 그래서 실무에서는 forget gate의 편향을 1 이상으로 초기화한다.
`,
      keyPoints: [
        "첫 시점의 영향은 forget gate 값들의 곱에 비례한다",
        "셀 상태 경로에는 성분별 곱셈과 덧셈만 있다",
        "편향 0이면 $f \\approx 0.5$라 $0.5^{40} \\approx 10^{-12}$로 줄어든다",
        "편향을 크게 해 $f \\approx 1$이면 값이 유지된다",
      ],
    },
    {
      key: "d3",
      question: "GRU가 LSTM의 게이트와 상태를 어떻게 줄였는지 쓰고, 이 차이로 생기는 장단점을 쓰라.",
      answer: md`
GRU는 forget gate와 input gate를 update gate $z_t$ 하나로 합쳐 이전 상태를 $1 - z_t$만큼, 새 후보를 $z_t$만큼 섞고, reset gate $r_t$로 새 후보를 계산할 때 이전 상태를 얼마나 반영할지 정한다. 셀 상태와 은닉 상태도 은닉 상태 하나로 합쳤다. 게이트와 후보가 LSTM의 4개에서 3개로 줄어 같은 크기에서 파라미터가 약 3/4이므로, 학습이 빠르고 데이터가 적을 때 과적합 위험이 작다. 셀 상태를 따로 두는 LSTM이 아주 긴 시퀀스에서 조금 더 낫다는 보고도 있으나, 성능 차이는 과제에 따라 다르다.
`,
      keyPoints: [
        "forget과 input을 update gate 하나로 합쳤다",
        "reset gate가 이전 상태의 반영 정도를 정한다",
        "셀 상태와 은닉 상태를 하나로 합쳤다",
        "파라미터가 약 3/4이라 빠르지만, 긴 시퀀스에서는 LSTM이 나을 수 있다",
      ],
    },
  ],
  references: [
    { title: "Chris Olah — Understanding LSTM Networks", url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/", note: "LSTM의 게이트를 그림으로 설명한 글 (영문)" },
    { title: "d2l.ai — Long Short-Term Memory (LSTM)", url: "https://d2l.ai/chapter_recurrent-modern/lstm.html", note: "LSTM의 수식과 구현 (영문)" },
    { title: "Jozefowicz et al. (2015) — An Empirical Exploration of Recurrent Network Architectures", url: "https://proceedings.mlr.press/v37/jozefowicz15.pdf", note: "forget gate 편향을 1로 초기화하는 설정의 근거 (영문)" },
  ],
});
