import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "스케일링 법칙으로 컴퓨트 최적 모델 크기 찾기",
    prompt: md`
재추정한 Chinchilla 상수 $E = 1.82$, $A = 482.01$, $B = 2085.43$, $\alpha = 0.3478$, $\beta = 0.3658$으로 계산합니다.

1. \`loss(N, D)\` $= E + A/N^\alpha + B/D^\beta$ (배열에도 동작)
2. \`compute(N, D)\` $= 6ND$
3. \`best_N(C)\`: 컴퓨트 $C$를 고정하면 $D = C/(6N)$입니다. $N$을 $10^9$~$10^{12}$에서 로그 간격 3,000개로 바꿔 가며 손실이 가장 작은 $N$을 찾습니다.
4. \`rule_of_thumb(C, ratio=20)\`: $D = 20N$을 대입해 푼 $(N, D)$

$C = 10^{23}$에서 두 방법이 모두 약 29B 근처를 가리키는지 확인합니다.
`,
    starter: py`
import numpy as np

E, A, B, alpha, beta = 1.82, 482.01, 2085.43, 0.3478, 0.3658

def loss(N, D):
    return 0.0  # TODO

def compute(N, D):
    return 0.0  # TODO

def best_N(C):
    Ns = np.logspace(9, 12, 3000)
    return 0.0  # TODO: 손실이 가장 작은 N

def rule_of_thumb(C, ratio=20):
    N = 0.0  # TODO: C = 6 · N · ratio · N
    return N, ratio * N

print("Gopher", loss(280e9, 300e9), " Chinchilla", loss(70e9, 1.4e12))
print(f"best N ≈ {best_N(1e23) / 1e9:.1f}B, 규칙 N ≈ {rule_of_thumb(1e23)[0] / 1e9:.1f}B")
`,
    tests: py`
import numpy as np

@test("Chinchilla(70B, 1.4T) 손실 ≈ 1.977 < Gopher(280B, 300B) ≈ 2.002")
def _():
    g, c = loss(280e9, 300e9), loss(70e9, 1.4e12)
    assert approx(c, 1.977, tol=2e-3) and approx(g, 2.002, tol=2e-3) and c < g, f"Gopher {g:.4f}, Chinchilla {c:.4f}"

@test("7B × 1.4조 토큰 학습 컴퓨트 = 5.88e22")
def _():
    assert approx(compute(7e9, 1.4e12), 5.88e22, tol=1e-9 * 5.88e22)

@test("C = 1e23의 손실 최소 N ≈ 29B (25~33B)")
def _():
    n = best_N(1e23)
    assert 25e9 < n < 33e9, f"결과: {n / 1e9:.1f}B"

@test("규칙 D = 20N: C = 1e23 → N ≈ 28.9B, D = 20N")
def _():
    N, D = rule_of_thumb(1e23)
    assert approx(N, np.sqrt(1e23 / 120), tol=1e3) and approx(D, 20 * N)

@test("컴퓨트가 100배면 최적 N은 약 10배")
def _():
    assert approx(rule_of_thumb(1e25)[0] / rule_of_thumb(1e23)[0], 10.0)
`,
    hints: ["`E + A / N ** alpha + B / D ** beta`. N, D가 배열이어도 그대로 동작합니다.", "`best_N`은 `Ns[np.argmin(loss(Ns, C / (6 * Ns)))]`입니다.", "$C = 6 \\cdot N \\cdot 20N = 120N^2$이므로 `N = np.sqrt(C / (6 * ratio))`"],
    solution: py`
import numpy as np

E, A, B, alpha, beta = 1.82, 482.01, 2085.43, 0.3478, 0.3658

def loss(N, D):
    return E + A / N ** alpha + B / D ** beta

def compute(N, D):
    return 6 * N * D

def best_N(C):
    Ns = np.logspace(9, 12, 3000)
    return float(Ns[np.argmin(loss(Ns, C / (6 * Ns)))])

def rule_of_thumb(C, ratio=20):
    N = np.sqrt(C / (6 * ratio))
    return N, ratio * N

print("Gopher", loss(280e9, 300e9), " Chinchilla", loss(70e9, 1.4e12))
print(f"best N ≈ {best_N(1e23) / 1e9:.1f}B, 규칙 N ≈ {rule_of_thumb(1e23)[0] / 1e9:.1f}B")
`,
  },
]);
