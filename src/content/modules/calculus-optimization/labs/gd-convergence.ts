import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "조건수로 학습률과 수렴 스텝 수 예측하기",
    prompt: md`

「경사하강법의 수렴 조건과 조건수」의 결론을 함수로 만들어, **실제로 돌려 보지 않고** 학습률의 상한과 필요한 스텝 수를 예측합니다. 이차 손실 $L(w) = \frac{1}{2}(w - w^*)^\top H (w - w^*)$에서 방향별 곡률은 헤세 행렬 $H$의 고유값입니다.

1. \`curvatures(H)\`: 대칭행렬 $H$의 고유값(오름차순)
2. \`max_stable_lr(a)\` $= 2 / a_{\max}$, \`best_lr(a)\` $= 2 / (a_{\max} + a_{\min})$
3. \`contraction(lr, a)\` $= \max_i |1 - \eta a_i|$: 한 스텝에 오차가 최대 몇 배가 되는가. 1 이상이면 발산합니다.
4. \`steps_needed(a, eps)\`: \`best_lr\`에서 오차가 처음으로 $\varepsilon$배 **미만**이 되는 스텝 수 $t$, 즉 $\rho^t < \varepsilon$인 가장 작은 $t$ ($\rho$는 그때의 \`contraction\`). $\rho = 0$이면 1스텝입니다.
5. \`newton_step(H, g, w)\` $= w - H^{-1} g$ (\`np.linalg.solve\`로 역행렬 없이 계산)

본문의 결과(조건수 1·10·100·1000에서 1·69·691·6908스텝, \`lr=0.11\`에서 발산)를 공식만으로 다시 얻는 것이 목표입니다.
`,
    starter: py`
import math
import numpy as np

def curvatures(H):
    return np.zeros(len(H))  # TODO: 대칭행렬의 고유값 (np.linalg.eigvalsh)

def max_stable_lr(a):
    return 0.0  # TODO

def best_lr(a):
    return 0.0  # TODO

def contraction(lr, a):
    return 0.0  # TODO: max |1 - lr * a_i|

def steps_needed(a, eps=1e-6):
    rho = contraction(best_lr(a), a)
    # TODO: rho == 0이면 1, 아니면 rho ** t < eps 인 가장 작은 t
    return 0

def newton_step(H, g, w):
    return np.asarray(w, dtype=float)  # TODO: w - H⁻¹ g

a = [2.0, 20.0]          # L = (w1 - 1)² + 10(w2 + 2)²의 곡률
print("안정 상한:", max_stable_lr(a), " 최선:", round(best_lr(a), 4))
for lr in (0.05, 0.09, 0.11):
    print(f"lr={lr}: 배율 {contraction(lr, a):.2f}")
for kappa in (1, 10, 100, 1000):
    print(f"κ={kappa:5d}: {steps_needed([float(kappa), 1.0])}스텝")
w = np.array([5.0, 5.0])
g = np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])
print("뉴턴 1스텝:", newton_step(np.diag(a), g, w))
`,
    tests: py`
import numpy as np

@test("헤세 행렬 [[3, 1], [1, 3]]의 곡률 = [2, 4]")
def _():
    assert approx(curvatures([[3.0, 1.0], [1.0, 3.0]]), [2.0, 4.0]), f"결과: {curvatures([[3.0, 1.0], [1.0, 3.0]])}"

@test("곡률 [2, 20]: 안정 상한 0.1, 최선 학습률 2/22")
def _():
    assert approx(max_stable_lr([2, 20]), 0.1) and approx(best_lr([2, 20]), 2 / 22)

@test("본문 실험과 일치: lr=0.09 수렴(배율 < 1), lr=0.11 발산(배율 1.2)")
def _():
    assert contraction(0.09, [2, 20]) < 1, f"0.09: {contraction(0.09, [2, 20])}"
    assert approx(contraction(0.11, [2, 20]), 1.2), f"0.11: {contraction(0.11, [2, 20])}"

@test("최선 학습률의 배율 = (κ-1)/(κ+1)")
def _():
    for amax, amin in [(20.0, 2.0), (100.0, 1.0), (7.0, 3.0)]:
        k = amax / amin
        assert approx(contraction(best_lr([amax, amin]), [amax, amin]), (k - 1) / (k + 1)), f"{amax}, {amin}"

@test("필요 스텝 수: κ = 1·10·100·1000 → 1·69·691·6908")
def _():
    got = [steps_needed([float(k), 1.0]) for k in (1, 10, 100, 1000)]
    assert got == [1, 69, 691, 6908], f"결과: {got}"

@test("예측이 실제 경사하강법 시뮬레이션과 같다 (κ = 50)")
def _():
    a = np.array([50.0, 1.0])
    lr, err, t = 2 / 51, np.ones(2), 0
    while np.abs(err).max() >= 1e-6:
        err, t = (1 - lr * a) * err, t + 1
    assert steps_needed([50.0, 1.0]) == t, f"예측 {steps_needed([50.0, 1.0])}, 실제 {t}"

@test("뉴턴 방법은 한 스텝에 (1, -2)에 도착한다")
def _():
    w = np.array([5.0, 5.0])
    g = np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])
    assert approx(newton_step(np.diag([2.0, 20.0]), g, w), [1.0, -2.0])
`,
    hints: ["`np.linalg.eigvalsh(np.asarray(H, dtype=float))`는 대칭행렬의 고유값을 오름차순으로 돌려줍니다.", "`contraction`은 `max(abs(1 - lr * ai) for ai in a)`입니다. `best_lr`에서는 가장 가파른 방향과 가장 완만한 방향의 배율 절댓값이 같아집니다.", "$\\rho^t < \\varepsilon$의 양변에 로그를 취하면 $t > \\ln\\varepsilon / \\ln\\rho$입니다($\\ln\\rho < 0$이라 부등호가 뒤집힘). 그런 가장 작은 정수는 `math.floor(math.log(eps) / math.log(rho)) + 1`입니다."],
    solution: py`
import math
import numpy as np

def curvatures(H):
    return np.linalg.eigvalsh(np.asarray(H, dtype=float))

def max_stable_lr(a):
    return 2 / max(a)

def best_lr(a):
    return 2 / (max(a) + min(a))

def contraction(lr, a):
    return max(abs(1 - lr * ai) for ai in a)

def steps_needed(a, eps=1e-6):
    rho = contraction(best_lr(a), a)
    if rho == 0:
        return 1
    return math.floor(math.log(eps) / math.log(rho)) + 1

def newton_step(H, g, w):
    return np.asarray(w, dtype=float) - np.linalg.solve(np.asarray(H, dtype=float), np.asarray(g, dtype=float))

a = [2.0, 20.0]
print("안정 상한:", max_stable_lr(a), " 최선:", round(best_lr(a), 4))
for lr in (0.05, 0.09, 0.11):
    print(f"lr={lr}: 배율 {contraction(lr, a):.2f}")
for kappa in (1, 10, 100, 1000):
    print(f"κ={kappa:5d}: {steps_needed([float(kappa), 1.0])}스텝")
w = np.array([5.0, 5.0])
g = np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])
print("뉴턴 1스텝:", newton_step(np.diag(a), g, w))
`,
  },
]);
