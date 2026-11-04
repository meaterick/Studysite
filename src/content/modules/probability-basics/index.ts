import { defineModule, md } from "../../kit";
import probabilityRules from "./probability-rules";
import bayes from "./bayes";
import randomVariables from "./random-variables";
import distributions from "./distributions";

export default defineModule({
  slug: "probability-basics",
  track: "math",
  order: 4,
  title: "확률",
  summary: "사건과 독립성, 조건부확률과 베이즈 정리, 확률변수, 정규·이항분포",
  anchor: md`
유병률 1%, 민감도 99%, 위양성률 5%인 검사에서 양성 판정을 받은 사람이 실제 환자일 확률이 약 16.7%에 불과한 이유를 조건부확률과 베이즈 정리로 계산하고, 1만 명의 사람 수로 다시 확인한다. 정답률 0.8인 모델이 10문제 중 몇 문제를 맞힐지를 이항분포로 계산해, 문제 수가 적은 평가가 얼마나 흔들리는지 표준편차로 나타낸다.
`,
  objectives: [
    "표본공간과 사건으로 확률을 정의하고, 덧셈 법칙·여사건·곱셈 법칙으로 확률을 계산하며 배반과 독립을 구분한다.",
    "조건부확률과 전체확률의 법칙을 적용하고, 베이즈 정리로 사전확률을 사후확률로 갱신하며 기저율의 영향을 설명한다.",
    "확률질량함수·확률밀도함수·누적분포함수를 구분하고, 기댓값과 분산을 계산하며 기댓값의 선형성과 분산의 합 성질을 적용한다.",
    "베르누이·이항·균등·정규분포의 평균과 분산을 쓰고, 이항분포와 표준정규분포로 확률을 계산한다.",
  ],
  lessons: [probabilityRules, bayes, randomVariables, distributions],
  recall: [
    { prompt: "덧셈 법칙과 독립일 때의 곱셈 법칙을 쓰고, 배반사건이 독립이 아닌 이유를 설명하라. 주사위를 4번 던져 6이 적어도 한 번 나올 확률을 계산하라." },
    { prompt: "조건부확률의 정의와 베이즈 정리를 쓰고, 사전확률·가능도·사후확률이 각각 무엇인지 설명하라." },
    { prompt: "유병률 1%, 민감도 99%, 위양성률 5%인 검사에서 $P(\\text{환자} \\mid \\text{양성})$을 1만 명의 사람 수로 계산하고, 그 값이 낮은 이유를 설명하라." },
    { prompt: "기댓값과 분산의 정의를 쓰고, 주사위 한 개와 주사위 두 개의 합의 기댓값·분산을 구하라. 분산의 합 공식이 성립하는 조건도 쓰라." },
    { prompt: "이항분포의 확률질량함수와 평균·분산을 쓰고, 정규분포의 68-95-99.7 규칙과 z-점수의 정의를 쓰라. $\\mathcal{N}(\\mu, \\sigma^2)$와 NumPy `scale`의 차이도 설명하라." },
  ],
});
