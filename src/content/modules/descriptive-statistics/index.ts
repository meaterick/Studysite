import { defineModule, md } from "../../kit";
import sampling from "./sampling";
import summaryStatistics from "./summary-statistics";
import correlation from "./correlation";

export default defineModule({
  slug: "descriptive-statistics",
  track: "math",
  order: 5,
  title: "기술통계와 표본",
  summary: "표본과 표본편향, 요약 통계량, 공분산·상관과 인과",
  anchor: md`
한 지역의 소득을 설문으로 조사할 때 소득이 높을수록 응답률이 높으면, 응답자를 아무리 많이 모아도 평균 소득이 높게 추정되는 이유를 표본편향으로 설명한다. 연봉 데이터에 큰 값 하나가 섞이면 평균과 표준편차는 크게 바뀌지만 중앙값과 사분위범위는 거의 바뀌지 않는다는 것을 계산으로 확인하고, 공부 시간과 점수의 상관계수를 구한 뒤 그 상관이 인과관계인지 판단하는 기준을 세운다.
`,
  objectives: [
    "모집단과 표본, 모수와 통계량을 구분하고, 단순무작위추출과 층화추출로 표본을 뽑으며 표본편향의 종류와 영향을 설명한다.",
    "평균·중앙값·분위수·사분위범위·분산·표준편차를 계산하고, 이상치와 치우친 분포에 알맞은 요약 통계량을 고른다.",
    "표본분산을 $n - 1$로 나누는 이유와 NumPy·pandas의 기본값 차이를 설명한다.",
    "공분산과 상관계수를 계산하고, 상관계수의 한계와 상관관계가 인과관계와 다른 이유를 설명한다.",
  ],
  lessons: [sampling, summaryStatistics, correlation],
  recall: [
    { prompt: "모집단·표본·모수·통계량을 정의하고, 층화추출이 단순무작위추출보다 나은 경우를 예로 들어 설명하라." },
    { prompt: "선택 편향·생존 편향·무응답 편향의 예를 하나씩 들고, 표본을 늘려도 편향이 줄지 않는 이유를 설명하라." },
    { prompt: "평균과 중앙값이 각각 어떤 오차를 최소화하는지 쓰고, 이상치가 있을 때 어떤 대푯값과 퍼짐 지표를 함께 보고해야 하는지 설명하라." },
    { prompt: "사분위범위와 1.5 IQR 이상치 기준을 쓰고, 표본분산을 $n - 1$로 나누는 이유를 설명하라." },
    { prompt: "피어슨 상관계수의 식을 쓰고 중심화한 벡터의 코사인 유사도로 해석하라. $r = 0$인데 강한 관계가 있는 예와, 상관이 인과가 아닌 이유 세 가지를 쓰라." },
  ],
});
