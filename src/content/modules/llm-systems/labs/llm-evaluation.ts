import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "회귀 문항 찾기, 순서 바꿔 채점하기, Cohen's κ",
    prompt: md`

「평가」 단계의 회귀 확인과 채점관 점검을 함수로 만듭니다.

1. \`regression_report(v1, v2)\`: 문항별 정답 여부(0/1) 두 배열에서 \`{"acc1", "acc2", "fixed", "broken"}\`. \`fixed\`는 v1에서 틀리고 v2에서 맞힌 문항 번호 리스트, \`broken\`은 그 반대(회귀)입니다.
2. \`judge_both_orders(judge, a, b)\`: 같은 쌍을 \`judge(a, b)\`, \`judge(b, a)\` 순서로 두 번 채점합니다. \`judge\`는 먼저 제시된 답이 낫다고 보면 \`"A"\`, 아니면 \`"B"\`를 돌려줍니다. 두 판정이 같은 답을 가리키면 \`"a"\` 또는 \`"b"\`, 엇갈리면 \`None\`(판정 보류).
3. \`cohen_kappa(x, y)\`: 두 채점자 라벨의 일치도 $\kappa = \dfrac{p_o - p_e}{1 - p_e}$. $p_o$는 실제 일치율, $p_e = \sum_c p_x(c)\,p_y(c)$는 각자의 라벨 비율로 우연히 일치할 확률입니다. $p_e = 1$이면 1.0을 돌려줍니다.
`,
    starter: py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])

def regression_report(v1, v2):
    return {"acc1": 0.0, "acc2": 0.0, "fixed": [], "broken": []}  # TODO

def judge_both_orders(judge, a, b):
    return "a" if judge(a, b) == "A" else "b"  # TODO: 순서를 바꿔 한 번 더 채점하고, 엇갈리면 None

def cohen_kappa(x, y):
    return 0.0  # TODO

print(regression_report(v1, v2))
print(cohen_kappa([1, 1, 0, 0, 1, 0, 1, 1], [1, 0, 0, 0, 1, 0, 1, 1]))
`,
    tests: py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])

@test("v1 → v2: 정확도 0.75 → 0.85, 새로 맞힘 [3, 6, 10, 14], 회귀 [8, 16]")
def _():
    r = regression_report(v1, v2)
    assert approx(r["acc1"], 0.75) and approx(r["acc2"], 0.85), r
    assert list(r["fixed"]) == [3, 6, 10, 14] and list(r["broken"]) == [8, 16], r

@test("위치 편향 채점관: 순서를 바꿔 엇갈리면 None")
def _():
    judge = lambda qa, qb: "A" if qa + 0.8 > qb else "B"     # 먼저 제시된 답에 0.8 가산점
    assert judge_both_orders(judge, 0.5, 0.0) is None, judge_both_orders(judge, 0.5, 0.0)
    assert judge_both_orders(judge, 2.0, 0.0) == "a" and judge_both_orders(judge, 0.0, 2.0) == "b"

@test("Cohen's κ: 일치율 0.875, 우연 일치율 0.5 → κ = 0.75")
def _():
    x, y = [1, 1, 0, 0, 1, 0, 1, 1], [1, 0, 0, 0, 1, 0, 1, 1]
    assert approx(cohen_kappa(x, y), 0.75), cohen_kappa(x, y)
    assert approx(cohen_kappa(x, x), 1.0) and approx(cohen_kappa([1, 1], [1, 1]), 1.0)

@test("항상 같은 답만 내는 채점관은 일치율이 0.75여도 κ = 0")
def _():
    assert approx(cohen_kappa([1, 1, 1, 0], [1, 1, 1, 1]), 0.0), cohen_kappa([1, 1, 1, 0], [1, 1, 1, 1])
`,
    hints: ["`np.where((v1 == 0) & (v2 == 1))[0].tolist()`가 새로 맞힌 문항, `(v1 == 1) & (v2 == 0)`이 회귀 문항입니다.", "`first, second = judge(a, b), judge(b, a)`. `first == \"A\" and second == \"B\"`면 두 번 모두 a를 고른 것이고, `first == \"B\" and second == \"A\"`면 두 번 모두 b입니다.", "`x, y = np.asarray(x), np.asarray(y)`, `po = np.mean(x == y)`, `pe = sum(np.mean(x == c) * np.mean(y == c) for c in set(x) | set(y))`"],
    solution: py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])

def regression_report(v1, v2):
    v1, v2 = np.asarray(v1), np.asarray(v2)
    return {
        "acc1": float(v1.mean()),
        "acc2": float(v2.mean()),
        "fixed": np.where((v1 == 0) & (v2 == 1))[0].tolist(),
        "broken": np.where((v1 == 1) & (v2 == 0))[0].tolist(),
    }

def judge_both_orders(judge, a, b):
    first, second = judge(a, b), judge(b, a)
    if first == "A" and second == "B":
        return "a"
    if first == "B" and second == "A":
        return "b"
    return None

def cohen_kappa(x, y):
    x, y = np.asarray(x), np.asarray(y)
    po = np.mean(x == y)
    pe = sum(np.mean(x == c) * np.mean(y == c) for c in set(x.tolist()) | set(y.tolist()))
    if pe == 1:
        return 1.0
    return float((po - pe) / (1 - pe))

print(regression_report(v1, v2))
print(cohen_kappa([1, 1, 0, 0, 1, 0, 1, 1], [1, 0, 0, 0, 1, 0, 1, 1]))
`,
  },
]);
