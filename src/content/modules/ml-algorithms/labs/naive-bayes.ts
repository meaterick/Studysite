import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "KNN 다수결과 나이브 베이즈를 직접 계산하기",
    prompt: md`

「KNN과 나이브 베이즈」 단계의 두 예제를 라이브러리 없이 구현합니다.

1. \`knn_predict(X_train, y_train, x, k)\`: 유클리드 거리가 가장 가까운 $k$개의 다수결 클래스를 돌려줍니다(\`np.argsort\`, \`np.bincount\` 활용).
2. \`naive_bayes(priors, likelihoods)\`: 클래스마다 사전확률과 단어별 조건부확률을 모두 곱한 값을 구한 뒤 합이 1이 되도록 정규화한 사후확률 딕셔너리를 돌려줍니다. 특징이 서로 조건부 독립이라는 "나이브" 가정이 곱셈 한 줄에 들어 있습니다.
`,
    starter: py`
import numpy as np

def knn_predict(X_train, y_train, x, k=3):
    X_train, x = np.asarray(X_train, dtype=float), np.asarray(x, dtype=float)
    dists = np.zeros(len(X_train))   # TODO: x와 모든 훈련 샘플 사이의 유클리드 거리
    nearest = []                     # TODO: 거리가 가까운 k개의 인덱스
    votes = np.asarray(y_train)[nearest]
    return 0                         # TODO: 다수결 (np.bincount(...).argmax())

def naive_bayes(priors, likelihoods):
    """priors: {클래스: P(클래스)}, likelihoods: {클래스: [P(단어1|클래스), P(단어2|클래스), ...]}"""
    scores = {}
    for c in priors:
        scores[c] = 0.0  # TODO: 사전확률 × 조건부확률들의 곱
    total = sum(scores.values())
    return scores  # TODO: 합이 1이 되도록 나눈 딕셔너리

X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]
print("KNN(k=3) 예측:", knn_predict(X_train, y_train, [2, 2], k=3))
print(naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]}))
`,
    tests: py`
import numpy as np
X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]

@test("본문 예제: (2, 2)는 k=3에서 클래스 0")
def _():
    assert int(knn_predict(X_train, y_train, [2, 2], k=3)) == 0

@test("(5.5, 5.2)는 클래스 1, k=1이면 가장 가까운 한 점의 클래스")
def _():
    assert int(knn_predict(X_train, y_train, [5.5, 5.2], k=3)) == 1
    assert int(knn_predict([[0, 0], [10, 10]], [3, 7], [9, 9], k=1)) == 7

@test("k를 키우면 먼 이웃까지 투표에 참여한다")
def _():
    Xt = [[0, 0], [0, 1], [4, 4], [4, 5], [5, 4]]
    yt = [0, 0, 1, 1, 1]
    assert int(knn_predict(Xt, yt, [1, 1], k=1)) == 0 and int(knn_predict(Xt, yt, [1, 1], k=5)) == 1

@test("스팸 예제: P(스팸 | 무료, 당첨) ≈ 0.9904")
def _():
    post = naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]})
    assert approx(post["스팸"], 0.072 / 0.0727, tol=1e-4), f"결과: {post}"
    assert approx(sum(post.values()), 1.0)

@test("클래스가 셋이어도 동작한다")
def _():
    post = naive_bayes({"a": 0.5, "b": 0.25, "c": 0.25}, {"a": [0.1], "b": [0.4], "c": [0.4]})
    assert approx([post["a"], post["b"], post["c"]], [0.2, 0.4, 0.4]), f"결과: {post}"
`,
    hints: ["거리는 `np.sqrt(((X_train - x) ** 2).sum(axis=1))`로 한 번에 구합니다(브로드캐스팅).", "`nearest = np.argsort(dists)[:k]`, 다수결은 `np.bincount(votes).argmax()`입니다.", "곱은 `prior * np.prod(likelihoods[c])`로 구하고, 마지막에 `{c: s / total for c, s in scores.items()}`로 정규화합니다."],
    solution: py`
import numpy as np

def knn_predict(X_train, y_train, x, k=3):
    X_train, x = np.asarray(X_train, dtype=float), np.asarray(x, dtype=float)
    dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))
    nearest = np.argsort(dists)[:k]
    votes = np.asarray(y_train)[nearest]
    return int(np.bincount(votes).argmax())

def naive_bayes(priors, likelihoods):
    scores = {}
    for c in priors:
        scores[c] = priors[c] * float(np.prod(likelihoods[c]))
    total = sum(scores.values())
    return {c: s / total for c, s in scores.items()}

X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]
print("KNN(k=3) 예측:", knn_predict(X_train, y_train, [2, 2], k=3))
print(naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]}))
`,
  },
]);
