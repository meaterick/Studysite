import { defineModule, md } from "../../kit";
import llnClt from "./lln-clt";
import statisticalInference from "./statistical-inference";
import likelihoodEntropy from "./likelihood-entropy";
import mleMap from "./mle-map";
import entropyKl from "./entropy-kl";
import assignment from "./assignment";

export default defineModule({
  slug: "inference-information",
  track: "math",
  order: 6,
  title: "추론통계와 정보량",
  summary: "큰 수의 법칙과 중심극한정리, 신뢰구간과 가설검정, 가능도와 엔트로피",
  anchor: md`
테스트 데이터 400개에서 정확도 0.85를 얻은 모델에 95% 신뢰구간을 붙이고, 정확도 0.86인 다른 모델과 이 데이터로 구분할 수 있는지 판단한다. 동전 10번 중 앞면 7번이라는 데이터에서 앞면 확률을 최대가능도추정으로 구하고, 분류 모델의 교차엔트로피 손실이 정답의 음의 로그가능도와 같다는 것을 계산으로 확인한다.
`,
  objectives: [
    "표본평균의 기댓값·분산을 유도해 표준오차를 계산하고, 큰 수의 법칙과 중심극한정리가 각각 무엇을 말하는지 구분한다.",
    "평균과 비율의 신뢰구간을 계산해 바르게 해석하고, z 검정과 순열 검정으로 p값을 구하며 두 가지 오류와 다중 비교의 문제를 설명한다.",
    "확률과 가능도를 구분하고, 로그가능도를 미분해 최대가능도추정값을 구한다.",
    "엔트로피와 교차엔트로피를 계산하고, 교차엔트로피 손실을 최소화하는 것이 최대가능도추정인 이유를 설명한다.",
  ],
  lessons: [llnClt, statisticalInference, likelihoodEntropy, mleMap, entropyKl],
  recall: [
    { prompt: "표본평균의 분산이 $\\sigma^2/n$인 이유를 쓰고, 표준오차를 절반으로 줄이려면 표본을 몇 배로 늘려야 하는지 설명하라. 큰 수의 법칙과 중심극한정리의 차이도 쓰라." },
    { prompt: "비율의 95% 신뢰구간 식을 쓰고, 400개 중 340개를 맞힌 모델의 신뢰구간을 계산하라. \"95%\"가 무엇을 뜻하는지 정확히 쓰라." },
    { prompt: "가설검정의 네 단계를 쓰고, 동전 100번 중 앞면 61번일 때 z와 p값을 구하라. p값에 대해 흔히 하는 잘못된 해석 두 가지를 쓰라." },
    { prompt: "확률과 가능도의 차이를 쓰고, $n$번 중 $k$번 성공한 데이터의 최대가능도추정값이 $k/n$임을 로그가능도로 유도하라." },
    { prompt: "엔트로피와 교차엔트로피의 정의를 쓰고, 분류 모델의 교차엔트로피 손실이 $-\\log q(\\text{정답})$이 되는 이유와 이것이 최대가능도추정과 같은 이유를 설명하라." },
  ],
  assignment,
});
