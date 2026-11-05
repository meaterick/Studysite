import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "공분산·피어슨 상관계수·스피어먼 순위상관계수 구현하기",
    prompt: md`

NumPy 배열 두 개 \`x\`, \`y\`(길이 $n$)를 받는 함수를 구현합니다. \`np.cov\`, \`np.corrcoef\`는 쓰지 않습니다.

1. \`covariance(x, y)\`: 표본공분산 $\frac{1}{n - 1}\sum_i (x_i - \bar x)(y_i - \bar y)$
2. \`pearson(x, y)\`: 평균을 뺀 두 벡터의 코사인 유사도로 구한 피어슨 상관계수
3. \`ranks(x)\`: 각 값의 순위(가장 작은 값이 0). 같은 값은 없다고 가정합니다. \`np.argsort\`를 두 번 적용하면 순위가 나옵니다.
4. \`spearman(x, y)\`: 두 변수의 순위로 구한 피어슨 상관계수

이상치가 있는 데이터와 직선이 아닌 증가 관계에서 두 상관계수를 비교합니다.
`,
    starter: py`
import numpy as np

def covariance(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    # TODO
    return 0.0

def pearson(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    xc, yc = x - x.mean(), y - y.mean()
    # TODO: xc와 yc의 코사인 유사도
    return 0.0

def ranks(x):
    """가장 작은 값의 순위가 0"""
    # TODO: np.argsort(np.argsort(x))
    return np.zeros(len(x))

def spearman(x, y):
    # TODO: 순위로 pearson을 계산합니다.
    return 0.0

x = np.arange(1, 11, dtype=float)
print(round(pearson(x, np.exp(x)), 3), round(spearman(x, np.exp(x)), 3))   # 기대: 0.717 1.0
`,
    tests: py`
import numpy as np

hours = np.array([1, 2, 3, 4, 5], dtype=float)
score = np.array([52, 55, 61, 64, 68], dtype=float)

@test("본문 예제: 공분산 10.25, 상관계수 약 0.9944")
def _():
    assert approx(covariance(hours, score), 10.25), f"공분산: {covariance(hours, score)}"
    assert approx(pearson(hours, score), np.corrcoef(hours, score)[0, 1]), f"상관계수: {pearson(hours, score)}"

@test("임의의 데이터에서 np.cov, np.corrcoef와 같다")
def _():
    rng = np.random.default_rng(0)
    a, b = rng.normal(size=50), rng.normal(size=50) + 0.5 * np.arange(50) / 50
    assert approx(covariance(a, b), np.cov(a, b)[0, 1])
    assert approx(pearson(a, b), np.corrcoef(a, b)[0, 1])

@test("단위를 바꿔도(60배, +7) 상관계수는 같고 공분산은 60배")
def _():
    assert approx(pearson(hours * 60 + 7, score), pearson(hours, score))
    assert approx(covariance(hours * 60, score), 60 * covariance(hours, score))

@test("ranks([30, 10, 20]) = [2, 0, 1]")
def _():
    assert list(np.asarray(ranks(np.array([30, 10, 20])))) == [2, 0, 1], f"결과: {ranks(np.array([30, 10, 20]))}"

@test("증가하는 곡선 관계: 스피어먼은 1, 피어슨은 1보다 작다")
def _():
    x = np.arange(1, 11, dtype=float)
    assert approx(spearman(x, np.exp(x)), 1.0) and pearson(x, np.exp(x)) < 0.9

@test("이상치 하나: 피어슨은 크게 흔들리고 스피어먼은 덜 흔들린다")
def _():
    rng = np.random.default_rng(3)
    a, b = rng.normal(size=30), rng.normal(size=30)
    a2, b2 = np.append(a, 15.0), np.append(b, 15.0)
    dp = abs(pearson(a2, b2) - pearson(a, b))
    ds = abs(spearman(a2, b2) - spearman(a, b))
    assert dp > 0.5 and ds < dp, f"피어슨 변화 {dp:.3f}, 스피어먼 변화 {ds:.3f}"
`,
    hints: [
      "`covariance`는 `np.sum((x - x.mean()) * (y - y.mean())) / (len(x) - 1)`입니다.",
      "`pearson`은 `xc @ yc / (np.linalg.norm(xc) * np.linalg.norm(yc))`입니다.",
      "`spearman`은 `pearson(ranks(x), ranks(y))`입니다. 첫 `argsort`는 정렬 순서의 인덱스를, 두 번째 `argsort`는 각 값이 몇 번째인지를 줍니다.",
    ],
    solution: py`
import numpy as np

def covariance(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    return float(np.sum((x - x.mean()) * (y - y.mean())) / (len(x) - 1))

def pearson(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    xc, yc = x - x.mean(), y - y.mean()
    return float(xc @ yc / (np.linalg.norm(xc) * np.linalg.norm(yc)))

def ranks(x):
    return np.argsort(np.argsort(x))

def spearman(x, y):
    return pearson(ranks(x), ranks(y))

x = np.arange(1, 11, dtype=float)
print(round(pearson(x, np.exp(x)), 3), round(spearman(x, np.exp(x)), 3))
`,
  },
]);
