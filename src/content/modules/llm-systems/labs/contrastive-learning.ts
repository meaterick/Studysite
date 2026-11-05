import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "작은 CLIP의 대칭 대조 손실과 기울기",
    prompt: md`
본문에서 유도한 대칭 InfoNCE 손실과 그 기울기를 구현해, [[lesson:multimodal]]에서 다룬 CLIP을 작은 규모로 학습시킵니다. \`S\`는 이미 온도로 나눈 $N \times N$ 유사도 행렬이고, 대각선 $S_{kk}$가 정답 짝입니다.

\`clip_loss_grad(S)\`는 \`(loss, G)\`를 돌려줍니다.
- $P^{i}$: 행 방향 softmax(이미지 → 캡션), $P^{t}$: 열 방향 softmax(캡션 → 이미지)
- $\text{loss} = -\dfrac{1}{2}\left(\dfrac{1}{N}\sum_k \log P^{i}_{kk} + \dfrac{1}{N}\sum_k \log P^{t}_{kk}\right)$
- $G = \dfrac{\partial\,\text{loss}}{\partial S} = \dfrac{(P^{i} - I) + (P^{t} - I)}{2N}$

\`train\`은 이 함수로 두 선형 인코더를 함께 학습시키고 손실 기록과 학습 배치의 검색 정확도를 돌려줍니다. 학습 전 손실이 $\ln 32 \approx 3.47$ 근처인 이유도 분석하십시오.
`,
    starter: py`
import numpy as np

def softmax(S, axis):
    e = np.exp(S - S.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def clip_loss_grad(S):
    N = len(S)
    loss = 0.0              # TODO: 두 방향 softmax의 대각선 로그확률 평균
    G = np.zeros_like(S)    # TODO: ((Pi - I) + (Pt - I)) / (2N)
    return loss, G

def train(steps=300, N=32, tau=0.5, lr=0.05, seed=0):
    rng = np.random.default_rng(seed)
    A_img, A_txt = rng.normal(size=(8, 12)), rng.normal(size=(8, 10))
    Z = rng.normal(size=(N, 8))                                  # 같은 장면(잠재 의미)
    img = Z @ A_img + 0.1 * rng.normal(size=(N, 12))             # 이미지 특징
    txt = Z @ A_txt + 0.1 * rng.normal(size=(N, 10))             # 캡션 특징
    img, txt = (img - img.mean(0)) / img.std(0), (txt - txt.mean(0)) / txt.std(0)
    Wi, Wt = rng.normal(0, 0.1, (12, 8)), rng.normal(0, 0.1, (10, 8))
    losses = []
    for _ in range(steps):
        I, T = img @ Wi, txt @ Wt
        loss, G = clip_loss_grad(I @ T.T / tau)
        G = G / tau                                              # S = I T^T / tau 이므로 연쇄법칙
        Wi, Wt = Wi - lr * img.T @ (G @ T), Wt - lr * txt.T @ (G.T @ I)
        losses.append(loss)
    S = (img @ Wi) @ (txt @ Wt).T
    return losses, float(np.mean(S.argmax(1) == np.arange(N)))

losses, acc = train()
print(f"손실 {losses[0]:.3f} → {losses[-1]:.3f}, 학습 배치 검색 정확도 {acc:.2f}")
`,
    tests: py`
import numpy as np

@test("모든 점수가 같으면 손실 = ln N")
def _():
    loss, G = clip_loss_grad(np.zeros((4, 4)))
    assert approx(loss, np.log(4)), f"{loss:.4f}"
    assert approx(G[0, 0], -0.1875) and approx(G[0, 1], 0.0625), np.round(G, 4)

@test("기울기가 수치미분과 일치한다")
def _():
    rng = np.random.default_rng(1)
    S = rng.normal(size=(5, 5))
    _, G = clip_loss_grad(S)
    num = np.zeros_like(S)
    for i in range(5):
        for j in range(5):
            E = np.zeros_like(S)
            E[i, j] = 1e-5
            num[i, j] = (clip_loss_grad(S + E)[0] - clip_loss_grad(S - E)[0]) / 2e-5
    assert np.abs(num).max() > 1e-3, "손실이 S에 따라 변하지 않습니다. 손실부터 구현하십시오."
    assert np.allclose(G, num, atol=1e-6), f"최대 차이 {np.abs(G - num).max():.2e}"

@test("정답 짝 점수가 다른 점수보다 훨씬 크면 손실 ≈ 0")
def _():
    assert clip_loss_grad(20 * np.eye(4))[0] < 1e-6

@test("학습하면 손실이 3.4 이상에서 0.5 아래로, 검색 정확도가 0.8 이상")
def _():
    losses, acc = train(steps=300)
    assert losses[0] > 3.4 and losses[-1] < 0.5 and acc >= 0.8, f"손실 {losses[0]:.3f} → {losses[-1]:.3f}, 정확도 {acc:.2f}"
`,
    hints: ["`Pi, Pt = softmax(S, 1), softmax(S, 0)`, `idx = np.arange(N)`일 때 대각선은 `Pi[idx, idx]`입니다.", "`loss = -(np.log(Pi[idx, idx]).mean() + np.log(Pt[idx, idx]).mean()) / 2`, `G = ((Pi - np.eye(N)) + (Pt - np.eye(N))) / (2 * N)`", "cross-entropy를 logit으로 미분하면 '예측 확률 − 원핫'이 되는 softmax와 cross-entropy의 기울기(확률 − 원핫)를 두 방향에 각각 적용한 것입니다. 대각선은 $P - 1 < 0$이라 경사하강이 정답 짝 점수를 올리고, 나머지는 $P > 0$이라 내립니다."],
    solution: py`
import numpy as np

def softmax(S, axis):
    e = np.exp(S - S.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def clip_loss_grad(S):
    N = len(S)
    idx = np.arange(N)
    Pi, Pt = softmax(S, 1), softmax(S, 0)
    loss = -(np.log(Pi[idx, idx]).mean() + np.log(Pt[idx, idx]).mean()) / 2
    G = ((Pi - np.eye(N)) + (Pt - np.eye(N))) / (2 * N)
    return loss, G

def train(steps=300, N=32, tau=0.5, lr=0.05, seed=0):
    rng = np.random.default_rng(seed)
    A_img, A_txt = rng.normal(size=(8, 12)), rng.normal(size=(8, 10))
    Z = rng.normal(size=(N, 8))                                  # 같은 장면(잠재 의미)
    img = Z @ A_img + 0.1 * rng.normal(size=(N, 12))             # 이미지 특징
    txt = Z @ A_txt + 0.1 * rng.normal(size=(N, 10))             # 캡션 특징
    img, txt = (img - img.mean(0)) / img.std(0), (txt - txt.mean(0)) / txt.std(0)
    Wi, Wt = rng.normal(0, 0.1, (12, 8)), rng.normal(0, 0.1, (10, 8))
    losses = []
    for _ in range(steps):
        I, T = img @ Wi, txt @ Wt
        loss, G = clip_loss_grad(I @ T.T / tau)
        G = G / tau                                              # S = I T^T / tau 이므로 연쇄법칙
        Wi, Wt = Wi - lr * img.T @ (G @ T), Wt - lr * txt.T @ (G.T @ I)
        losses.append(loss)
    S = (img @ Wi) @ (txt @ Wt).T
    return losses, float(np.mean(S.argmax(1) == np.arange(N)))

losses, acc = train()
print(f"손실 {losses[0]:.3f} → {losses[-1]:.3f}, 학습 배치 검색 정확도 {acc:.2f}")
`,
  },
]);
