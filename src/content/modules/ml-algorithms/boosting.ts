import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/boosting";

export default defineLesson({
  id: "boosting",
  title: "그래디언트 부스팅, 특성 중요도",
  tier: "core",
  concepts: ["boosting-importance"],
  goal: "그래디언트 부스팅이 잔차를 학습한 트리를 순서대로 더해 오차를 줄이는 과정을 계산하고, 학습률·트리 수·깊이로 복잡도를 조절하며, 배깅과 비교한다. 불순도 기반 중요도와 순열 중요도를 계산해 두 값이 다르게 나오는 이유와 중요도 해석의 한계를 설명한다.",
  why: "표 형태의 데이터에서는 그래디언트 부스팅(XGBoost, LightGBM 등)이 가장 자주 쓰이는 모델 가운데 하나다. 모델을 만든 뒤에는 어떤 특성이 예측에 쓰였는지 설명해야 하는데, 중요도를 잘못 읽으면 정답과 무관한 특성을 중요하다고 보고하거나 상관을 인과로 해석하게 된다. 모델의 근거를 문서로 남기는 방법은 [[lesson:model-cards]]에서 다룬다.",
  body: md`
### 잔차를 학습한 트리를 차례로 더한다

**부스팅**은 모델을 하나씩 순서대로 추가하면서, 지금까지의 모델이 틀린 부분을 다음 모델이 보완하게 한다. **그래디언트 부스팅**은 현재 예측 $F_{m-1}(x)$의 잔차 $y - F_{m-1}(x)$를 맞히는 작은 트리 $h_m$을 학습해, 학습률 $\eta$를 곱해 더한다.

\`\`\`math
F_m(x) = F_{m-1}(x) + \eta\, h_m(x)
\`\`\`

평균제곱오차를 예측 $F$로 미분하면 잔차의 음수가 나오므로, 잔차를 맞히는 것은 손실의 기울기 반대 방향으로 한 걸음 가는 것과 같다([[lesson:gradient-descent]]). 다른 손실에서는 잔차 대신 손실의 음의 기울기를 맞힌다. 이름의 "그래디언트"가 여기서 나왔다. 정답 $y = [10, 20, 30]$에서 평균 $F_0 = 20$으로 시작하면 잔차는 $[-10, 0, 10]$이고, 트리가 잔차를 정확히 맞혔다면 $\eta = 0.1$에서 $F_1 = [19, 20, 21]$이 된다.

[[diagram:boosting-residuals]]

다음 코드는 깊이 2인 회귀 트리로 이 과정을 직접 반복하며, 학습 데이터와 검증 데이터의 평균제곱오차를 잰다.

\`\`\`python
import numpy as np
from sklearn.tree import DecisionTreeRegressor

rng = np.random.default_rng(0)
x = rng.uniform(0, 1, (200, 1)); y = np.sin(2 * np.pi * x[:, 0]) + rng.normal(0, 0.2, 200)
xv = rng.uniform(0, 1, (200, 1)); yv = np.sin(2 * np.pi * xv[:, 0]) + rng.normal(0, 0.2, 200)

F, Fv = np.full(200, y.mean()), np.full(200, y.mean())   # 학습 데이터 평균에서 시작
for m in range(1, 301):
    tree = DecisionTreeRegressor(max_depth=2).fit(x, y - F)   # 현재 잔차를 학습
    F += 0.1 * tree.predict(x)
    Fv += 0.1 * tree.predict(xv)
    if m in (1, 10, 50, 100, 300):
        print(m, round(float(np.mean((y - F) ** 2)), 4), round(float(np.mean((yv - Fv) ** 2)), 4))
# 1 0.416 0.5052
# 10 0.1177 0.156
# 50 0.0313 0.0493
# 100 0.026 0.0494
# 300 0.0123 0.059
\`\`\`

트리를 더할수록 학습 오차는 계속 줄지만, 검증 오차는 100개 근처에서 가장 작고 이후 다시 커진다. 랜덤 포레스트는 트리를 늘려도 과적합이 커지지 않지만([[lesson:knn-trees]]), 부스팅은 트리가 늘수록 학습 데이터에 더 맞춰지므로 **트리 수가 복잡도를 정한다**.

### 학습률, 트리 수, 깊이

세 하이퍼파라미터가 함께 복잡도를 정한다. 학습률이 작으면 한 번에 조금씩 보완하므로 트리가 많이 필요하지만 검증 성능이 좋은 경우가 많다. 트리는 보통 깊이 2~6의 얕은 트리를 쓴다. 트리 수는 검증 오차를 보며 멈추는 조기 종료로 정한다([[lesson:regularization]]). 같은 데이터에서 학습률 1.0, 깊이 6으로 학습하면 트리 20개 만에 학습 오차가 0이 되지만 검증 오차는 0.091로, 학습률 0.1의 0.049보다 크다.

scikit-learn의 \`GradientBoostingClassifier\`·\`HistGradientBoostingClassifier\`와, 따로 설치하는 XGBoost·LightGBM이 같은 원리를 쓴다. \`HistGradientBoosting\`과 LightGBM은 특성값을 구간으로 묶어 분할을 빠르게 찾고, 결측값을 그대로 처리한다.

| | 배깅(랜덤 포레스트) | 부스팅 |
| --- | --- | --- |
| 학습 순서 | 트리를 서로 독립으로 학습(병렬) | 앞의 결과를 보고 순서대로 학습 |
| 개별 트리 | 깊은 트리(분산이 크다) | 얕은 트리(편향이 크다) |
| 주로 줄이는 것 | 분산 | 편향 |
| 트리를 늘리면 | 안정되고 과적합이 커지지 않는다 | 계속 늘리면 과적합한다 |

### 특성 중요도

**불순도 기반 중요도**(MDI)는 트리의 분할마다 줄어든 불순도를 그 분할에 쓴 특성에 더해 합한 값으로, scikit-learn의 트리 모델에서 \`feature_importances_\`로 바로 얻는다. 학습 데이터로 계산하므로, 학습 데이터에 맞추려고 나눈 분할까지 모두 중요도로 센다. **순열 중요도**는 검증 데이터에서 특성 하나의 값을 무작위로 섞었을 때 점수가 얼마나 떨어지는지로 잰다. 모델 종류와 관계없이 쓸 수 있고, 새 데이터에서 그 특성에 실제로 기대는 정도를 나타낸다.

다음 데이터에서 정답은 특성 \`x_inf\`와 80% 일치하고, \`x_noise\`는 정답과 무관한 연속값이다.

\`\`\`python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance

rng = np.random.default_rng(0)
n = 1000
x_inf = rng.integers(0, 2, n)                          # 정답과 관계있는 특성(0 또는 1)
y = np.where(rng.random(n) < 0.8, x_inf, 1 - x_inf)    # 80%는 x_inf와 같다
x_noise = rng.normal(size=n)                           # 정답과 무관한 연속값
X = np.column_stack([x_inf, x_noise])
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0)

rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr)
print("불순도 기반:", np.round(rf.feature_importances_, 3))              # [0.357 0.643]
perm = permutation_importance(rf, X_te, y_te, n_repeats=10, random_state=0)
print("순열(테스트 데이터):", np.round(perm.importances_mean, 3))         # [ 0.141 -0.045]
\`\`\`

불순도 기반 중요도는 정답과 무관한 \`x_noise\`를 0.643으로 더 중요하다고 한다. 깊은 트리가 \`x_inf\`로 나눈 뒤에도 남은 20%의 잡음을 맞히려고 \`x_noise\`의 수많은 기준값으로 계속 나눴기 때문이다. 값의 종류가 많은 특성일수록 나눌 곳이 많아 이런 일이 잦다. 순열 중요도는 테스트 데이터에서 계산하므로 \`x_noise\`가 예측에 도움이 되지 않는다는 것(−0.045)을 보여 준다.

**중요도를 읽을 때 주의할 점**은 세 가지다. 첫째, 상관이 강한 특성이 여럿이면 중요도가 그 사이에 나뉜다. 위 데이터에 \`x_inf\`의 복사본을 넣으면 순열 중요도가 두 열에 나뉘어 각각은 작게 나오는데, 한 열을 섞어도 다른 열이 같은 정보를 주기 때문이다. 둘째, 중요도는 그 **모델**이 특성을 얼마나 쓰는지이지 특성이 정답의 원인이라는 뜻이 아니다. 셋째, 성능이 낮은 모델의 중요도는 의미가 적으므로 먼저 검증 성능을 확인한다.

:::warn 흔한 실수
- **부스팅의 트리 수를 크게 잡고 그대로 쓴다.** 트리 수는 검증 오차로 정하고, 조기 종료를 쓴다.
- **\`feature_importances_\`만 보고 특성을 고르거나 설명한다.** 학습 데이터 기준이라 값의 종류가 많은 특성을 부풀린다. 검증 데이터의 순열 중요도와 함께 본다.
- **중요도가 높은 특성을 정답의 원인으로 해석한다.** 중요도는 모델이 그 특성에 기대는 정도일 뿐이다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "정답 $y = [10, 20, 30]$, 현재 예측 $F = [20, 20, 20]$에서 잔차를 정확히 맞히는 트리를 학습률 $\\eta = 0.1$로 더하면 새 예측은?",
      choices: ["$[19, 20, 21]$", "$[10, 20, 30]$", "$[21, 20, 19]$", "$[20, 20, 20]$"],
      answer: 0,
      explanation: "잔차는 $[-10, 0, 10]$이고 그 0.1배를 더하면 $[19, 20, 21]$이다. 학습률 때문에 한 번에 조금씩 정답에 다가간다.",
    },
    {
      key: "c2",
      question: "배깅(랜덤 포레스트)과 비교한 부스팅의 특징으로 옳은 것은?",
      choices: [
        "앞의 모델이 틀린 부분을 다음 모델이 순서대로 보완하며 주로 편향을 줄인다",
        "트리를 서로 독립으로 학습해 평균하며 주로 분산을 줄인다",
        "트리를 아무리 늘려도 과적합하지 않는다",
        "깊이 제한 없는 트리를 쓰는 것이 일반적이다",
      ],
      answer: 0,
      explanation: "부스팅은 얕은 트리(편향이 큰 모델)를 순서대로 더해 편향을 줄인다. 트리를 계속 늘리면 학습 데이터에 지나치게 맞춰지므로 트리 수를 검증 오차로 정한다.",
    },
    {
      key: "c3",
      question: "부스팅에서 트리를 더할수록 학습 오차는 계속 줄지만 검증 오차는 100개 근처부터 커진다. 알맞은 조치는?",
      choices: [
        "검증 오차가 가장 작은 트리 수에서 멈추는 조기 종료를 쓴다",
        "트리를 더 많이 추가한다",
        "학습률을 크게 한다",
        "트리의 깊이를 제한하지 않는다",
      ],
      answer: 0,
      explanation: "부스팅에서는 트리 수가 복잡도를 정한다. 검증 오차가 커지는 구간은 과적합이다.",
    },
    {
      key: "c4",
      question: "정답과 무관한 연속값 특성의 불순도 기반 중요도가 높게 나왔다. 가장 그럴듯한 이유는?",
      choices: [
        "학습 데이터로 계산하므로, 잡음을 맞히려고 그 특성의 많은 기준값으로 나눈 분할까지 중요도로 셌다",
        "그 특성이 실제로 정답의 원인이다",
        "순열 중요도와 항상 같은 값이 나온다",
        "랜덤 포레스트에서는 중요도를 계산할 수 없다",
      ],
      answer: 0,
      explanation: "값의 종류가 많은 특성은 나눌 곳이 많아 학습 데이터의 잡음에 맞춘 분할에 자주 쓰인다. 검증 데이터의 순열 중요도로 확인한다.",
    },
    {
      key: "c5",
      question: "같은 정보를 담은 특성 두 개(서로의 복사본)가 있을 때 순열 중요도가 어떻게 나오는가?",
      choices: [
        "한 특성을 섞어도 다른 특성이 같은 정보를 주므로 두 특성 모두 작게 나온다",
        "두 특성 모두 혼자 있을 때의 두 배로 나온다",
        "항상 한 특성만 0이 된다",
        "상관과 무관하게 정확히 같은 값이 나온다",
      ],
      answer: 0,
      explanation: "순열 중요도는 그 특성을 섞었을 때 점수가 떨어지는 정도다. 대신할 특성이 있으면 점수가 거의 떨어지지 않는다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
y = [10, 20, 30]
F = [20.0, 20.0, 20.0]
for m in range(2):
    F = [f + 0.1 * (t - f) for f, t in zip(F, y)]
print([round(f, 2) for f in F])
`,
      expected: "[18.1, 20.0, 21.9]",
      explanation: "잔차를 정확히 맞히는 트리를 학습률 0.1로 두 번 더한 결과다. 한 번 뒤 $[19, 20, 21]$, 두 번 뒤에는 잔차 $[-9, 0, 9]$의 0.1배를 더해 $[18.1, 20.0, 21.9]$가 된다. 잔차가 매번 0.9배씩 줄어든다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "배깅과 부스팅을 학습 순서, 개별 트리의 성질, 주로 줄이는 오차 성분, 트리 수를 늘릴 때의 결과로 비교하라.",
      answer: md`
배깅은 부트스트랩 표본마다 트리를 서로 독립으로(병렬로) 학습해 예측을 평균한다. 개별 트리는 깊어서 편향은 작고 분산이 크며, 평균하면서 분산이 줄어든다. 트리를 늘릴수록 평균이 안정될 뿐 과적합이 커지지 않는다.

부스팅은 앞의 모델들이 틀린 부분(잔차 또는 손실의 기울기)을 다음 트리가 맞히도록 순서대로 학습한다. 개별 트리는 얕아서 편향이 크지만, 차례로 더하면서 편향이 줄어든다. 트리를 늘릴수록 학습 데이터에 더 맞춰지므로 계속 늘리면 과적합하고, 트리 수는 검증 오차로 정한다.
`,
      keyPoints: [
        "배깅: 독립·병렬, 깊은 트리, 분산을 줄인다",
        "부스팅: 순서대로, 얕은 트리, 편향을 줄인다",
        "배깅은 트리를 늘려도 과적합이 커지지 않는다",
        "부스팅은 트리 수가 복잡도이므로 검증 오차로 정한다",
      ],
    },
    {
      key: "d2",
      question: "어떤 팀이 랜덤 포레스트의 feature_importances_ 상위 특성을 근거로 \"이 특성이 고객 이탈의 원인\"이라고 보고했다. 이 해석의 문제를 세 가지 쓰고, 중요도를 더 믿을 수 있게 확인하는 방법을 쓰라.",
      answer: md`
첫째, 불순도 기반 중요도는 학습 데이터로 계산하므로, 학습 데이터의 잡음에 맞춘 분할까지 센다. 특히 값의 종류가 많은 특성은 정답과 무관해도 높게 나올 수 있다. 둘째, 상관이 강한 특성이 여럿이면 중요도가 그 사이에 나뉘거나 한쪽으로 몰려, 특성 하나의 값만 보고 판단할 수 없다. 셋째, 중요도는 모델이 그 특성을 예측에 얼마나 쓰는지일 뿐 특성이 이탈의 원인이라는 뜻이 아니다. 원인을 말하려면 실험이나 인과 분석이 필요하다.

확인하려면 먼저 모델의 검증 성능이 충분한지 보고, 검증 데이터에서 순열 중요도를 계산해 불순도 기반 중요도와 비교한다. 상관이 강한 특성들은 묶어서 함께 섞어 보거나 하나씩 빼고 다시 학습해 성능 변화를 본다.
`,
      keyPoints: [
        "MDI는 학습 데이터 기준이라 값의 종류가 많은 특성을 부풀린다",
        "상관된 특성 사이에 중요도가 나뉜다",
        "중요도는 모델의 의존 정도이지 원인이 아니다",
        "검증 데이터의 순열 중요도, 상관된 특성은 묶어서 확인",
      ],
    },
  ],
  references: [
    { title: "scikit-learn — Gradient boosting", url: "https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting", note: "GradientBoosting·HistGradientBoosting과 조기 종료 (영문)" },
    { title: "scikit-learn — Permutation Importance vs Random Forest Feature Importance (MDI)", url: "https://scikit-learn.org/stable/auto_examples/inspection/plot_permutation_importance.html", note: "무작위 특성이 높은 MDI를 받는 예 (영문)" },
    { title: "Friedman (2001) — Greedy Function Approximation: A Gradient Boosting Machine", url: "https://projecteuclid.org/journals/annals-of-statistics/volume-29/issue-5/Greedy-function-approximation-A-gradient-boosting-machine/10.1214/aos/1013203451.full", note: "그래디언트 부스팅의 원 논문 (영문, 연구 논문)" },
  ],
});
