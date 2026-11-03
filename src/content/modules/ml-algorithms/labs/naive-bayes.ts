import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "나이브 베이즈의 사후확률, 스무딩, 로그 계산",
    prompt: md`

본문의 계산을 라이브러리 없이 구현합니다.

1. \`naive_bayes(priors, likelihoods)\`: 클래스마다 사전확률과 단어별 조건부확률을 모두 곱한 값을 구한 뒤, 합이 1이 되도록 나눈 사후확률 딕셔너리를 돌려줍니다.
2. \`laplace(count, total, n_values=2, alpha=1.0)\`: 라플라스 스무딩을 적용한 확률 $\dfrac{\text{count} + \alpha}{\text{total} + \alpha \cdot \text{n\_values}}$
3. \`predict_log(priors, likelihoods)\`: 곱 대신 $\log P(c) + \sum_i \log P(x_i \mid c)$가 가장 큰 클래스를 돌려줍니다. 확률이 수백 개여도 언더플로가 생기지 않아야 합니다.
`,
    starter: py`
import numpy as np

def naive_bayes(priors, likelihoods):
    """priors: {클래스: P(클래스)}, likelihoods: {클래스: [P(단어1|클래스), P(단어2|클래스), ...]}"""
    scores = {}
    for c in priors:
        scores[c] = 0.0  # TODO: 사전확률 × 조건부확률들의 곱
    total = sum(scores.values())
    return scores  # TODO: 합이 1이 되도록 나눈 딕셔너리

def laplace(count, total, n_values=2, alpha=1.0):
    return count / total  # TODO

def predict_log(priors, likelihoods):
    best, best_score = None, -np.inf
    for c in priors:
        score = 0.0  # TODO: log P(c) + Σ log P(x_i | c)
        if score > best_score:
            best, best_score = c, score
    return best

print(naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]}))   # 기대: 스팸 약 0.990
print(laplace(0, 70))                                                                      # 기대: 약 0.0139
`,
    tests: py`
import numpy as np

@test("스팸 예제: P(스팸 | 무료, 당첨) ≈ 0.9904")
def _():
    post = naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]})
    assert approx(post["스팸"], 0.072 / 0.0727, tol=1e-4), f"결과: {post}"
    assert approx(sum(post.values()), 1.0)

@test("클래스가 셋이어도 동작한다")
def _():
    post = naive_bayes({"a": 0.5, "b": 0.25, "c": 0.25}, {"a": [0.1], "b": [0.4], "c": [0.4]})
    assert approx([post["a"], post["b"], post["c"]], [0.2, 0.4, 0.4]), f"결과: {post}"

@test("laplace: 한 번도 없던 단어도 0이 아니다")
def _():
    assert approx(laplace(0, 70), 1 / 72) and approx(laplace(5, 10, n_values=3, alpha=0.5), 5.5 / 11.5)

@test("predict_log: 확률 400개를 곱해도 언더플로 없이 고른다")
def _():
    priors = {"A": 0.5, "B": 0.5}
    likes = {"A": [0.01] * 400, "B": [0.02] * 400}
    assert np.prod(likes["A"]) == 0.0, "이 예제에서는 곱이 0이 되어야 합니다."
    assert predict_log(priors, likes) == "B"
    assert predict_log({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]}) == "스팸"
`,
    hints: [
      "곱은 `priors[c] * float(np.prod(likelihoods[c]))`로 구하고, 마지막에 `{c: s / total for c, s in scores.items()}`로 나눕니다.",
      "`laplace`는 `(count + alpha) / (total + alpha * n_values)`입니다.",
      "`score = np.log(priors[c]) + np.sum(np.log(likelihoods[c]))`입니다.",
    ],
    solution: py`
import numpy as np

def naive_bayes(priors, likelihoods):
    scores = {}
    for c in priors:
        scores[c] = priors[c] * float(np.prod(likelihoods[c]))
    total = sum(scores.values())
    return {c: s / total for c, s in scores.items()}

def laplace(count, total, n_values=2, alpha=1.0):
    return (count + alpha) / (total + alpha * n_values)

def predict_log(priors, likelihoods):
    best, best_score = None, -np.inf
    for c in priors:
        score = np.log(priors[c]) + np.sum(np.log(likelihoods[c]))
        if score > best_score:
            best, best_score = c, score
    return best

print(naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]}))
print(laplace(0, 70))
`,
  },
]);
