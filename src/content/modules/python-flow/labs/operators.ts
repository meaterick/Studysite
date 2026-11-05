import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "몫·나머지와 결과 서식",
    prompt: md`
:::info 실습 시작 코드 안내
함수(def·return)는 [[lesson:functions-scope]]에서 배웁니다. 지금은 함수의 구조를 유지하고 TODO 안에 이 레슨의 문법을 적용합니다. split·strip·lower 같은 문자열 메서드는 [[lesson:operators]]의 문자열 부분을 참고합니다.
:::


세 함수를 완성합니다.

1. \`split_seconds(total)\`: 초 단위 시간을 \`(시, 분, 초)\` 튜플로 바꿉니다. 3,725초는 \`(1, 2, 5)\`입니다.
2. \`batch_count(n, batch_size)\`: \`n\`개를 \`batch_size\`개씩 묶을 때의 묶음 수를 돌려줍니다. 마지막의 덜 찬 묶음도 하나로 셉니다. \`math\` 모듈 없이 \`//\`와 \`%\`만 씁니다.
3. \`report(name, acc, loss)\`: \`"모델 A | 정확도 84.6% | 손실 0.312"\` 형식의 문자열을 돌려줍니다. 정확도는 소수점 아래 한 자리 백분율, 손실은 소수점 아래 세 자리입니다.
`,
    starter: py`
def split_seconds(total):
    """초 단위 시간 → (시, 분, 초)"""
    hours = 0     # TODO: total을 3600으로 나눈 몫
    rest = 0      # TODO: total을 3600으로 나눈 나머지
    minutes = 0   # TODO: rest를 60으로 나눈 몫
    seconds = 0   # TODO: rest를 60으로 나눈 나머지
    return hours, minutes, seconds

def batch_count(n, batch_size):
    """n개를 batch_size개씩 묶을 때의 묶음 수(덜 찬 마지막 묶음 포함)"""
    return 0      # TODO: 꽉 찬 묶음 수(//)에, 남는 것(%)이 있으면 1을 더합니다.

def report(name, acc, loss):
    """'모델 A | 정확도 84.6% | 손실 0.312' 형식의 문자열"""
    return ""     # TODO: f-string과 서식 {acc:.1%}, {loss:.3f}를 씁니다.

print(split_seconds(3725))
print(batch_count(1000, 32))
print(report("모델 A", 0.84567, 0.312345))
`,
    tests: py`
@test("split_seconds(3725) == (1, 2, 5)")
def _():
    got = split_seconds(3725)
    assert got == (1, 2, 5), f"결과: {got}"

@test("경계값: 59초, 86399초")
def _():
    assert split_seconds(59) == (0, 0, 59), f"59초: {split_seconds(59)}"
    assert split_seconds(86399) == (23, 59, 59), f"86399초: {split_seconds(86399)}"

@test("batch_count: 1000개를 32개씩 → 32묶음")
def _():
    assert batch_count(1000, 32) == 32, f"결과: {batch_count(1000, 32)}"

@test("batch_count: 나누어떨어질 때, 1개, 0개")
def _():
    assert batch_count(96, 32) == 3, f"96개: {batch_count(96, 32)}"
    assert batch_count(1, 32) == 1, f"1개: {batch_count(1, 32)}"
    assert batch_count(0, 32) == 0, f"0개: {batch_count(0, 32)}"

@test("report 서식")
def _():
    got = report("모델 A", 0.84567, 0.312345)
    assert got == "모델 A | 정확도 84.6% | 손실 0.312", f"결과: {got!r}"
`,
    hints: [
      "`3725 // 3600`은 1, `3725 % 3600`은 125입니다. 남은 125초를 다시 60으로 나눕니다.",
      "남는 것이 있는지는 `n % batch_size > 0`으로 알 수 있습니다. 비교 결과 `True`는 더할 때 1로 계산됩니다.",
      "`f\"{name} | 정확도 {acc:.1%} | 손실 {loss:.3f}\"`처럼 중괄호 안에 서식을 씁니다.",
    ],
    solution: py`
def split_seconds(total):
    hours = total // 3600
    rest = total % 3600
    minutes = rest // 60
    seconds = rest % 60
    return hours, minutes, seconds

def batch_count(n, batch_size):
    return n // batch_size + (n % batch_size > 0)

def report(name, acc, loss):
    return f"{name} | 정확도 {acc:.1%} | 손실 {loss:.3f}"

print(split_seconds(3725))
print(batch_count(1000, 32))
print(report("모델 A", 0.84567, 0.312345))
`,
  },
]);
