import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "NumPy 축(axis)과 브로드캐스팅",
    prompt: md`

학생 4명, 과목 3개짜리 점수표로 축과 브로드캐스팅을 연습합니다. **반복문 없이** NumPy 연산만 씁니다.

1. \`subject_means(scores)\`: 과목별 평균, shape \`(과목 수,)\`
2. \`center_by_student(scores)\`: 학생(행)마다 자기 평균을 빼서 각 행의 평균이 0이 되게 합니다. 브로드캐스팅이 행 방향으로 맞으려면 \`keepdims=True\`가 필요합니다(「NumPy 첫걸음: 배열·축·브로드캐스팅」 단계 참고).
3. \`count_high(scores, threshold)\`: \`threshold\` 이상인 칸의 개수(불리언 배열 활용)
`,
    starter: py`
import numpy as np

scores = np.array([[90, 80, 70],
                   [60, 90, 80],
                   [85, 75, 95],
                   [70, 60, 90]])   # (학생 4명, 과목 3개)

def subject_means(scores):
    """과목별 평균, shape (과목 수,)"""
    return None  # TODO: mean의 axis를 골라 씁니다.

def center_by_student(scores):
    """각 학생(행)의 평균을 빼서 행 평균이 0이 되게 한다. shape은 그대로"""
    return None  # TODO: keepdims=True로 (학생 수, 1) 모양의 평균을 만들어 뺍니다.

def count_high(scores, threshold=80):
    """threshold 이상인 칸의 개수"""
    return None  # TODO: 불리언 배열 scores >= threshold 를 활용합니다.

print(subject_means(scores))
print(center_by_student(scores))
print(count_high(scores))
`,
    tests: py`
import numpy as np
S = np.array([[90, 80, 70], [60, 90, 80], [85, 75, 95], [70, 60, 90]])

@test("과목별 평균 = [76.25, 76.25, 83.75]")
def _():
    m = subject_means(S)
    assert m is not None and np.shape(m) == (3,), f"shape: {np.shape(m)}"
    assert approx(m, [76.25, 76.25, 83.75]), f"결과: {m}"

@test("학생별 중심화: shape 유지, 각 행 평균 0")
def _():
    c = center_by_student(S)
    assert c is not None and np.shape(c) == (4, 3), f"shape: {np.shape(c)}"
    assert approx(np.asarray(c).mean(axis=1), [0, 0, 0, 0])

@test("열 평균이 아니라 행 평균을 뺐다")
def _():
    c = np.asarray(center_by_student(S))
    assert approx(c[0], [10, 0, -10]), f"첫 학생 결과: {c[0]}"

@test("80점 이상 7칸, 90점 이상 4칸")
def _():
    assert count_high(S) == 7, f"count_high(S) = {count_high(S)}"
    assert count_high(S, 90) == 4, f"count_high(S, 90) = {count_high(S, 90)}"

@test("다른 크기(3×4)에도 그대로 동작")
def _():
    R = np.arange(12).reshape(3, 4)
    assert np.shape(subject_means(R)) == (4,) and approx(subject_means(R), R.mean(axis=0))
    assert approx(np.asarray(center_by_student(R)).mean(axis=1), [0, 0, 0])
`,
    hints: ["axis=0은 행 방향으로 훑어 같은 열끼리 묶고, axis=1은 열 방향으로 훑어 같은 행끼리 묶습니다. 과목은 열입니다.", "`scores.mean(axis=1)`의 shape은 (4,)라서 (4, 3)에서 빼면 뒤쪽 축(3 ≠ 4)이 맞지 않습니다. `scores.mean(axis=1, keepdims=True)`는 (4, 1)이 되어 열 방향으로 복제됩니다.", "`scores >= threshold`는 True/False 배열입니다. True는 1로 계산되므로 `.sum()`을 붙이면 개수가 됩니다."],
    solution: py`
import numpy as np

scores = np.array([[90, 80, 70],
                   [60, 90, 80],
                   [85, 75, 95],
                   [70, 60, 90]])

def subject_means(scores):
    return scores.mean(axis=0)

def center_by_student(scores):
    return scores - scores.mean(axis=1, keepdims=True)

def count_high(scores, threshold=80):
    return int((scores >= threshold).sum())

print(subject_means(scores))
print(center_by_student(scores))
print(count_high(scores))
`,
  },
]);
