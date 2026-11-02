import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "거듭제곱법과 저랭크 근사(에카르트-영 정리)",
    prompt: md`

「계수·노름·고유값·SVD」의 두 아이디어를 \`np.linalg.eig\` 없이 확인합니다.

**1. 거듭제곱법(power iteration).** 임의의 벡터 $v$를 고유벡터들의 합 $v = \sum_i c_i u_i$로 쓰면 $A^k v = \sum_i c_i \lambda_i^k u_i$입니다. 절댓값이 가장 큰 고유값 $\lambda_1$의 성분이 나머지보다 $(\lambda_1/\lambda_i)^k$배씩 빨리 커지므로, $v \leftarrow Av / \lVert Av \rVert$를 반복하면 $v$는 $u_1$ 방향으로 모입니다. 그때 고유값은 레일리 몫 $\lambda = v^\top A v$($v$는 단위벡터)입니다. 구글 PageRank, 신경망 가중치의 최대 특이값을 추정하는 스펙트럼 정규화가 이 방법을 씁니다.

**2. 저랭크 근사.** \`low_rank(M, r)\`는 SVD $M = U\Sigma V^\top$에서 큰 특이값 $r$개만 남긴 $U_r \Sigma_r V_r^\top$입니다. 에카르트-영 정리에 따르면 이것이 랭크 $r$ 행렬 중 $M$에 가장 가까운 행렬이고, 오차의 프로베니우스 노름은 버린 특이값들로 정해집니다.

$$\lVert M - M_r \rVert_F = \sqrt{\sigma_{r+1}^2 + \cdots + \sigma_n^2}$$

2주차 PCA가 "분산이 작은 방향을 버려도 정보 손실이 작다"고 말하는 근거입니다.
`,
    starter: py`
import numpy as np

def power_iteration(A, iters=100, seed=0):
    """절댓값이 가장 큰 고유값과 그 단위 고유벡터를 거듭제곱법으로 구한다. 반환: (고유값, 고유벡터)"""
    A = np.asarray(A, dtype=float)
    v = np.random.default_rng(seed).normal(size=A.shape[0])
    for _ in range(iters):
        pass  # TODO: v에 A를 곱한 뒤 길이 1로 정규화합니다.
    lam = 0.0  # TODO: 레일리 몫 v·(A v)
    return lam, v

def low_rank(M, r):
    """M의 특이값 중 큰 r개만 남긴 근사 행렬"""
    M = np.asarray(M, dtype=float)
    U, S, Vt = np.linalg.svd(M, full_matrices=False)
    return np.zeros_like(M)  # TODO: U의 앞 r개 열 · diag(S의 앞 r개) · Vt의 앞 r개 행

lam, v = power_iteration([[2, 1], [1, 2]])
print("최대 고유값:", round(lam, 6), " 고유벡터:", np.round(v, 4))

M = np.array([[3.0, 1.0], [1.0, 3.0], [0.0, 2.0]])
S = np.linalg.svd(M, compute_uv=False)
print("특이값:", np.round(S, 4))
print("랭크 1 근사 오차:", round(float(np.linalg.norm(M - low_rank(M, 1))), 4), " 버린 특이값:", round(float(S[1]), 4))
`,
    tests: py`
import numpy as np

@test("[[2, 1], [1, 2]]의 최대 고유값 3, 고유벡터 ∝ [1, 1]")
def _():
    lam, v = power_iteration([[2, 1], [1, 2]])
    assert approx(lam, 3.0), f"고유값: {lam}"
    assert approx(np.abs(v), [2 ** -0.5, 2 ** -0.5], 1e-6), f"고유벡터: {v}"

@test("3×3 대칭행렬: A v = λ v이고 λ는 가장 큰 고유값")
def _():
    A = np.array([[4.0, 1.0, 0.0], [1.0, 3.0, 1.0], [0.0, 1.0, 2.0]])
    lam, v = power_iteration(A, iters=200)
    assert approx(lam, np.linalg.eigvalsh(A).max(), 1e-6), f"고유값: {lam}"
    assert approx(A @ v, lam * v, 1e-6) and approx(np.linalg.norm(v), 1.0), "A v ≠ λ v 이거나 단위벡터가 아닙니다."

@test("full rank까지 남기면 원래 행렬 그대로")
def _():
    M = np.array([[3.0, 1.0], [1.0, 3.0], [0.0, 2.0]])
    assert approx(low_rank(M, 2), M), "랭크 2 근사가 원래 행렬과 다릅니다."

@test("에카르트-영: 오차 = √(버린 특이값 제곱의 합), 랭크 = r")
def _():
    M = np.random.default_rng(1).normal(size=(6, 4))
    S = np.linalg.svd(M, compute_uv=False)
    for r in (1, 2, 3):
        Mr = np.asarray(low_rank(M, r))
        assert Mr.shape == M.shape, f"shape: {Mr.shape}"
        assert np.linalg.matrix_rank(Mr) == r, f"r={r}: 랭크 {np.linalg.matrix_rank(Mr)}"
        assert approx(np.linalg.norm(M - Mr), np.sqrt(np.sum(S[r:] ** 2))), f"r={r}: 오차가 이론값과 다릅니다."

@test("SVD 근사가 '앞 r개 열만 남기기'보다 낫다")
def _():
    M = np.random.default_rng(2).normal(size=(5, 5))
    naive = M.copy()
    naive[:, 2:] = 0                       # 열 두 개만 남긴 랭크 2 행렬
    assert np.linalg.norm(M - low_rank(M, 2)) < np.linalg.norm(M - naive)
`,
    hints: ["반복문 안에서 `v = A @ v` 다음 `v = v / np.linalg.norm(v)`입니다. 정규화하지 않으면 값이 $\\lambda_1^k$로 커져 넘칩니다.", "레일리 몫은 `lam = v @ A @ v`입니다. `v`가 단위벡터이므로 분모 `v @ v`는 1입니다.", "`U[:, :r] @ np.diag(S[:r]) @ Vt[:r]`가 랭크 r 근사입니다."],
    solution: py`
import numpy as np

def power_iteration(A, iters=100, seed=0):
    A = np.asarray(A, dtype=float)
    v = np.random.default_rng(seed).normal(size=A.shape[0])
    for _ in range(iters):
        v = A @ v
        v = v / np.linalg.norm(v)
    lam = float(v @ A @ v)
    return lam, v

def low_rank(M, r):
    M = np.asarray(M, dtype=float)
    U, S, Vt = np.linalg.svd(M, full_matrices=False)
    return U[:, :r] @ np.diag(S[:r]) @ Vt[:r]

lam, v = power_iteration([[2, 1], [1, 2]])
print("최대 고유값:", round(lam, 6), " 고유벡터:", np.round(v, 4))

M = np.array([[3.0, 1.0], [1.0, 3.0], [0.0, 2.0]])
S = np.linalg.svd(M, compute_uv=False)
print("특이값:", np.round(S, 4))
print("랭크 1 근사 오차:", round(float(np.linalg.norm(M - low_rank(M, 1))), 4), " 버린 특이값:", round(float(S[1]), 4))
`,
  },
]);
