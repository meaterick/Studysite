import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "역드롭아웃·학습률 스케줄·조기 종료 구현",
    prompt: md`

「딥러닝 학습 기법」 단계의 세 도구를 함수로 만듭니다.

1. \`dropout(h, p, rng, training)\`: \`training=True\`면 각 원소를 확률 \`p\`로 0으로 만들고 살아남은 값은 $\frac{1}{1-p}$배(역드롭아웃) 합니다. \`training=False\`면 \`h\`를 그대로 돌려줍니다. 마스크는 \`rng.random(h.shape) >= p\`로 만듭니다.
2. \`lr_at(step, total, warmup, lr_max, lr_min)\`: \`step < warmup\`이면 $\eta_{\max}\cdot\frac{\text{step}+1}{\text{warmup}}$, 그 뒤에는 코사인 감쇠 $\eta_{\min} + \frac{1}{2}(\eta_{\max} - \eta_{\min})(1 + \cos(\pi\cdot\frac{\text{step} - \text{warmup}}{\text{total} - \text{warmup}}))$
3. \`early_stop_epoch(val_losses, patience)\`: 검증 손실을 앞에서부터 보다가 최솟값이 \`patience\`번 연속으로 갱신되지 않으면 멈춘다고 할 때, **최종 모델로 고를 에폭 번호**(그때까지의 최솟값 위치, 0부터)를 돌려줍니다.
`,
    starter: py`
import numpy as np

def dropout(h, p, rng, training=True):
    # TODO: training이면 마스크를 곱하고 1/(1-p)배, 아니면 그대로
    return h

def lr_at(step, total=1000, warmup=100, lr_max=1e-3, lr_min=1e-5):
    # TODO: 선형 워밍업 뒤 코사인 감쇠
    return lr_max

def early_stop_epoch(val_losses, patience=3):
    best, best_epoch, waited = float("inf"), 0, 0
    for epoch, loss in enumerate(val_losses):
        pass  # TODO: 최솟값을 갱신하면 기록하고 waited=0, 아니면 waited += 1, patience에 닿으면 멈춤
    return best_epoch

rng = np.random.default_rng(0)
h = np.ones((4, 5))
print(dropout(h, 0.5, rng))
print({s: round(lr_at(s), 6) for s in (0, 99, 100, 550, 999)})
print(early_stop_epoch([0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5], patience=3))
`,
    tests: py`
import numpy as np

@test("학습 중: 꺼진 칸은 0, 살아남은 칸은 1/(1-p)배")
def _():
    rng = np.random.default_rng(1)
    out = dropout(np.ones((200, 50)), 0.2, rng, training=True)
    vals = set(np.round(np.unique(out), 6).tolist())
    assert vals <= {0.0, 1.25}, f"값의 종류: {sorted(vals)[:5]}"
    assert abs((out == 0).mean() - 0.2) < 0.02, f"꺼진 비율 {(out == 0).mean():.3f}"

@test("역드롭아웃은 평균을 유지한다")
def _():
    h = np.random.default_rng(2).random((5000, 40))
    out = dropout(h, 0.5, np.random.default_rng(3), training=True)
    assert abs(out.mean() - h.mean()) < 0.01, f"{h.mean():.4f} → {out.mean():.4f}"

@test("평가 때는 그대로 통과")
def _():
    h = np.arange(6.0).reshape(2, 3)
    assert np.array_equal(dropout(h, 0.5, np.random.default_rng(0), training=False), h)

@test("워밍업 구간: 0스텝 1e-5, 99스텝 1e-3")
def _():
    assert approx(lr_at(0), 1e-5) and approx(lr_at(99), 1e-3) and approx(lr_at(49), 5e-4)

@test("코사인 구간: 시작 1e-3, 중간 (max+min)/2, 끝 근처 1e-5")
def _():
    assert approx(lr_at(100), 1e-3) and approx(lr_at(550), 0.5 * (1e-3 + 1e-5)) and abs(lr_at(1000) - 1e-5) < 1e-9

@test("조기 종료: patience 3이면 2에폭을 고르고, 뒤의 0.5는 보지 못한다")
def _():
    losses = [0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5]
    assert early_stop_epoch(losses, patience=3) == 2, f"결과: {early_stop_epoch(losses, 3)}"
    assert early_stop_epoch(losses, patience=5) == 6, f"patience 5: {early_stop_epoch(losses, 5)}"
    assert early_stop_epoch([1.0, 0.9, 0.8], patience=2) == 2
`,
    hints: ["`mask = rng.random(h.shape) >= p`를 만든 뒤 `h * mask / (1 - p)`를 돌려줍니다.", "`progress = (step - warmup) / (total - warmup)`, `lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * progress))`", "반복문 안에서 `if loss < best: best, best_epoch, waited = loss, epoch, 0` / `else: waited += 1` 다음 `if waited >= patience: break`입니다."],
    solution: py`
import numpy as np

def dropout(h, p, rng, training=True):
    if not training:
        return h
    mask = rng.random(h.shape) >= p
    return h * mask / (1 - p)

def lr_at(step, total=1000, warmup=100, lr_max=1e-3, lr_min=1e-5):
    if step < warmup:
        return lr_max * (step + 1) / warmup
    progress = (step - warmup) / (total - warmup)
    return lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * progress))

def early_stop_epoch(val_losses, patience=3):
    best, best_epoch, waited = float("inf"), 0, 0
    for epoch, loss in enumerate(val_losses):
        if loss < best:
            best, best_epoch, waited = loss, epoch, 0
        else:
            waited += 1
            if waited >= patience:
                break
    return best_epoch

rng = np.random.default_rng(0)
h = np.ones((4, 5))
print(dropout(h, 0.5, rng))
print({s: round(lr_at(s), 6) for s in (0, 99, 100, 550, 999)})
print(early_stop_epoch([0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5], patience=3))
`,
  },
]);
