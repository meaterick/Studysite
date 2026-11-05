import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/visualization";

export default defineLesson({
  id: "visualization",
  title: "히스토그램, 산점도, 상자그림, 상관행렬",
  tier: "core",
  concepts: ["visualization"],
  goal: "알고 싶은 질문에 맞는 그래프(히스토그램·산점도·상자그림·막대그래프·상관행렬)를 고르고 matplotlib으로 그리며, 구간 수·축 범위·점의 겹침 같은 설정 때문에 그래프가 잘못 읽히는 경우를 찾아낸다.",
  why: "데이터를 처음 받으면 그래프로 분포와 관계를 확인하고([[lesson:eda]]), 모델을 학습한 뒤에는 학습 곡선과 오차 그래프로 과적합 같은 문제를 진단한다([[lesson:bias-variance]]). 같은 숫자라도 그래프를 잘못 그리면 결론이 달라지므로, 결과를 보고할 때도 그래프를 바르게 그려야 한다.",
  body: md`
### 질문에 맞는 그래프

그래프는 무엇을 알고 싶은지에 따라 고른다.

| 질문 | 그래프 |
| --- | --- |
| 수치형 변수 하나의 분포는? | 히스토그램, 상자그림 |
| 수치형 변수 두 개의 관계는? | 산점도 |
| 범주마다 개수나 비율은? | 막대그래프 |
| 범주에 따라 수치형 변수의 분포가 다른가? | 범주별 상자그림 |
| 여러 수치형 변수끼리의 상관은? | 상관행렬 히트맵 |
| 시간에 따른 변화는? | 선 그래프 |

아래 예제는 가상의 앱 사용자 300명 데이터를 쓴다. 나이(\`age\`), 요금제(\`plan\`), 주간 접속 횟수(\`sessions\`), 평균 접속 시간(분, \`minutes\`), 해지 여부(\`churned\`, 해지하면 1)가 있다.

\`\`\`python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

rng = np.random.default_rng(0)
n = 300
plan = rng.choice(["free", "basic", "pro"], size=n, p=[0.5, 0.3, 0.2])
sessions = rng.poisson(np.where(plan == "pro", 9, np.where(plan == "basic", 6, 3)))
df = pd.DataFrame({
    "age": rng.normal(35, 10, n).clip(18, 70).round(),
    "plan": plan,
    "sessions": sessions,
    "minutes": rng.lognormal(2.5, 0.6, n).round(1),           # 오른쪽으로 꼬리가 긴 분포
    "churned": (rng.random(n) < 1 / (1 + np.exp(-(1.2 - 0.35 * sessions)))).astype(int),
})
print(df.head())
print(df.describe().round(1))
\`\`\`

matplotlib에서는 \`fig, ax = plt.subplots()\`로 그림(\`fig\`)과 그래프 영역(\`ax\`)을 만들고, \`ax\`의 메서드로 그린다. 이 사이트의 실행 환경은 코드가 끝난 뒤 열려 있는 그림을 이미지로 보여 준다. 실행 환경의 기본 글꼴에는 한글이 없으므로 그래프 안의 글자는 영문으로 쓴다.

### 히스토그램: 분포의 모양

히스토그램은 값의 범위를 여러 구간으로 나눠 구간마다 값의 개수를 막대로 그린다. 분포가 한쪽으로 치우쳤는지, 봉우리가 여러 개인지, 동떨어진 값이 있는지를 본다. 구간 수(\`bins\`)에 따라 모양이 달라지므로 몇 가지로 바꿔 본다.

\`\`\`python
fig, axes = plt.subplots(1, 3, figsize=(11, 3))
axes[0].hist(df["minutes"], bins=5)
axes[0].set_title("minutes, bins=5")
axes[1].hist(df["minutes"], bins=30)
axes[1].set_title("minutes, bins=30")
axes[2].hist(np.log(df["minutes"]), bins=30)
axes[2].set_title("log(minutes), bins=30")
for ax in axes:
    ax.set_ylabel("count")
plt.tight_layout()
plt.show()
\`\`\`

구간이 5개면 오른쪽으로 긴 꼬리가 잘 보이지 않고, 30개면 모양이 드러난다. 이처럼 꼬리가 긴 변수는 로그를 취하면 대칭에 가까운 모양이 되어 분포를 보기 쉽고, 모델에 넣을 때도 로그 변환을 검토한다([[lesson:encoding-scaling]]).

### 산점도: 두 변수의 관계

산점도는 두 수치형 변수를 가로축과 세로축에 놓고 샘플마다 점을 찍는다. 점이 많아 겹치면 밀도가 보이지 않으므로 투명도(\`alpha\`)를 낮추고, 범주별로 색을 나눠 세 번째 정보를 함께 본다.

\`\`\`python
fig, ax = plt.subplots(figsize=(5, 3.5))
for value, color in [(0, "tab:blue"), (1, "tab:red")]:
    part = df[df["churned"] == value]
    ax.scatter(part["sessions"], part["minutes"], s=14, alpha=0.5, color=color, label=f"churned={value}")
ax.set_xlabel("sessions per week")
ax.set_ylabel("minutes per session")
ax.legend()
plt.show()
\`\`\`

해지한 사용자(빨강)는 접속 횟수가 적은 쪽에 몰려 있고, 접속 시간과는 뚜렷한 관계가 보이지 않는다. 산점도에서 본 관계는 상관계수로 숫자로도 확인하고([[lesson:correlation]]), 관계가 곧 원인이라는 뜻은 아니라는 점을 기억한다.

### 상자그림: 범주마다 분포 비교

상자그림은 사분위수와 이상치 후보로 분포를 요약한다([[lesson:summary-statistics]]). 범주마다 상자그림을 나란히 그리면 범주에 따라 분포가 어떻게 다른지 비교된다.

\`\`\`python
fig, ax = plt.subplots(figsize=(5, 3.5))
plans = ["free", "basic", "pro"]
ax.boxplot([df.loc[df["plan"] == p, "sessions"] for p in plans])
ax.set_xticks([1, 2, 3], plans)
ax.set_ylabel("sessions per week")
plt.show()
print(df.groupby("plan")["sessions"].median())
\`\`\`

요금제가 높을수록 접속 횟수의 중앙값이 크다. 범주별 개수는 막대그래프(\`ax.bar\`)로 그리고, 개수가 적은 범주의 상자그림은 믿을 만하지 않다는 점도 함께 확인한다.

### 상관행렬 히트맵: 여러 변수의 상관을 한 번에

수치형 변수가 여러 개이면 \`df.corr()\`로 모든 쌍의 상관계수를 행렬로 구하고, 색으로 나타낸 히트맵으로 본다. 색만으로는 값을 정확히 읽기 어려우므로 칸마다 숫자를 함께 적는다.

\`\`\`python
corr = df[["age", "sessions", "minutes", "churned"]].corr()
fig, ax = plt.subplots(figsize=(4.5, 3.8))
im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)        # 색 범위를 -1~1로 고정한다
ax.set_xticks(range(4), corr.columns, rotation=45)
ax.set_yticks(range(4), corr.columns)
for i in range(4):
    for j in range(4):
        ax.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center", fontsize=9)
fig.colorbar(im)
plt.tight_layout()
plt.show()
print(corr.round(2))
\`\`\`

색 범위를 $-1$에서 $1$로 고정해야 0 근처의 약한 상관이 진한 색으로 보이는 일을 막는다. 상관행렬은 직선 관계만 보여 주므로, 눈에 띄는 쌍은 산점도로 모양을 확인한다.

### 그래프가 잘못 읽히는 경우

- **세로축을 0에서 시작하지 않은 막대그래프**: 막대의 길이가 값의 비율을 나타내므로, 축을 자르면 작은 차이가 크게 보인다.
- **패널마다 다른 축 범위**: 여러 그래프를 비교할 때는 \`plt.subplots(..., sharey=True)\`로 축 범위를 맞춘다.
- **너무 적거나 많은 구간**: 히스토그램의 구간이 너무 적으면 모양이 사라지고, 너무 많으면 잡음이 모양처럼 보인다.
- **점의 겹침**: 점이 많은 산점도는 투명도를 낮추거나 표본을 뽑아 그린다.
- **표본 수를 숨긴 비율**: 범주마다 표본 수가 크게 다르면 비율 그래프와 함께 개수를 적는다.

:::warn 흔한 실수
- **질문 없이 그래프를 그린다.** 무엇을 확인하려는지 먼저 정하고 그래프를 고른다.
- **구간 수를 하나만 보고 분포를 판단한다.** \`bins\`를 바꿔 모양이 유지되는지 확인한다.
- **히트맵의 색 범위를 자동으로 둔다.** 상관행렬은 \`vmin=-1, vmax=1\`로 고정한다.
- **축 이름과 단위를 빠뜨린다.** 다른 사람이 읽을 그래프에는 축 이름, 단위, 범례를 적는다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "요금제(free·basic·pro)에 따라 주간 접속 횟수의 분포가 어떻게 다른지 비교하기에 가장 알맞은 그래프는?",
      choices: ["요금제별 상자그림", "산점도", "상관행렬 히트맵", "선 그래프"],
      answer: 0,
      explanation: "범주에 따른 수치형 변수의 분포 비교에는 범주별 상자그림(또는 히스토그램)을 쓴다. 산점도는 수치형 두 변수의 관계, 히트맵은 여러 변수의 상관을 본다.",
    },
    {
      key: "c2",
      question: "같은 데이터로 그린 히스토그램이 구간 5개일 때와 30개일 때 모양이 크게 다르다. 알맞은 해석은?",
      choices: [
        "구간 수에 따라 모양이 달라지므로 여러 구간 수로 확인한 뒤 분포를 판단한다",
        "구간이 많을수록 항상 정확하므로 30개 그래프만 믿는다",
        "데이터에 오류가 있다",
        "히스토그램은 분포를 보는 데 쓸 수 없다",
      ],
      answer: 0,
      explanation: "구간이 너무 적으면 꼬리나 봉우리가 사라지고, 너무 많으면 잡음이 모양처럼 보인다. 구간 수를 바꿔도 유지되는 특징이 데이터의 모양이다.",
    },
    {
      key: "c3",
      question: "점 10만 개로 산점도를 그렸더니 한 덩어리로 칠해져 밀도를 알 수 없다. 개선 방법으로 알맞은 것은?",
      choices: [
        "점의 투명도를 낮추거나 표본을 뽑아 그린다",
        "점의 크기를 키운다",
        "세로축을 로그 눈금으로만 바꾼다",
        "막대그래프로 바꾼다",
      ],
      answer: 0,
      explanation: "점이 겹치면 겹친 정도가 보이지 않는다. `alpha`를 낮추면 많이 겹친 곳이 진하게 보이고, 표본을 뽑으면 겹침이 줄어든다.",
    },
    {
      key: "c4",
      question: "상관행렬 히트맵에서 색 범위를 `vmin=-1, vmax=1`로 고정하는 이유는?",
      choices: [
        "고정하지 않으면 데이터의 최솟값·최댓값에 맞춰 색이 정해져 약한 상관도 진한 색으로 보일 수 있기 때문이다",
        "상관계수가 1보다 클 수 있기 때문이다",
        "그래프를 빨리 그리기 위해서다",
        "색을 쓰지 않기 위해서다",
      ],
      answer: 0,
      explanation: "상관계수의 범위는 −1~1이다. 색 범위를 고정해야 같은 색이 같은 상관의 크기를 뜻한다.",
    },
    {
      key: "c5",
      question: "두 제품의 만족도가 4.1과 4.3인 막대그래프에서 세로축을 4.0부터 시작하면 생기는 문제는?",
      choices: [
        "막대 길이가 1:3이 되어 차이가 실제보다 훨씬 크게 보인다",
        "차이가 보이지 않게 된다",
        "만족도의 평균이 바뀐다",
        "문제가 없다",
      ],
      answer: 0,
      explanation: "막대의 길이는 값에 비례해 읽힌다. 4.0부터 그리면 막대 길이가 0.1과 0.3이라 세 배 차이처럼 보인다. 막대그래프의 세로축은 0에서 시작한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
counts, edges = np.histogram([1, 2, 2, 3, 3, 3, 9], bins=4)
print(counts.tolist(), edges.tolist())
`,
      expected: "[3, 3, 0, 1] [1.0, 3.0, 5.0, 7.0, 9.0]",
      explanation: "최솟값 1부터 최댓값 9까지를 폭 2인 구간 4개 [1, 3), [3, 5), [5, 7), [7, 9]로 나눈다. 각 구간은 왼쪽 끝을 포함하고 오른쪽 끝은 포함하지 않으며, 마지막 구간만 오른쪽 끝도 포함한다. 그래서 1, 2, 2가 첫 구간, 3, 3, 3이 둘째 구간, 9가 마지막 구간에 들어간다. 동떨어진 값 9 하나 때문에 구간 폭이 넓어져 1~3 사이의 모양이 보이지 않는다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "데이터를 처음 받았을 때 '변수 하나의 분포', '두 수치형 변수의 관계', '범주에 따른 차이'를 확인하기 위해 각각 어떤 그래프를 그릴지 쓰고, 각 그래프에서 무엇을 확인할지와 잘못 읽히지 않게 하기 위한 설정을 하나씩 쓰라.",
      answer: md`
- **변수 하나의 분포**: 히스토그램을 그려 치우침, 봉우리의 수, 동떨어진 값을 확인한다. 구간 수를 몇 가지로 바꿔 모양이 유지되는지 확인하고, 꼬리가 긴 변수는 로그를 취한 값의 히스토그램도 본다.
- **두 수치형 변수의 관계**: 산점도를 그려 관계의 방향, 직선인지 곡선인지, 이상치를 확인한다. 점이 많으면 투명도를 낮춰 겹침을 줄이고, 상관계수와 함께 본다.
- **범주에 따른 차이**: 범주별 상자그림을 나란히 그려 중앙값과 퍼짐을 비교한다. 범주마다 표본 수를 함께 적고, 여러 그래프를 비교할 때는 축 범위를 같게 맞춘다.
`,
      keyPoints: ["분포: 히스토그램(구간 수를 바꿔 확인)", "관계: 산점도(겹침 줄이기, 상관계수와 함께)", "범주별 차이: 범주별 상자그림(표본 수 표시)", "축 범위·단위를 맞춰 비교"],
    },
  ],
  references: [
    { title: "Matplotlib — Quick start guide", url: "https://matplotlib.org/stable/users/explain/quick_start.html", note: "Figure와 Axes, 기본 그래프 그리기 (영문)" },
    { title: "Fundamentals of Data Visualization (Claus O. Wilke)", url: "https://clauswilke.com/dataviz/", note: "질문에 맞는 그래프 고르기와 흔한 오류 (영문, 무료 공개)" },
  ],
});
