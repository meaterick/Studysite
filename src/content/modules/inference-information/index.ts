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
  summary: "큰 수의 법칙과 중심극한정리, 신뢰구간과 가설검정, 우도와 엔트로피",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [llnClt, statisticalInference, likelihoodEntropy, mleMap, entropyKl],
  recall: [
  ],
  assignment,
});
