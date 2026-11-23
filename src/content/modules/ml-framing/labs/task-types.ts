import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "답의 모양으로 문제 유형 정하기",
    prompt: md`

1. \`task\`: 질문마다 문제 유형을 적은 딕셔너리입니다. 값은 \`"회귀"\`, \`"분류"\`, \`"군집화"\`, \`"이상 탐지"\` 중 하나입니다.
   - \`"delivery_minutes"\`: 배달이 몇 분 걸릴지 예측한다.
   - \`"late_delivery"\`: 배달이 30분을 넘을지 예측한다.
   - \`"rider_groups"\`: 정답 없이 배달원을 운행 패턴이 비슷한 집단으로 묶는다.
   - \`"fraud_orders"\`: 정상 주문과 크게 다른 주문을 찾아 점수를 매긴다.
2. \`binary_decision(probs, threshold=0.5)\`: 양성 확률 리스트를 기준값 이상이면 1, 아니면 0인 리스트로 바꿉니다.
`,
    starter: py`
task = {"delivery_minutes": None, "late_delivery": None, "rider_groups": None, "fraud_orders": None}   # TODO

def binary_decision(probs, threshold=0.5):
    return []   # TODO

print(task)
print(binary_decision([0.2, 0.5, 0.9]), binary_decision([0.2, 0.5, 0.9], threshold=0.6))
`,
    tests: py`
@test("질문별 문제 유형")
def _():
    want = {"delivery_minutes": "회귀", "late_delivery": "분류", "rider_groups": "군집화", "fraud_orders": "이상 탐지"}
    wrong = [k for k in want if task.get(k) != want[k]]
    assert not wrong, f"다시 생각할 질문: {wrong}"

@test("기준값으로 판정")
def _():
    assert binary_decision([0.2, 0.5, 0.9]) == [0, 1, 1], f"결과: {binary_decision([0.2, 0.5, 0.9])}"
    assert binary_decision([0.2, 0.5, 0.9], threshold=0.6) == [0, 0, 1]
`,
    hints: [
      "같은 배달 데이터라도 분 단위의 수를 맞히면 회귀, 30분을 넘는지 여부를 맞히면 분류입니다.",
      "`[1 if p >= threshold else 0 for p in probs]`처럼 확률마다 비교합니다.",
    ],
    solution: py`
task = {"delivery_minutes": "회귀", "late_delivery": "분류", "rider_groups": "군집화", "fraud_orders": "이상 탐지"}

def binary_decision(probs, threshold=0.5):
    return [1 if p >= threshold else 0 for p in probs]

print(task)
print(binary_decision([0.2, 0.5, 0.9]), binary_decision([0.2, 0.5, 0.9], threshold=0.6))
`,
  },
  {
    key: "ex1",
    title: "문제 유형에 맞게 모델 출력을 판정으로 바꾸기",
    prompt: md`

모델이 내놓은 점수나 확률을 문제 유형에 맞는 답으로 바꿉니다. 모두 반복문 없이 NumPy로 씁니다.

1. \`softmax(scores)\`: 모양 \`(n, k)\`인 점수를 행마다 합이 1인 확률로 바꿉니다. 큰 점수에서 \`np.exp\`가 넘치지 않도록 **행마다 최댓값을 먼저 빼고** 계산합니다(결과는 같습니다).
2. \`multiclass_predict(scores)\`: 다중 분류의 예측(행마다 가장 큰 범주의 번호)
3. \`multilabel_predict(probs, threshold=0.5)\`: 다중 레이블 분류의 예측(범주마다 기준 이상이면 1인 정수 배열)
4. \`robust_anomalies(x, k=4.0)\`: 로버스트 z-점수 $\frac{x - \mathrm{median}}{1.4826 \cdot \mathrm{MAD}}$의 절댓값이 \`k\`보다 큰 원소의 인덱스 리스트
`,
    starter: py`
import numpy as np

def softmax(scores):
    s = np.asarray(scores, dtype=float)
    # TODO: 행마다 최댓값을 빼고 exp를 취한 뒤 행의 합으로 나눕니다(keepdims=True).
    return s

def multiclass_predict(scores):
    return np.zeros(len(scores), dtype=int)  # TODO

def multilabel_predict(probs, threshold=0.5):
    return np.zeros_like(np.asarray(probs), dtype=int)  # TODO

def robust_anomalies(x, k=4.0):
    x = np.asarray(x, dtype=float)
    # TODO: 중앙값, MAD(절대편차의 중앙값), 로버스트 z-점수
    return []

S = np.array([[2.0, 0.5, -1.0], [1000.0, 1001.0, 999.0]])
print(softmax(S).round(3))                        # 둘째 행도 nan 없이 계산되어야 합니다.
print(multiclass_predict(S))                      # 기대: [0 1]
print(multilabel_predict([[0.9, 0.2, 0.7]]))      # 기대: [[1 0 1]]
print(robust_anomalies([10, 11, 9, 10, 12, 10, 50]))   # 기대: [6]
`,
    tests: py`
import numpy as np

@test("softmax: 행마다 합이 1, 큰 점수에서도 nan이 없다")
def _():
    p = np.asarray(softmax(np.array([[2.0, 0.5, -1.0], [1000.0, 1001.0, 999.0]])))
    assert p.shape == (2, 3) and approx(p.sum(axis=1), [1, 1]), f"결과: {p}"
    assert not np.isnan(p).any(), "nan이 있습니다. 행마다 최댓값을 빼고 exp를 계산하십시오."
    assert approx(p[0], np.exp([2.0, 0.5, -1.0]) / np.exp([2.0, 0.5, -1.0]).sum())

@test("softmax: 점수에 같은 수를 더해도 결과가 같다")
def _():
    s = np.array([[0.1, 0.4, -0.3]])
    assert approx(softmax(s), softmax(s + 50))

@test("multiclass_predict: 행마다 가장 큰 범주")
def _():
    assert list(np.asarray(multiclass_predict(np.array([[2.0, 0.5, -1.0], [0.1, 3.0, 0.2]])))) == [0, 1]

@test("multilabel_predict: 범주마다 따로, 0개도 가능")
def _():
    got = np.asarray(multilabel_predict(np.array([[0.9, 0.2, 0.7], [0.1, 0.4, 0.3]])))
    assert got.tolist() == [[1, 0, 1], [0, 0, 0]], f"결과: {got.tolist()}"

@test("robust_anomalies: 동떨어진 값만 고른다")
def _():
    assert list(robust_anomalies([10, 11, 9, 10, 12, 10, 50])) == [6]
    rng = np.random.default_rng(0)
    x = np.append(rng.normal(100, 5, 200), [160, 30])
    assert list(robust_anomalies(x)) == [200, 201]
`,
    hints: [
      "`s = s - s.max(axis=1, keepdims=True)` 다음 `e = np.exp(s)`, `e / e.sum(axis=1, keepdims=True)`입니다.",
      "`multiclass_predict`는 `np.asarray(scores).argmax(axis=1)`, `multilabel_predict`는 `(np.asarray(probs) >= threshold).astype(int)`입니다.",
      "`med = np.median(x)`, `mad = np.median(np.abs(x - med))`, `z = (x - med) / (1.4826 * mad)` 다음 `np.where(np.abs(z) > k)[0].tolist()`입니다.",
    ],
    solution: py`
import numpy as np

def softmax(scores):
    s = np.asarray(scores, dtype=float)
    s = s - s.max(axis=1, keepdims=True)
    e = np.exp(s)
    return e / e.sum(axis=1, keepdims=True)

def multiclass_predict(scores):
    return np.asarray(scores).argmax(axis=1)

def multilabel_predict(probs, threshold=0.5):
    return (np.asarray(probs) >= threshold).astype(int)

def robust_anomalies(x, k=4.0):
    x = np.asarray(x, dtype=float)
    med = np.median(x)
    mad = np.median(np.abs(x - med))
    z = (x - med) / (1.4826 * mad)
    return np.where(np.abs(z) > k)[0].tolist()

S = np.array([[2.0, 0.5, -1.0], [1000.0, 1001.0, 999.0]])
print(softmax(S).round(3))
print(multiclass_predict(S))
print(multilabel_predict([[0.9, 0.2, 0.7]]))
print(robust_anomalies([10, 11, 9, 10, 12, 10, 50]))
`,
  },
]);
