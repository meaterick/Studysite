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
영화 다섯 편에 대한 세 사람의 평점을 벡터로 나타내고, 코사인 유사도로 취향이 가장 비슷한 두 사람을 찾는다. 특성 4개짜리 샘플 100개를 $100 \times 4$ 행렬 $X$로 쌓고, 출력 3개인 층 $XW + b$($W$: $4 \times 3$)의 출력 모양과 값을 행렬곱 한 번으로 계산한다. 행렬의 열을 보고 그 행렬이 평면을 어떻게 바꾸는지 읽고, 행렬식이 0인 행렬이 왜 입력을 되찾을 수 없게 만드는지 설명한다.
`,
  objectives: [
    "스칼라·벡터·행렬·텐서를 차원 수와 모양으로 구분하고, 표·이미지·문장 데이터를 알맞은 모양의 배열로 나타낸다.",
    "벡터의 덧셈·스칼라곱·선형결합을 성분별로 계산하고, 내적·길이·거리·코사인 유사도를 구해 두 벡터의 비슷함을 비교한다.",
    "행렬-벡터 곱과 행렬곱을 내적으로 계산하고, 모양 규칙과 전치 규칙을 적용해 신경망 한 층의 계산을 샘플 묶음에 대해 쓴다.",
    "행렬의 열을 기저 벡터의 상으로 읽고, 선형독립·기저·좌표를 구하며, 행렬식으로 역행렬이 있는지 판단한다.",
  ],
  lessons: [scalarsTensors, vectorOperations, dotProduct, matrixMultiplication, linearMapsBasis, rankEigen],
  recall: [
    { prompt: "모양이 $(16, 28, 28, 3)$인 컬러 이미지 묶음 텐서에서 각 축이 무엇을 뜻하는지 쓰고, 원소 개수와 이미지 한 장을 벡터로 펼쳤을 때의 길이를 계산하라." },
    { prompt: "내적과 코사인 유사도의 정의를 쓰고, $a = [1, 2]$, $b = [2, 1]$의 코사인 유사도를 계산하라. $b$를 10배로 늘려도 코사인 유사도가 변하지 않는 이유를 설명하라." },
    { prompt: "$(m \\times n)$ 행렬과 $(n \\times p)$ 행렬의 곱의 모양과 $(i, j)$ 원소의 식을 쓰고, $AB \\ne BA$인 예와 $(AB)^\\top$을 전치로 나타낸 식을 쓰라." },
    { prompt: "샘플 묶음 $X$($n \\times d$)에 출력 $k$개인 층 $XW + b$를 적용할 때 $W$와 $b$의 모양과 결과의 모양을 쓰라." },
    { prompt: "선형변환의 두 성질을 쓰고, $Ae_1$이 $A$의 무엇인지 설명하라. 행렬식이 0인 $2 \\times 2$ 행렬의 예를 들고 역행렬이 없는 이유를 설명하라." },
  ],
});
