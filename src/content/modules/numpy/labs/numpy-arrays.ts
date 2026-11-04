import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "점수표를 축별로 요약하기",
    prompt: md`

행이 학생, 열이 과목인 점수표(모양 \`(학생 수, 과목 수)\`)를 **반복문 없이** NumPy 연산으로 요약합니다.

1. \`subject_means(scores)\`: 과목별 평균, 모양 \`(과목 수,)\`
2. \`student_totals(scores)\`: 학생별 총점, 모양 \`(학생 수,)\`
3. \`top_student_per_subject(scores)\`: 과목마다 점수가 가장 높은 학생의 번호(행 번호), 모양 \`(과목 수,)\`
4. \`to_ratio(scores, max_score)\`: 각 점수를 만점에 대한 비율(0~1의 실수)로 바꾼 배열. 결과의 자료형은 \`float64\`여야 합니다.
`,
    starter: py`
import numpy as np

scores = np.array([[90, 80, 70],
                   [60, 90, 80],
                   [85, 75, 95],
                   [70, 60, 90]])   # (학생 4명, 과목 3개)

def subject_means(scores):
    return None  # TODO: 학생 축을 합칩니다.

def student_totals(scores):
    return None  # TODO: 과목 축을 합칩니다.

def top_student_per_subject(scores):
    return None  # TODO: argmax의 axis를 고릅니다.

def to_ratio(scores, max_score=100):
    return None  # TODO: 실수 나눗셈

print(subject_means(scores))             # 기대: [76.25 76.25 83.75]
print(student_totals(scores))            # 기대: [240 230 255 220]
print(top_student_per_subject(scores))   # 기대: [0 1 2]
print(to_ratio(scores))                  # 기대: 첫 행이 [0.9 0.8 0.7]인 실수 배열
`,
    tests: py`
import numpy as np
S = np.array([[90, 80, 70], [60, 90, 80], [85, 75, 95], [70, 60, 90]])

@test("과목별 평균 = [76.25, 76.25, 83.75], 모양 (3,)")
def _():
    m = subject_means(S)
    assert m is not None and np.shape(m) == (3,), f"모양: {np.shape(m)}"
    assert approx(m, [76.25, 76.25, 83.75]), f"결과: {m}"

@test("학생별 총점 = [240, 230, 255, 220], 모양 (4,)")
def _():
    t = student_totals(S)
    assert t is not None and np.shape(t) == (4,), f"모양: {np.shape(t)}"
    assert list(np.asarray(t)) == [240, 230, 255, 220], f"결과: {t}"

@test("과목별 최고점 학생 = [0, 1, 2]")
def _():
    got = top_student_per_subject(S)
    assert got is not None and list(np.asarray(got)) == [0, 1, 2], f"결과: {got}"

@test("비율 배열: float64, 0~1, 첫 행 [0.9, 0.8, 0.7]")
def _():
    r = to_ratio(S)
    assert r is not None and np.asarray(r).dtype == np.float64, f"자료형: {np.asarray(r).dtype if r is not None else None}"
    assert approx(np.asarray(r)[0], [0.9, 0.8, 0.7]) and np.asarray(r).max() <= 1

@test("다른 크기(3×4)에도 그대로 동작")
def _():
    R = np.arange(12).reshape(3, 4)
    assert np.shape(subject_means(R)) == (4,) and approx(subject_means(R), R.mean(axis=0))
    assert np.shape(student_totals(R)) == (3,) and list(np.asarray(top_student_per_subject(R))) == [2, 2, 2, 2]
`,
    hints: [
      "결과에서 사라질 축을 지정합니다. 과목별 값이 필요하면 학생 축 `axis=0`, 학생별 값이 필요하면 `axis=1`입니다.",
      "`scores.argmax(axis=0)`은 열(과목)마다 가장 큰 값이 있는 행 번호를 돌려줍니다.",
      "`/`는 정수 배열을 나눠도 실수 배열을 돌려줍니다. `scores / max_score`이면 됩니다.",
    ],
    solution: py`
import numpy as np

scores = np.array([[90, 80, 70],
                   [60, 90, 80],
                   [85, 75, 95],
                   [70, 60, 90]])

def subject_means(scores):
    return scores.mean(axis=0)

def student_totals(scores):
    return scores.sum(axis=1)

def top_student_per_subject(scores):
    return scores.argmax(axis=0)

def to_ratio(scores, max_score=100):
    return scores / max_score

print(subject_means(scores))
print(student_totals(scores))
print(top_student_per_subject(scores))
print(to_ratio(scores))
`,
  },
]);
