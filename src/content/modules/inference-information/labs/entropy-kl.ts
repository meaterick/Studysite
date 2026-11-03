import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "엔트로피·교차 엔트로피·KL 발산 구현",
    prompt: md`

본문의 세 정의를 밑이 2인 로그(비트)로 구현합니다.

- $H(p) = -\sum_i p_i \log_2 p_i$ (단, $0 \cdot \log 0 = 0$)
- $H(p, q) = -\sum_i p_i \log_2 q_i$ ($p_i = 0$인 항은 기여하지 않음)
- $D_{\mathrm{KL}}(p \parallel q) = H(p, q) - H(p)$

확률이 0인 항 때문에 \`nan\`이 나오지 않도록 처리해야 합니다.
`,
    starter: py`
import numpy as np

def entropy(p):
    p = np.asarray(p, dtype=float)
    # TODO: 0인 항은 빼고(0·log0 = 0) -Σ p·log2(p) 를 계산합니다.
    return 0.0

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    # TODO: p > 0인 자리만 골라 -Σ p·log2(q) 를 계산합니다.
    return 0.0

def kl(p, q):
    # TODO: 교차 엔트로피 - 엔트로피
    return 0.0

fair, biased = [0.5, 0.5], [0.9, 0.1]
print("H(fair) =", entropy(fair), " H(biased) =", entropy(biased))
print("H(fair, biased) =", cross_entropy(fair, biased))
print("KL(fair‖biased) =", kl(fair, biased), " KL(biased‖fair) =", kl(biased, fair))
`,
    tests: py`
@test("H(공정한 동전) = 1비트, H([0.9, 0.1]) ≈ 0.469")
def _():
    assert approx(entropy([0.5, 0.5]), 1.0), f"H(fair) = {entropy([0.5, 0.5])}"
    assert approx(entropy([0.9, 0.1]), 0.4690, tol=1e-3), f"H(biased) = {entropy([0.9, 0.1])}"

@test("균등한 4가지 결과 → 2비트")
def _():
    assert approx(entropy([0.25] * 4), 2.0)

@test("확률 0인 결과가 있어도 nan이 아니다")
def _():
    assert approx(entropy([1.0, 0.0]), 0.0) and approx(entropy([0.5, 0.5, 0.0]), 1.0)

@test("H(fair, biased) ≈ 1.737, KL(fair‖biased) ≈ 0.737")
def _():
    assert approx(cross_entropy([0.5, 0.5], [0.9, 0.1]), 1.737, tol=1e-3)
    assert approx(kl([0.5, 0.5], [0.9, 0.1]), 0.737, tol=1e-3)

@test("KL은 비대칭: KL(biased‖fair) ≈ 0.531")
def _():
    assert approx(kl([0.9, 0.1], [0.5, 0.5]), 0.531, tol=1e-3), f"결과: {kl([0.9, 0.1], [0.5, 0.5])}"

@test("p가 0인 자리는 q가 0이어도 손실에 기여하지 않는다")
def _():
    assert approx(cross_entropy([1, 0], [1.0, 0.0]), 0.0)
`,
    hints: ["`p = p[p > 0]`처럼 불리언 인덱싱으로 0인 항을 걸러 낸 뒤 `-np.sum(p * np.log2(p))`를 계산합니다.", "교차 엔트로피는 `mask = p > 0`을 만들어 `-np.sum(p[mask] * np.log2(q[mask]))`로 씁니다. p와 q를 같은 자리에서 함께 골라야 합니다.", "`kl(p, q)`는 `cross_entropy(p, q) - entropy(p)` 한 줄입니다."],
    solution: py`
import numpy as np

def entropy(p):
    p = np.asarray(p, dtype=float)
    p = p[p > 0]
    return -np.sum(p * np.log2(p))

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    mask = p > 0
    return -np.sum(p[mask] * np.log2(q[mask]))

def kl(p, q):
    return cross_entropy(p, q) - entropy(p)

fair, biased = [0.5, 0.5], [0.9, 0.1]
print("H(fair) =", entropy(fair), " H(biased) =", entropy(biased))
print("H(fair, biased) =", cross_entropy(fair, biased))
print("KL(fair‖biased) =", kl(fair, biased), " KL(biased‖fair) =", kl(biased, fair))
`,
  },
]);
