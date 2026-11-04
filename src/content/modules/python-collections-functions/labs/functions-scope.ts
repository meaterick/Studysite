import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "손실 함수와 평가 함수",
    prompt: md`

두 함수를 완성합니다.

1. \`mse(y_true, y_pred)\`: 같은 길이의 두 리스트에서 오차 제곱의 평균을 돌려줍니다.
2. \`evaluate(predict, xs, ys, metric)\`: 예측 함수 \`predict\`를 \`xs\`의 원소마다 적용해 예측 리스트를 만들고, \`metric(ys, 예측)\`의 값을 돌려줍니다. \`metric\`을 생략하면 \`mse\`를 씁니다.

\`evaluate\`는 함수를 인자로 받으므로, 예측 방식이나 지표를 바꿔도 \`evaluate\` 자체는 고칠 필요가 없습니다.
`,
    starter: py`
def mse(y_true, y_pred):
    """오차 제곱의 평균"""
    total = 0.0
    # TODO: zip(y_true, y_pred)로 짝지어 (y - p) ** 2를 더합니다.
    return total / len(y_true)

def evaluate(predict, xs, ys, metric=mse):
    """predict로 xs를 예측한 뒤 metric(ys, 예측)을 돌려준다"""
    preds = []
    # TODO: xs의 각 x에 predict(x)를 적용해 preds에 추가합니다.
    return metric(ys, preds)

def double(x):
    return 2 * x

print(mse([1, 2, 3], [1, 2, 5]))
print(evaluate(double, [1, 2, 3], [2, 4, 7]))
`,
    tests: py`
@test("mse([1, 2, 3], [1, 2, 5]) == 4/3")
def _():
    got = mse([1, 2, 3], [1, 2, 5])
    assert approx(got, 4 / 3), f"결과: {got}"

@test("예측이 모두 맞으면 mse는 0")
def _():
    assert approx(mse([0.5, 1.5], [0.5, 1.5]), 0.0)

@test("evaluate: 예측 함수를 원소마다 적용한다")
def _():
    got = evaluate(lambda x: 2 * x, [1, 2, 3], [2, 4, 7])
    assert approx(got, 1 / 3), f"결과: {got}"

@test("evaluate: 다른 지표 함수를 넘길 수 있다")
def _():
    def max_abs_error(ys, ps):
        return max(abs(y - p) for y, p in zip(ys, ps))
    got = evaluate(lambda x: x + 1, [0, 1, 2], [1, 3, 3], metric=max_abs_error)
    assert approx(got, 1.0), f"결과: {got}"
`,
    hints: [
      "`for y, p in zip(y_true, y_pred): total += (y - p) ** 2`로 오차 제곱을 더합니다.",
      "`for x in xs: preds.append(predict(x))`처럼 매개변수로 받은 함수를 그대로 호출합니다.",
      "`metric=mse`는 기본값으로 함수 객체를 넘기는 것입니다. 괄호 없이 이름만 씁니다.",
    ],
    solution: py`
def mse(y_true, y_pred):
    total = 0.0
    for y, p in zip(y_true, y_pred):
        total += (y - p) ** 2
    return total / len(y_true)

def evaluate(predict, xs, ys, metric=mse):
    preds = []
    for x in xs:
        preds.append(predict(x))
    return metric(ys, preds)

def double(x):
    return 2 * x

print(mse([1, 2, 3], [1, 2, 5]))
print(evaluate(double, [1, 2, 3], [2, 4, 7]))
`,
  },
]);
