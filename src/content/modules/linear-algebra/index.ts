import { defineModule, md } from "../../kit";
import scalarsTensors from "./scalars-tensors";
import vectorOperations from "./vector-operations";
import dotProduct from "./dot-product";
import matrixMultiplication from "./matrix-multiplication";
import linearMapsBasis from "./linear-maps-basis";
import rankEigen from "./rank-eigen";

export default defineModule({
  slug: "linear-algebra",
  track: "math",
  order: 2,
  title: "벡터와 행렬",
  summary: "스칼라·벡터·행렬·텐서, 벡터 연산, 내적과 유사도, 행렬곱, 선형변환과 기저",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [scalarsTensors, vectorOperations, dotProduct, matrixMultiplication, linearMapsBasis, rankEigen],
  recall: [
    { prompt: "② 내적과 코사인 유사도가 각각 무엇을 재는지 설명하고, a = [1, 2], b = [2, 1]의 코사인 유사도를 계산하십시오.", hint: "b의 길이를 10배로 늘려도 코사인 유사도가 변하지 않는 이유도 적어 보십시오." },
    { prompt: "⑤ 행렬-벡터 곱 Wx를 \"행마다 내적\"으로 설명하고, 곱할 수 있는 조건과 결과의 모양을 설명하십시오.", hint: "(m × n) 행렬과 길이 n인 벡터를 예로 들어 보십시오." },
  ],
});
