import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "학습률 스케줄과 조기 종료 구현하기",
    prompt: md`
본문의 학습률 스케줄과 조기 종료를 함수로 만듭니다.

1. \`lr_at(step, total, warmup, lr_max, lr_min)\`: \`step < warmup\`이면 $\eta_{\max}\cdot\frac{\text{step}+1}{\text{warmup}}$, 그 뒤에는 코사인 감쇠 $\eta_{\min} + \frac{1}{2}(\eta_{\max} - \eta_{\min})\left(1 + \cos\left(\pi\cdot\frac{\text{step} - \text{warmup}}{\text{total} - \text{warmup}}\right)\right)$를 돌려줍니다.
2. \`early_stop_epoch(val_losses, patience)\`: 검증 손실을 앞에서부터 보다가 최솟값이 \`patience\`번 연속으로 갱신되지 않으면 멈춘다고 할 때, **최종 모델로 고를 에폭 번호**(멈출 때까지의 최솟값 위치, 0부터)를 돌려줍니다.
`,
    starter: py`
import numpy as np

def lr_at(step, total=1000, warmup=100, lr_max=1e-3, lr_min=1e-5):
    # TODO: 선형 워밍업 뒤 코사인 감쇠
    return lr_max

def early_stop_epoch(val_losses, patience=3):
    best, best_epoch, waited = float("inf"), 0, 0
    for epoch, loss in enumerate(val_losses):
        pass  # TODO: 최솟값을 갱신하면 기록하고 waited=0, 아니면 waited += 1, patience에 닿으면 멈춤
    return best_epoch

print({s: round(lr_at(s), 6) for s in (0, 99, 100, 550, 999)})
print(early_stop_epoch([0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5], patience=3))
`,
    tests: py`
import numpy as np

@test("워밍업 구간: 0스텝 1e-5, 49스텝 5e-4, 99스텝 1e-3")
def _():
    assert approx(lr_at(0), 1e-5) and approx(lr_at(49), 5e-4) and approx(lr_at(99), 1e-3)

@test("코사인 구간: 시작 1e-3, 가운데 (max+min)/2, 끝 1e-5")
def _():
    assert approx(lr_at(100), 1e-3) and approx(lr_at(550), 0.5 * (1e-3 + 1e-5)) and abs(lr_at(1000) - 1e-5) < 1e-9

@test("코사인 구간에서 학습률은 줄어들기만 한다")
def _():
    vals = [lr_at(s) for s in range(100, 1001, 50)]
    assert all(a >= b for a, b in zip(vals, vals[1:])), "학습률이 늘어나는 구간이 있습니다."

@test("조기 종료: patience 3이면 2에폭을 고르고, 뒤의 0.5는 보지 못한다")
def _():
    losses = [0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5]
    assert early_stop_epoch(losses, patience=3) == 2, f"결과: {early_stop_epoch(losses, 3)}"
    assert early_stop_epoch(losses, patience=5) == 6, f"patience 5: {early_stop_epoch(losses, 5)}"
    assert early_stop_epoch([1.0, 0.9, 0.8], patience=2) == 2
`,
    hints: [
      "워밍업 구간은 `lr_max * (step + 1) / warmup`입니다.",
      "`progress = (step - warmup) / (total - warmup)` 다음 `lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * progress))`입니다.",
      "반복문 안에서 `if loss < best: best, best_epoch, waited = loss, epoch, 0`, 아니면 `waited += 1` 다음 `if waited >= patience: break`입니다.",
    ],
    solution: py`
import numpy as np

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

print({s: round(lr_at(s), 6) for s in (0, 99, 100, 550, 999)})
print(early_stop_epoch([0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5], patience=3))
`,
  },
]);
