import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "확인용 그래프를 만드는 함수 작성하기",
    prompt: md`

데이터를 받을 때마다 같은 그래프를 다시 그리지 않도록, 그래프를 만들어 \`Figure\`를 돌려주는 함수를 작성합니다. 그래프 안의 글자는 영문으로 씁니다.

1. \`hist_panel(df, col, bins_list)\`: \`bins_list\`의 구간 수마다 히스토그램을 하나씩 가로로 놓은 그림. 각 그래프의 제목은 \`"bins=구간 수"\`, 가로축 이름은 \`col\`입니다.
2. \`group_boxplot(df, value_col, group_col, order)\`: \`order\` 순서대로 범주별 상자그림을 그린 그림. 가로축 눈금 글자는 범주 이름, 세로축 이름은 \`value_col\`입니다.
3. \`corr_heatmap(df, cols)\`: \`cols\`의 상관행렬을 색 범위 $-1$~$1$로 그린 그림과 상관행렬을 \`(fig, corr)\`로 돌려줍니다.
`,
    starter: py`
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

rng = np.random.default_rng(1)
df = pd.DataFrame({
    "group": rng.choice(["a", "b", "c"], size=200),
    "x": rng.normal(0, 1, 200),
})
df["y"] = 2 * df["x"] + rng.normal(0, 1, 200)
df["z"] = rng.lognormal(0, 0.8, 200)

def hist_panel(df, col, bins_list):
    fig, axes = plt.subplots(1, len(bins_list), figsize=(4 * len(bins_list), 3))
    axes = np.atleast_1d(axes)
    # TODO: axes[i]에 bins_list[i]개 구간의 히스토그램, 제목과 가로축 이름
    return fig

def group_boxplot(df, value_col, group_col, order):
    fig, ax = plt.subplots()
    # TODO: order 순서대로 범주별 값 목록을 boxplot에 넘기고 눈금 글자·세로축 이름을 정합니다.
    return fig

def corr_heatmap(df, cols):
    corr = df[cols].corr()
    fig, ax = plt.subplots()
    # TODO: ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
    return fig, corr

hist_panel(df, "z", [5, 30])
group_boxplot(df, "y", "group", ["a", "b", "c"])
fig, corr = corr_heatmap(df, ["x", "y", "z"])
print(corr.round(2))
plt.show()
`,
    tests: py`
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

rng = np.random.default_rng(1)
D = pd.DataFrame({"group": rng.choice(["a", "b", "c"], size=200), "x": rng.normal(0, 1, 200)})
D["y"] = 2 * D["x"] + rng.normal(0, 1, 200)

@test("hist_panel: 그래프 3개, 제목 bins=5·10·30, 가로축 이름 x")
def _():
    fig = hist_panel(D, "x", [5, 10, 30])
    titles = [ax.get_title() for ax in fig.axes]
    assert titles == ["bins=5", "bins=10", "bins=30"], f"제목: {titles}"
    assert all(ax.get_xlabel() == "x" for ax in fig.axes), "가로축 이름이 다릅니다."
    assert all(len(ax.patches) == b for ax, b in zip(fig.axes, [5, 10, 30])), f"막대 수: {[len(ax.patches) for ax in fig.axes]}"
    plt.close("all")

@test("group_boxplot: 범주 순서대로 눈금 글자, 세로축 이름")
def _():
    fig = group_boxplot(D, "y", "group", ["c", "a", "b"])
    ax = fig.axes[0]
    labels = [t.get_text() for t in ax.get_xticklabels()]
    assert labels == ["c", "a", "b"], f"눈금 글자: {labels}"
    assert ax.get_ylabel() == "y", f"세로축 이름: {ax.get_ylabel()}"
    plt.close("all")

@test("corr_heatmap: 상관행렬 값과 색 범위 −1~1")
def _():
    fig, corr = corr_heatmap(D, ["x", "y"])
    assert approx(corr.loc["x", "y"], D["x"].corr(D["y"])), f"상관계수: {corr}"
    images = fig.axes[0].images
    assert len(images) == 1 and tuple(images[0].get_clim()) == (-1, 1), f"색 범위: {images[0].get_clim() if images else None}"
    plt.close("all")
`,
    hints: [
      "`for ax, b in zip(axes, bins_list):` 안에서 `ax.hist(df[col], bins=b)`, `ax.set_title(f'bins={b}')`, `ax.set_xlabel(col)`를 차례로 부릅니다.",
      "`ax.boxplot([df.loc[df[group_col] == g, value_col] for g in order])` 다음 `ax.set_xticks(range(1, len(order) + 1), order)`, `ax.set_ylabel(value_col)`입니다.",
      "`ax.imshow(corr, cmap='RdBu_r', vmin=-1, vmax=1)`가 색 범위를 고정합니다. 눈금 글자는 `ax.set_xticks(range(len(cols)), cols)`로 붙입니다.",
    ],
    solution: py`
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

rng = np.random.default_rng(1)
df = pd.DataFrame({
    "group": rng.choice(["a", "b", "c"], size=200),
    "x": rng.normal(0, 1, 200),
})
df["y"] = 2 * df["x"] + rng.normal(0, 1, 200)
df["z"] = rng.lognormal(0, 0.8, 200)

def hist_panel(df, col, bins_list):
    fig, axes = plt.subplots(1, len(bins_list), figsize=(4 * len(bins_list), 3))
    axes = np.atleast_1d(axes)
    for ax, b in zip(axes, bins_list):
        ax.hist(df[col], bins=b)
        ax.set_title(f"bins={b}")
        ax.set_xlabel(col)
    return fig

def group_boxplot(df, value_col, group_col, order):
    fig, ax = plt.subplots()
    ax.boxplot([df.loc[df[group_col] == g, value_col] for g in order])
    ax.set_xticks(range(1, len(order) + 1), order)
    ax.set_ylabel(value_col)
    return fig

def corr_heatmap(df, cols):
    corr = df[cols].corr()
    fig, ax = plt.subplots()
    im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
    ax.set_xticks(range(len(cols)), cols)
    ax.set_yticks(range(len(cols)), cols)
    fig.colorbar(im)
    return fig, corr

hist_panel(df, "z", [5, 30])
group_boxplot(df, "y", "group", ["a", "b", "c"])
fig, corr = corr_heatmap(df, ["x", "y", "z"])
print(corr.round(2))
plt.show()
`,
  },
]);
