import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/fairness-impossibility";

export default defineLesson({
  id: "fairness-impossibility",
  title: "공정성 불가능성 정리",
  tier: "advanced",
  requires: ["fairness", "bayes"],
  goal: "Chouldechova 항등식으로 PPV·FNR을 맞추면 기저율이 다른 집단의 FPR이 달라짐을, 보정 아래의 등식 $p(1-x) = (1-p)z$로 보정과 균형이 완벽한 예측에서만 함께 성립함을 증명하고, 무작위 혼합으로 균등화된 오즈를 맞추는 확률과 그 정확도 비용을 계산할 수 있다.",
  why: "공정성 기준의 충돌이 특정 예제의 우연인지 항상 일어나는 일인지에 따라, 모델을 개선해 해결할 문제인지 기준을 선택해야 하는 문제인지가 달라진다. 충돌을 증명하고 균등화된 오즈를 맞추는 비용을 계산할 수 있어야 어떤 기준을 택할지와 그 대가를 근거와 함께 설명할 수 있다.",
  body: md`
[[lesson:fairness]]에서는 채용 AI 숫자 예제 하나로 공정성 기준끼리 충돌하는 것을 확인했다. 이 레슨은 그 충돌이 특정 예제의 우연이 아니라 **항상** 일어난다는 것을 짧은 증명 두 개로 보이고, 그래도 균등화된 오즈를 맞춰야 한다면 무엇을 대가로 내야 하는지 계산한다. 기호는 [[lesson:fairness]]와 같다. 기저율 $p = P(Y=1)$, 정밀도 $\text{PPV} = P(Y=1 \mid \hat Y=1)$, 위음성률 $\text{FNR} = 1 - \text{TPR}$이다.

### 항등식 하나로 보는 판정 수준의 충돌 (Chouldechova, 2017)

한 집단에서 전체 인원을 $N$이라 하면 진양성은 $\text{TP} = \text{TPR} \cdot pN$, 위양성은 $\text{FP} = \text{FPR} \cdot (1-p)N$이다. 정밀도의 정의 $\text{PPV} = \text{TP}/(\text{TP} + \text{FP})$에 넣어 FPR에 대해 풀면 다음 항등식이 나온다.

\`\`\`math
\text{FPR} = \dfrac{p}{1-p} \cdot \dfrac{1 - \text{PPV}}{\text{PPV}} \cdot (1 - \text{FNR})
\`\`\`

이 식은 어떤 분류기, 어떤 집단에서나 성립하는 정의상의 등식이다. 이제 두 집단에서 PPV와 FNR을 같게 맞췄다고 하자. 그러면 오른쪽에서 달라질 수 있는 것은 $p/(1-p)$뿐이므로, **기저율이 다르면 FPR이 반드시 다르다.** 예외는 기저율이 같거나, PPV = 1(위양성이 없음)이거나, FNR = 1(아무도 합격시키지 않음)인 경우뿐이다. [[lesson:fairness]]의 예제에서 PPV 0.8, FNR 0.2를 맞추면 기저율 0.5인 A 집단의 FPR은 0.2, 기저율 0.2인 B 집단의 FPR은 $\frac{0.2}{0.8} \cdot \frac{0.2}{0.8} \cdot 0.8 = 0.05$로 정해진다.

[[diagram:chouldechova-fpr]]

### 점수 수준의 충돌: 보정과 균형 (Kleinberg et al., 2016)

이번에는 판정이 아니라 점수 $s$를 다룬다. 점수가 **보정**되어 있다는 것은 $E[Y \mid s] = s$, 즉 점수 0.7을 받은 사람들의 70%가 실제 양성이라는 뜻이다. 양성의 평균 점수를 $x = E[s \mid Y=1]$, 음성의 평균 점수를 $z = E[s \mid Y=0]$이라 한다. 두 집단에서 $x$가 같고 $z$가 같으면 "양성끼리, 음성끼리 점수가 균형 잡혔다"고 한다(오류율 균형의 점수 버전).

보정으로부터 $E[Y(1-s)] = E[E[Y \mid s](1-s)] = E[s(1-s)]$이고, 마찬가지로 $E[s(1-Y)] = E[s(1-s)]$다. 두 기댓값을 각각 풀어 쓰면 다음 등식을 얻는다.

\`\`\`math
p\,(1 - x) = E[s(1-s)] = (1 - p)\,z \quad\Rightarrow\quad z = \dfrac{p}{1-p}\,(1 - x)
\`\`\`

두 집단의 $x$와 $z$가 같은데 기저율이 다르면 $\frac{p}{1-p}(1-x)$가 두 집단에서 같아야 하므로 $1 - x = 0$, 따라서 $x = 1$, $z = 0$이다. 즉 **완벽한 예측일 때만** 보정과 균형이 함께 성립한다. 현실의 어떤 모델도 완벽하지 않으므로, 기저율이 다른 두 집단에서는 보정과 균형 중 하나를 포기해야 한다.

[[diagram:kleinberg-balance]]

### 그래도 균등화된 오즈를 맞춰야 한다면: 무작위 혼합 (Hardt et al., 2016)

두 판정 규칙을 확률로 섞을 수 있다고 가정한다. 확률 $\lambda$로 규칙 1을, $1-\lambda$로 규칙 2를 쓰면 TPR과 FPR도 각각 같은 비율로 섞이므로, 두 규칙의 (FPR, TPR) 점을 잇는 선분 위의 모든 점을 얻을 수 있다. "점수와 무관하게 확률 $f$로 합격"시키는 규칙은 대각선 위의 점 $(f, f)$에 해당한다. 그래서 같은 FPR $f$에서 TPR이 $t_\text{hi}$로 더 높은 집단은, 확률 $\lambda$로 자기 임계값 규칙을 쓰고 $1 - \lambda$로 무작위 합격을 쓰면 TPR을 다른 집단의 $t_\text{lo}$까지 낮출 수 있다.

\`\`\`math
\lambda\, t_\text{hi} + (1-\lambda) f = t_\text{lo} \quad\Rightarrow\quad \lambda = \dfrac{t_\text{lo} - f}{t_\text{hi} - f}
\`\`\`

이렇게 하면 두 집단의 FPR과 TPR이 정확히 같아진다. 대가는 더 잘 맞히던 집단의 판정에 일부러 무작위성을 섞어 정확도를 낮추는 것이다. 같은 점수를 받은 두 사람이 무작위 추첨 때문에 다른 판정을 받을 수 있다는 점도 개인에 대한 공정성(individual fairness)의 관점에서 문제가 된다. 공정성 기준을 고르는 것은 수학으로 정할 수 없는 가치 판단이며, 수학은 그 선택의 비용을 정확히 계산하는 데 쓰인다.

[[diagram:randomized-mixing]]

### 코드로 확인하기

다음 코드는 Chouldechova 항등식으로 기저율에 따라 FPR이 어떻게 정해지는지 계산하고, 무작위 혼합이 실제로 TPR을 원하는 값으로 낮추는지 시뮬레이션한다.

\`\`\`python
import numpy as np

def fpr_from(p, ppv, fnr):                 # Chouldechova 항등식
    return p / (1 - p) * (1 - ppv) / ppv * (1 - fnr)

for p in [0.5, 0.2, 0.05]:
    print(f"기저율 {p:.2f}: PPV 0.8, FNR 0.2로 맞추면 FPR = {fpr_from(p, 0.8, 0.2):.4f}")

# 무작위 혼합: TPR 0.9인 집단을 0.7로 낮추기 (두 집단 FPR f = 0.1로 같다고 하자)
t_hi, t_lo, f = 0.9, 0.7, 0.1
lam = (t_lo - f) / (t_hi - f)
print(f"λ = {lam:.3f}")

rng = np.random.default_rng(0)
n_pos, n_neg = 100000, 100000
use_rule = rng.random(n_pos + n_neg) < lam               # 확률 λ로 자기 규칙, 아니면 무작위 합격
rule_pos = rng.random(n_pos) < t_hi;  rule_neg = rng.random(n_neg) < f
rand_pos = rng.random(n_pos) < f;     rand_neg = rng.random(n_neg) < f
pred_pos = np.where(use_rule[:n_pos], rule_pos, rand_pos)
pred_neg = np.where(use_rule[n_pos:], rule_neg, rand_neg)
print(f"혼합 후 TPR {pred_pos.mean():.3f}, FPR {pred_neg.mean():.3f}")
\`\`\`

PPV 0.8과 FNR 0.2를 고정하면 FPR은 기저율에 따라 0.2, 0.05, 0.0105로 자동으로 정해진다. 우리가 조절할 수 있는 변수가 남지 않는다. 아래쪽은 $\lambda = 0.75$로 섞은 판정을 20만 명에게 적용한 결과다. TPR이 0.9에서 약 0.70으로 내려가고 FPR은 0.1 그대로라, 다른 집단의 (0.1, 0.7)과 정확히 맞는다. 맞춘 대가는 실제 우수 인재 중 20%p를 일부러 떨어뜨린 것이다.
`,
  checks: [
    {
      key: "c1",
      question: "기저율이 0.5와 0.2인 두 집단에서 PPV를 0.8, FNR을 0.2로 같게 맞췄다. 기저율 0.2인 집단의 FPR은?",
      choices: ["$0.2$", "$0.05$", "$0.8$", "알 수 없다"],
      answer: 1,
      explanation: "$\\text{FPR} = \\frac{0.2}{0.8} \\cdot \\frac{0.2}{0.8} \\cdot 0.8 = 0.05$. 기저율 0.5인 집단은 0.2이므로 FPR이 반드시 달라진다.",
    },
    {
      key: "c2",
      question: "보정된 점수에서 성립하는 등식 $p(1-x) = (1-p)z$로부터 얻는 결론은? ($x$, $z$는 양성·음성의 평균 점수)",
      choices: ["기저율이 달라도 $x$, $z$를 항상 같게 맞출 수 있다", "기저율이 다른 두 집단에서 $x$, $z$가 모두 같으려면 $x = 1$, $z = 0$, 즉 완벽한 예측이어야 한다", "보정은 언제나 불가능하다", "기저율이 같으면 보정이 깨진다"],
      answer: 1,
      explanation: "$z = \\frac{p}{1-p}(1-x)$이므로 $p$가 다르면서 $x$, $z$가 같으려면 $1-x = 0$이어야 한다.",
    },
    {
      key: "c3",
      question: "FPR $f$에서 TPR이 $t_\\text{hi}$인 집단을 $t_\\text{lo}$로 낮추기 위해 '자기 규칙(확률 $\\lambda$)'과 '확률 $f$로 무작위 합격'을 섞는다. $\\lambda$는?",
      choices: ["$t_\\text{lo} / t_\\text{hi}$", "$(t_\\text{lo} - f)/(t_\\text{hi} - f)$", "$f / t_\\text{hi}$", "$1 - f$"],
      answer: 1,
      explanation: "섞은 규칙의 TPR은 $\\lambda t_\\text{hi} + (1-\\lambda) f$이고 FPR은 $f$ 그대로다. 이것을 $t_\\text{lo}$와 같게 놓고 풀면 된다.",
    },
    {
      key: "c4",
      question: "FPR이 0.1로 같은 두 집단에서 TPR 0.9인 집단을 0.7로 낮추려고 자기 규칙(확률 $\\lambda$)과 확률 0.1 무작위 합격을 섞는다. $\\lambda$는?",
      choices: ["0.75", "0.7", "0.78", "0.5"],
      answer: 0,
      explanation: "$\\lambda = (t_\\text{lo} - f)/(t_\\text{hi} - f) = (0.7 - 0.1)/(0.9 - 0.1) = 0.6/0.8 = 0.75$다.",
    },
    {
      key: "c5",
      question: "Chouldechova 항등식 $\\text{FPR} = \\frac{p}{1-p}\\cdot\\frac{1-\\text{PPV}}{\\text{PPV}}\\cdot(1-\\text{FNR})$에서 PPV = 1이면 FPR은?",
      choices: ["0", "1", "$p$", "정할 수 없다"],
      answer: 0,
      explanation: "$1 - \\text{PPV} = 0$이라 FPR = 0이다. 합격시킨 사람이 모두 실제 양성이면 위양성이 없다. 이것이 기저율이 달라도 충돌이 사라지는 예외 중 하나다.",
    },
    {
      key: "c6",
      question: "기저율이 다른 두 집단에서 점수가 보정되어 있다. 양성의 평균 점수 $x$를 두 집단에서 같게 맞추면 음성의 평균 점수 $z$는?",
      choices: ["두 집단에서 자동으로 같아진다", "$z = \\frac{p}{1-p}(1-x)$이므로 기저율이 높은 집단의 $z$가 더 크다", "두 집단 모두 0이 된다", "기저율이 높은 집단의 $z$가 더 작다"],
      answer: 1,
      explanation: "보정 아래에서 $p(1-x) = (1-p)z$이므로 $x$가 같으면 $z$는 $\\frac{p}{1-p}$에 비례한다. 기저율이 높은 집단의 음성들이 더 높은 점수를 받게 되어 음성 쪽 균형이 깨진다. 두 균형을 모두 지키려면 $x = 1$, $z = 0$(완벽한 예측)이어야 한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
def fpr_from(p, ppv, fnr):
    return p / (1 - p) * (1 - ppv) / ppv * (1 - fnr)
print(round(fpr_from(0.5, 0.75, 0.1), 3), round(fpr_from(0.1, 0.75, 0.1), 3))
`,
      expected: "0.3 0.033",
      explanation: "두 집단의 PPV(0.75)와 FNR(0.1)을 같게 맞추면, 기저율 0.5인 집단의 FPR은 $1 \\cdot \\frac{1}{3} \\cdot 0.9 = 0.3$, 기저율 0.1인 집단은 $\\frac{1}{9} \\cdot \\frac{1}{3} \\cdot 0.9 \\approx 0.033$으로 9배 차이가 난다. 기저율의 오즈 비 $\\frac{0.5/0.5}{0.1/0.9} = 9$가 그대로 FPR의 비가 된다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "Chouldechova 항등식 $\\text{FPR} = \\frac{p}{1-p}\\cdot\\frac{1-\\text{PPV}}{\\text{PPV}}\\cdot(1-\\text{FNR})$을 유도하고, 기저율이 다른 두 집단에서 PPV와 FNR을 같게 맞추면 무엇이 반드시 달라지는지 설명하라.",
      answer: md`
집단 인원을 $N$, 기저율을 $p$라 하면 $\text{TP} = \text{TPR}\cdot pN$, $\text{FP} = \text{FPR}\cdot(1-p)N$이다. $\text{PPV} = \text{TP}/(\text{TP} + \text{FP})$를 FPR에 대해 풀면 $\text{FPR} = \frac{p}{1-p}\cdot\frac{1-\text{PPV}}{\text{PPV}}\cdot\text{TPR}$이고 $\text{TPR} = 1 - \text{FNR}$이다. 이 등식은 어떤 분류기에서나 성립하므로, 두 집단의 PPV와 FNR을 같게 맞추면 남은 $\frac{p}{1-p}$의 차이가 그대로 FPR의 차이가 된다. 예를 들어 PPV 0.8, FNR 0.2에서 기저율 0.5인 집단의 FPR은 0.2, 기저율 0.2인 집단은 0.05가 되어야 한다. 기저율이 같거나 PPV = 1 또는 FNR = 1인 극단적인 경우가 아니면 예측 동등성과 오류율 균형은 함께 성립할 수 없다.
`,
      keyPoints: ["$\\text{TP} = \\text{TPR} \\cdot pN$, $\\text{FP} = \\text{FPR} \\cdot (1 - p)N$을 PPV의 정의에 넣어 FPR에 대해 푼다", "항등식은 어떤 분류기와 집단에서나 성립한다", "PPV와 FNR을 같게 맞추면 $p/(1 - p)$의 차이가 그대로 FPR의 차이가 된다", "예외는 기저율이 같거나 PPV = 1 또는 FNR = 1인 경우뿐이다"],
    },
  ],
  references: [
    { title: "Chouldechova (2017) — Fair prediction with disparate impact", url: "https://arxiv.org/abs/1703.00056", note: "PPV, FPR, FNR 사이의 항등식과 재범 예측 사례 (영문)" },
    { title: "Kleinberg, Mullainathan & Raghavan (2016) — Inherent Trade-Offs in the Fair Determination of Risk Scores", url: "https://arxiv.org/abs/1609.05807", note: "보정과 양성·음성 균형이 함께 성립하는 조건의 증명 (영문)" },
    { title: "Hardt, Price & Srebro (2016) — Equality of Opportunity in Supervised Learning", url: "https://arxiv.org/abs/1610.02413", note: "ROC 위의 무작위 혼합으로 균등화된 오즈를 맞추는 후처리 (영문)" },
  ],
});
