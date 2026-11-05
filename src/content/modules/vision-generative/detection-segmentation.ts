import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/detection-segmentation";

export default defineLesson({
  id: "detection-segmentation",
  title: "탐지·분할의 평가: IoU, NMS, AP, Dice",
  tier: "supplement",
  requires: ["cnn-architectures", "classification-metrics"],
  goal: "상자와 마스크의 IoU·Dice를 계산하고, NMS로 중복 상자를 정리하며, 점수순 탐지 결과로 Precision·Recall과 AP를 구할 수 있다.",
  why: "탐지와 분할 모델의 논문과 벤치마크는 결과를 IoU, AP, mAP, Dice로 보고한다. 이 지표가 무엇을 재는지 알아야 결과표를 해석하고 모델을 비교할 수 있으며, 탐지 모델을 직접 쓸 때는 NMS 임계값을 데이터에 맞게 정해야 한다.",
  body: md`
[[lesson:cnn-architectures]]에서 객체 탐지(Object Detection)와 의미론적 분할(Semantic Segmentation)이 분류와 어떻게 다른 문제인지 구분했다. 이 레슨은 두 과제의 결과를 계산하고 평가하는 네 가지 도구를 다룬다. 모델 구조가 달라도(YOLO, Faster R-CNN, DETR, U-Net) 이 계산은 공통으로 쓰이므로, 논문이나 대회의 결과표를 읽으려면 알아야 한다.

### IoU: 두 상자가 얼마나 겹치는가

예측 상자와 정답 상자가 "맞았다"고 말하려면 겹침의 정도를 하나의 숫자로 재야 한다. **IoU(Intersection over Union)**는 두 영역이 겹친 넓이를 합친 넓이로 나눈 값이다.

$$\text{IoU}(A, B) = \frac{|A \cap B|}{|A \cup B|} = \frac{|A \cap B|}{|A| + |B| - |A \cap B|}$$

완전히 일치하면 1, 전혀 안 겹치면 0이다. 상자 $(0, 0, 4, 4)$와 $(2, 2, 6, 6)$은 각각 넓이 16이고 겹친 부분은 $2 \times 2 = 4$이므로 IoU는 $4/(16 + 16 - 4) = 4/28 \approx 0.143$이다. 가로와 세로가 각각 변의 절반씩 어긋났을 뿐인데 IoU는 0.14로 낮다. 탐지에서는 보통 IoU가 0.5 이상이면 맞힌 것으로 본다.

[[diagram:iou-examples]]

### NMS: 같은 물체를 가리키는 상자 정리

탐지 모델은 한 물체 주변에 비슷한 상자를 여러 개 내놓는 경향이 있다. **NMS(Non-Maximum Suppression)**는 점수가 가장 높은 상자를 먼저 확정하고, 그 상자와 IoU가 임계값(예: 0.5)을 넘는 다른 상자들을 "같은 물체에 대한 중복"으로 보고 지운 뒤, 남은 상자들에서 같은 과정을 반복한다. 단순한 탐욕 알고리즘이지만 거의 모든 탐지 파이프라인의 마지막 단계에 들어간다. 임계값을 너무 낮추면 붙어 있는 서로 다른 물체(군중 속 사람들)까지 지우고, 너무 높이면 중복이 남는다.

:::example 예제: NMS 한 바퀴
한 고양이 주변에 상자 세 개가 나왔다. A(점수 0.9), B(점수 0.8, A와 IoU 0.7), C(점수 0.6, A와 IoU 0.1, B와 IoU 0.2). 임계값 0.5로 NMS를 하면 ① 점수가 가장 높은 A를 확정하고, ② A와 IoU 0.7인 B는 0.5를 넘으므로 지우고, ③ A와 IoU 0.1인 C는 남는다. 남은 후보 중 C가 가장 높으므로 확정한다. 결과는 A와 C 두 상자로, C는 옆에 있는 다른 고양이를 가리키고 있을 가능성이 크다.
:::

[[diagram:nms-steps]]

### AP와 mAP: 탐지기 전체의 성적

탐지기의 출력은 "점수가 붙은 상자 목록"이다. 점수 높은 순으로 정렬해 하나씩 내려가며, 각 상자가 아직 매칭되지 않은 정답과 IoU 0.5 이상으로 겹치면 TP, 아니면 FP로 표시한다. 그러면 지점마다 Precision과 Recall이 정해지고(임계값을 낮춰 가며 PR 곡선을 그리는 것과 같다, [[lesson:roc-pr]]), 그 PR 곡선 아래 면적이 **AP(Average Precision)**다. 간단한 정의로는 "TP가 나온 지점들의 Precision을 더해 정답 개수로 나눈 값"을 쓴다. 클래스마다 AP를 구해 평균하면 **mAP**이고, COCO 벤치마크는 IoU 임계값을 0.5부터 0.95까지 바꿔 가며 평균한 mAP@[.5:.95]를 쓴다. 상자를 대충 맞히는 모델과 정밀하게 맞히는 모델을 구분하기 위해서다.

:::example 예제: 탐지 결과 세 개로 AP 계산하기
정답 물체가 2개이고, 탐지기가 점수순으로 낸 상자 세 개의 판정이 TP, FP, TP다. 위에서부터 내려가며 Precision을 세면 첫 상자에서 $1/1 = 1$, 둘째에서 $1/2$, 셋째에서 $2/3$이다. TP가 나온 지점(첫째, 셋째)의 Precision을 더해 정답 수 2로 나누면 $\text{AP} = (1 + 0.667)/2 \approx 0.833$이다. 만약 순서가 TP, TP, FP였다면(점수가 높은 상자가 더 정확했다면) $(1 + 1)/2 = 1$이 된다. AP는 "맞힌 상자에 높은 점수를 주는가"까지 평가하는 셈이다.
:::

[[diagram:ap-steps]]

### 분할의 평가: 픽셀 IoU와 Dice

분할에서는 상자 대신 픽셀 집합(마스크)으로 같은 계산을 한다. 픽셀 단위 IoU와 함께 의료 영상에서 특히 많이 쓰는 지표가 **Dice 계수**다.

$$\text{Dice}(A, B) = \frac{2|A \cap B|}{|A| + |B|}$$

Dice와 IoU는 $\text{Dice} = \frac{2\,\text{IoU}}{1 + \text{IoU}}$로 일대일 대응하므로 순위는 같고, Dice가 항상 IoU 이상이다. Dice는 작은 구조물(종양처럼 전체 픽셀의 1%도 안 되는 영역)에서도 배경을 맞힌 픽셀 수의 영향을 받지 않는다는 장점이 있어, 손실함수(Dice loss)로도 쓰인다. 픽셀 정확도(맞힌 픽셀의 비율)는 배경이 99%인 영상에서 "전부 배경"이라고만 답해도 99%가 나오므로, 불균형한 분류에서 정확도가 갖는 문제([[lesson:baselines]])를 그대로 가진 지표다.

[[diagram:dice-iou]]
`,
  checks: [
    {
      key: "c1",
      question: "넓이 16인 정사각형 상자 두 개가 넓이 8만큼 겹친다. IoU는?",
      choices: ["$8/24 = 1/3$", "$8/16 = 0.5$", "$8/32 = 0.25$", "$16/24$"],
      answer: 0,
      explanation: "IoU = 겹친 넓이 / 합친 넓이 = $8/(16 + 16 - 8) = 8/24$. 합친 넓이에서 겹친 부분을 한 번 빼야 한다.",
    },
    {
      key: "c2",
      question: "NMS 임계값을 너무 낮게(예: 0.1) 잡으면 생기는 문제는?",
      choices: ["서로 가까이 붙은 다른 물체의 상자까지 중복으로 보고 지운다", "중복 상자가 더 많이 남는다", "IoU를 계산할 수 없다", "점수가 낮은 상자만 남는다"],
      answer: 0,
      explanation: "조금만 겹쳐도 같은 물체로 보고 지우므로 군중 속 사람처럼 붙어 있는 물체를 놓친다. 반대로 너무 높이면 같은 물체의 중복 상자가 남는다.",
    },
    {
      key: "c3",
      question: "마스크 IoU가 0.5일 때 Dice 계수는?",
      choices: ["$2/3$", "$0.5$", "$0.25$", "$1$"],
      answer: 0,
      explanation: "$\\text{Dice} = 2\\,\\text{IoU}/(1 + \\text{IoU}) = 1/1.5 = 2/3$. Dice는 항상 IoU 이상이고 순위는 같다.",
    },
    {
      key: "c4",
      question: "정답 물체 2개에 대해 점수순 판정이 TP, TP, FP인 탐지기의 AP(위 정의)는?",
      choices: ["1.0", "0.833", "0.667", "0.5"],
      answer: 0,
      explanation: "TP가 나온 첫째·둘째 지점의 Precision이 $1/1$, $2/2$라 $(1 + 1)/2 = 1$이다. 높은 점수의 상자가 모두 맞았으므로 최고점이다.",
    },
    {
      key: "c5",
      question: "NMS(임계값 0.5)에서 점수가 가장 높은 상자 A와 IoU 0.3인 상자 B는 어떻게 되는가?",
      choices: ["지워지지 않고 남는다(다른 물체일 수 있다)", "중복으로 지워진다", "A와 합쳐진다", "점수가 0.3으로 바뀐다"],
      answer: 0,
      explanation: "NMS는 확정된 상자와 IoU가 임계값을 **넘는** 상자만 같은 물체의 중복으로 보고 지운다. 0.3이면 따로 남아 다음 단계에서 다시 판단된다.",
    },
    {
      key: "c6",
      question: "종양이 영상 픽셀의 1%를 차지하는 의료 영상 분할에서, 모든 픽셀을 '배경'으로 예측하는 모델의 픽셀 정확도와 종양 클래스의 Dice는?",
      choices: ["픽셀 정확도 99%, Dice 0", "픽셀 정확도 1%, Dice 0", "둘 다 99%", "픽셀 정확도 50%, Dice 0.5"],
      answer: 0,
      explanation: "배경 99%를 모두 맞혀 정확도는 99%지만, 종양 픽셀을 하나도 예측하지 않아 $|A\\cap B| = 0$이므로 Dice는 0이다. 불균형한 분류에서 정확도가 갖는 문제가 픽셀 단위로 나타나는 경우라서, 분할에서는 Dice나 IoU를 본다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    return inter / (area(a) + area(b) - inter)
print(iou((0, 0, 10, 10), (5, 0, 15, 10)), iou((0, 0, 2, 2), (0, 0, 4, 4)))
`,
      expected: "0.3333333333333333 0.25",
      explanation: "첫 쌍은 가로로 절반 겹쳐 겹친 넓이 50, 합친 넓이 $100 + 100 - 50 = 150$이라 1/3이다. 둘째 쌍은 작은 상자가 큰 상자 안에 완전히 들어 있어 겹친 넓이 4, 합친 넓이 16이라 0.25다. 완전히 포함되어도 크기가 다르면 IoU가 낮다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "상자 $(0,0,4,4)$와 $(2,2,6,6)$의 IoU를 계산하라. 탐지 결과에 NMS가 필요한 이유와 임계값이 너무 낮거나 높을 때의 문제, 분할 평가에서 픽셀 정확도 대신 Dice나 IoU를 쓰는 이유를 설명하라.",
      answer: md`
두 상자는 각각 넓이 16이고 겹친 부분은 $2\times2=4$이므로 IoU $= 4/(16+16-4) = 4/28 \approx 0.143$이다. 탐지 모델은 한 물체 주위에 비슷한 상자를 여러 개 내놓으므로, 점수가 가장 높은 상자를 확정하고 그와 IoU가 임계값을 넘는 상자를 중복으로 지우는 NMS로 정리한다. 임계값이 너무 낮으면 서로 붙어 있는 다른 물체의 상자까지 지워 물체를 놓치고, 너무 높으면 같은 물체에 대한 중복 상자가 남는다. 분할에서 배경이 대부분인 영상은 "전부 배경"이라고만 답해도 픽셀 정확도가 매우 높게 나오므로, 관심 영역의 겹침만 보는 IoU나 Dice($2|A\cap B|/(|A|+|B|)$)를 쓴다.
`,
      keyPoints: ["IoU는 겹친 넓이를 합친 넓이로 나눈 값이며 예시의 IoU는 $4/28 \\approx 0.143$이다", "NMS는 점수가 가장 높은 상자와 IoU가 임계값을 넘는 상자를 중복으로 지운다", "임계값이 너무 낮으면 붙어 있는 다른 물체를 지우고, 너무 높으면 중복이 남는다", "배경이 대부분이면 픽셀 정확도가 높게 나오므로 관심 영역의 겹침을 보는 IoU나 Dice를 쓴다"],
    },
  ],
  references: [
    { title: "COCO — Detection Evaluation", url: "https://cocodataset.org/#detection-eval", note: "mAP@[.5:.95] 등 표준 탐지 지표의 정의 (영문)" },
    { title: "Dive into Deep Learning — 14.3 Anchor Boxes, 14.9 Semantic Segmentation", url: "https://d2l.ai/", note: "IoU, NMS, 분할을 코드로 구현한 무료 교재 (영문)" },
  ],
});
