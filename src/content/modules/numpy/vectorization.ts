import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/vectorization";

export default defineLesson({
  id: "vectorization",
  title: "벡터화 연산과 난수 시드",
  tier: "core",
  concepts: ["vectorization-seeds"],
  goal: "파이썬 반복문으로 쓴 계산을 배열 연산으로 바꾸고(벡터화) 두 방법의 속도를 비교하며, 브로드캐스팅으로 모든 쌍의 거리를 계산하고, 난수 생성기와 시드로 실험을 재현한다.",
  why: "신경망 한 층의 계산, 미니배치 전체의 손실, 검색 시스템의 유사도 계산은 모두 샘플마다 반복하지 않고 배열 연산 한 번으로 처리한다([[lesson:matrix-multiplication]], [[lesson:retrieval]]). 데이터 분할·가중치 초기화·미니배치 순서에 쓰는 난수를 시드로 고정해야 실험 결과를 다시 만들고 비교할 수 있다([[lesson:notebooks-reproducibility]]).",
  body: md`
### 반복문과 벡터화

파이썬 반복문은 원소 하나를 처리할 때마다 그 값의 자료형을 확인하고 파이썬 객체를 만드는 일을 되풀이한다. 배열 연산은 같은 계산을 C로 구현된 반복문이 연속된 메모리 위에서 한 번에 처리한다. 반복문을 배열 연산으로 바꾸는 것을 **벡터화**라고 한다.

\`\`\`python
import time
import numpy as np

x = np.random.default_rng(0).random(200_000)
x @ x                                        # 첫 호출의 준비 시간이 측정에 섞이지 않도록 한 번 먼저 실행한다

start = time.perf_counter()
total = 0.0
for v in x:                                  # 원소마다 파이썬 반복
    total += v * v
loop_secs = time.perf_counter() - start

start = time.perf_counter()
total_vec = x @ x                            # 벡터화: 제곱의 합 = 자기 자신과의 내적
vec_secs = time.perf_counter() - start

print(np.isclose(total, total_vec))          # True: 결과는 같다
print(f"반복문 {loop_secs:.4f}초, 벡터화 {vec_secs:.6f}초, 약 {loop_secs / vec_secs:.0f}배 차이")
\`\`\`

배가 몇 배인지는 실행 환경에 따라 다르지만 보통 수십에서 수백 배다. 두 결과가 \`==\`가 아니라 \`np.isclose\`로 같은 것은, 더하는 순서가 달라 부동소수점 반올림 오차가 조금 다르기 때문이다.

### 반복문을 배열 연산으로 바꾸는 방법

자주 쓰는 바꾸기 방법은 다음과 같다.

| 반복문으로 하던 일 | 배열 연산 |
| --- | --- |
| 원소마다 같은 식 계산 | 원소별 연산, 유니버설 함수: \`3 * x ** 2 + 1\`, \`np.exp(x)\` |
| 합·평균·최댓값 구하기 | 집계 함수: \`x.sum()\`, \`X.mean(axis=0)\` |
| 조건에 따라 다른 값 | \`np.where(cond, a, b)\`, 마스크 대입 |
| 누적 합계 | \`np.cumsum(x)\` |
| 샘플마다 같은 행렬 곱 | 샘플을 쌓은 행렬과의 행렬곱 \`X @ W\` |
| 모든 쌍에 대한 계산 | 브로드캐스팅: $(n, 1, d)$와 $(1, m, d)$ |

마지막 경우를 예로 들면, 점 $n$개와 점 $m$개 사이의 모든 거리는 브로드캐스팅으로 한 번에 계산한다. \`A[:, None, :]\`는 모양 $(n, d)$를 $(n, 1, d)$로, \`B[None, :, :]\`는 $(m, d)$를 $(1, m, d)$로 바꾼다. 둘을 빼면 $(n, m, d)$가 되고, 마지막 축을 합치면 모든 쌍의 거리 제곱 $(n, m)$이 나온다.

\`\`\`python
rng = np.random.default_rng(1)
A = rng.normal(size=(5, 2))                  # 점 5개
B = rng.normal(size=(3, 2))                  # 점 3개

D_loop = np.zeros((5, 3))
for i in range(5):
    for j in range(3):
        D_loop[i, j] = np.sum((A[i] - B[j]) ** 2)

D_vec = ((A[:, None, :] - B[None, :, :]) ** 2).sum(axis=2)   # (5, 1, 2) - (1, 3, 2) → (5, 3, 2) → (5, 3)
print(D_vec.shape, np.allclose(D_loop, D_vec))               # (5, 3) True
print(D_vec.argmin(axis=1))                                   # A의 점마다 가장 가까운 B의 점
\`\`\`

이 방법은 $(n, m, d)$ 크기의 중간 배열을 만든다. $n = m = 10000$, $d = 100$이면 원소가 $10^{10}$개라 메모리가 부족하다. 이때는 $\lVert a - b \rVert^2 = \lVert a \rVert^2 + \lVert b \rVert^2 - 2\,a \cdot b$를 이용해 내적 부분을 행렬곱 \`A @ B.T\`로 계산하면 중간 배열이 $(n, m)$ 크기로 줄어든다([[lesson:dot-product]]). 아주 큰 데이터는 행을 몇 개씩 나누어 계산한다.

벡터화가 항상 가능한 것은 아니다. 다음 값이 바로 앞의 결과에 따라 정해지는 계산(예: 순환 신경망의 시간 단계, [[lesson:rnn]])은 원소끼리 독립이 아니라서 한 번에 계산할 수 없다. 이런 경우에도 그 안의 행렬곱 같은 부분은 벡터화한다.

### 난수 생성기와 시드

컴퓨터의 난수는 정해진 계산 규칙으로 만드는 **의사난수**다. 출발값인 **시드**(seed)가 같으면 항상 같은 순서의 수가 나온다. NumPy에서는 난수 생성기를 \`np.random.default_rng(시드)\`로 만들고, 이 생성기의 메서드로 난수를 뽑는다.

\`\`\`python
rng = np.random.default_rng(42)
print(rng.integers(1, 7, size=5))            # 주사위 5번
print(rng.normal(0, 1, size=3).round(3))     # 표준정규분포에서 3개
print(rng.permutation(5))                    # 0~4를 무작위 순서로

rng_a = np.random.default_rng(7)
rng_b = np.random.default_rng(7)
print(np.array_equal(rng_a.random(4), rng_b.random(4)))   # True: 시드가 같으면 같은 수열
\`\`\`

같은 생성기에서 계속 뽑으면 매번 다른 수가 나오지만, 프로그램을 처음부터 다시 실행하면 같은 수열이 나온다. 그래서 데이터 분할, 가중치 초기화, 미니배치 순서처럼 결과에 영향을 주는 무작위 과정은 시드를 정해 두고, 시드를 실험 기록에 남긴다. 예전 코드에서 보이는 \`np.random.seed(0)\`은 프로그램 전체가 공유하는 하나의 생성기를 고정하는 방식이다. 코드의 한 부분이 난수를 더 뽑으면 다른 부분의 결과까지 바뀌므로, 새 코드에서는 생성기를 만들어 필요한 곳에 넘기는 방식을 쓴다.

시드는 결과를 **재현**하기 위한 것이지 결과를 좋게 만드는 값이 아니다. 시드를 바꾸면 결과도 조금씩 달라지므로, 모델을 비교할 때는 시드 여러 개로 실험해 결과가 얼마나 흔들리는지 함께 보고한다([[lesson:research-methods]]).

:::warn 흔한 실수
- **반복문 안에서 매번 같은 시드로 생성기를 만든다.** \`np.random.default_rng(0)\`을 반복문 안에서 부르면 매번 같은 수가 나온다. 생성기는 한 번 만들어 계속 쓴다.
- **벡터화하면서 중간 배열의 크기를 확인하지 않는다.** 모든 쌍을 계산하는 브로드캐스팅은 메모리를 $n \times m \times d$만큼 쓴다.
- **부동소수점 결과를 \`==\`로 비교한다.** 계산 순서가 달라지면 마지막 자리가 달라질 수 있으므로 \`np.isclose\`, \`np.allclose\`를 쓴다.
- **시드 하나의 결과로 결론을 낸다.** 시드에 따른 차이가 모델 간 차이보다 클 수 있다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "같은 계산에서 NumPy 배열 연산이 파이썬 반복문보다 빠른 주된 이유는?",
      choices: [
        "원소마다 파이썬 객체를 처리하지 않고, C로 구현된 반복이 연속된 메모리에서 한 번에 계산하기 때문이다",
        "NumPy가 계산을 생략하고 근삿값을 쓰기 때문이다",
        "배열이 항상 GPU에서 계산되기 때문이다",
        "파이썬 반복문은 결과가 틀리기 때문이다",
      ],
      answer: 0,
      explanation: "결과는 같고(반올림 오차 정도의 차이), 원소마다의 파이썬 처리 비용이 없어서 빠르다. NumPy는 기본적으로 CPU에서 계산한다.",
    },
    {
      key: "c2",
      question: "`A`의 모양이 `(n, d)`, `B`의 모양이 `(m, d)`일 때 `A[:, None, :] - B[None, :, :]`의 모양은?",
      choices: ["`(n, m, d)`", "`(n, d)`", "`(n, m)`", "오류가 난다"],
      answer: 0,
      explanation: "`(n, 1, d)`와 `(1, m, d)`를 브로드캐스팅하면 `(n, m, d)`다. 마지막 축을 합치면 모든 쌍의 거리 제곱 `(n, m)`이 된다.",
    },
    {
      key: "c3",
      question: "다음 코드에서 `a`와 `b`의 관계로 옳은 것은? `rng = np.random.default_rng(3)`, `a = rng.random(3)`, `b = rng.random(3)`",
      choices: [
        "`a`와 `b`는 다르다. 같은 생성기에서 이어서 뽑았기 때문이다",
        "`a`와 `b`는 같다. 시드가 같기 때문이다",
        "실행할 때마다 `a`가 달라진다",
        "`b`는 항상 `a`의 역순이다",
      ],
      answer: 0,
      explanation: "같은 생성기에서 계속 뽑으면 수열의 다음 값들이 나온다. 프로그램을 다시 실행하면 `a`와 `b`가 각각 이전과 같은 값으로 재현된다.",
    },
    {
      key: "c4",
      question: "반복문 안에서 `rng = np.random.default_rng(0)`을 매번 실행하고 `rng.random()`을 뽑으면?",
      choices: ["매번 같은 값이 나온다", "매번 다른 값이 나온다", "오류가 난다", "값이 점점 커진다"],
      answer: 0,
      explanation: "같은 시드로 새 생성기를 만들면 수열의 처음부터 다시 시작한다. 생성기는 반복문 밖에서 한 번 만든다.",
    },
    {
      key: "c5",
      question: "점 10,000개끼리의 모든 거리를 특성 100개로 계산할 때 `(n, m, d)` 브로드캐스팅 대신 `‖a‖² + ‖b‖² − 2a·b`를 쓰는 이유는?",
      choices: [
        "중간 배열이 `(n, m, d)` 대신 `(n, m)` 크기가 되어 메모리를 크게 줄인다",
        "결과가 정확히 0이 되지 않게 하려고",
        "브로드캐스팅은 3차원에서 동작하지 않기 때문이다",
        "반복문을 써야 하기 때문이다",
      ],
      answer: 0,
      explanation: "`(n, m, d)`는 원소가 $10^{10}$개다. 내적 부분을 `A @ B.T`로 계산하면 중간 결과가 `(n, m)`이다. 부동소수점 오차로 아주 작은 음수가 나올 수 있어 0으로 자르기도 한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
a = np.random.default_rng(5).integers(0, 100, size=3)
b = np.random.default_rng(5).integers(0, 100, size=3)
rng = np.random.default_rng(5)
c, d = rng.integers(0, 100, size=3), rng.integers(0, 100, size=3)
print(np.array_equal(a, b), np.array_equal(a, c), np.array_equal(c, d))
`,
      expected: "True True False",
      explanation: "시드가 같은 새 생성기는 같은 수열의 처음부터 시작하므로 `a`, `b`, `c`는 같다. `d`는 같은 생성기에서 이어서 뽑은 다음 값들이라 `c`와 다르다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "머신러닝 실험에서 난수 시드를 고정하는 이유와, 시드를 고정해도 시드 하나의 결과로 두 모델을 비교하면 안 되는 이유를 설명하라. `np.random.seed`보다 `np.random.default_rng`로 만든 생성기를 넘겨 쓰는 방식이 나은 이유도 쓰라.",
      answer: md`
데이터 분할, 가중치 초기화, 미니배치 순서처럼 결과에 영향을 주는 무작위 과정을 시드로 고정하면, 같은 코드를 다시 실행했을 때 같은 결과가 나와 버그를 찾거나 설정을 바꾼 효과를 확인할 수 있다.

그러나 시드는 결과를 재현하는 값일 뿐 대표하는 값이 아니다. 시드를 바꾸면 결과도 달라지고, 그 차이가 두 모델의 차이보다 클 수 있다. 따라서 여러 시드로 실험해 평균과 흩어진 정도를 함께 보고 비교한다.

\`np.random.seed\`는 프로그램 전체가 공유하는 하나의 생성기를 고정하므로, 코드의 다른 부분에서 난수를 더 뽑으면 이후의 모든 결과가 바뀐다. \`default_rng\`로 만든 생성기를 필요한 곳에 넘기면 각 부분이 쓰는 난수가 분리되어, 한 부분을 고쳐도 다른 부분의 결과가 바뀌지 않는다.
`,
      keyPoints: ["시드 고정: 같은 코드를 다시 실행하면 같은 결과(재현성)", "시드에 따른 변동이 모델 차이보다 클 수 있어 여러 시드로 비교한다", "np.random.seed는 전역 생성기를 공유해 다른 코드의 영향을 받는다", "default_rng 생성기를 넘기면 난수 사용이 분리된다"],
    },
  ],
  references: [
    { title: "NumPy — Random sampling", url: "https://numpy.org/doc/stable/reference/random/index.html", note: "default_rng와 Generator 사용법, 예전 방식과의 차이 (영문)" },
    { title: "NumPy — Broadcasting", url: "https://numpy.org/doc/stable/user/basics.broadcasting.html", note: "모든 쌍 계산에 쓰는 브로드캐스팅 (영문)" },
  ],
});
