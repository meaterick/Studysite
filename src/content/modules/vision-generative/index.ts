import { defineModule, md } from "../../kit";
import generativeModels from "./generative-models";
import detectionSegmentation from "./detection-segmentation";
import multimodal from "./multimodal";
import generativeMath from "./generative-math";

export default defineModule({
  slug: "vision-generative",
  track: "extension",
  order: 2,
  title: "비전과 생성 모델",
  summary: "생성 모델, 탐지·분할 평가, 멀티모달 모델",
  anchor: md`
분류 모델은 입력이 주어졌을 때 정답을 고르지만, 이미지를 만들거나 위치를 찾거나 이미지와 문장을 함께 다루려면 다른 종류의 모델과 평가 지표가 필요하다. 이 모듈은 오토인코더, VAE, GAN, 확산 모델이 새 데이터를 만드는 원리를 비교하고, 확산 모델의 순방향 과정과 노이즈 예측을 구현한다. 객체 탐지와 분할의 결과를 IoU, NMS, AP, Dice로 계산하고, CLIP의 대조 학습으로 이미지와 문장을 같은 공간에 정렬해 zero-shot 분류를 하며, VLM이 이미지를 LLM에 넣는 구조를 다룬다. 심화 레슨에서는 ELBO와 재매개변수화 트릭, 확산 모델의 손실을 유도한다. 확장 모듈이므로 완료 조건은 없다.
`,
  objectives: [
    "오토인코더, VAE, GAN, 확산 모델이 새 데이터를 만드는 원리와 품질, 다양성, 생성 속도, 학습 안정성의 차이를 설명한다.",
    "확산 모델의 순방향 과정을 닫힌 형태로 구현하고, 노이즈 예측으로 원본을 되찾는 계산을 한다.",
    "상자와 마스크의 IoU와 Dice를 계산하고, NMS로 중복 상자를 정리하며, 점수순 탐지 결과로 AP를 구한다.",
    "CLIP의 대조 학습을 유사도 행렬로 설명하고, 문장 템플릿과 프롬프트 앙상블로 zero-shot 분류를 구현한다.",
    "옌센 부등식으로 ELBO를 유도하고, 재매개변수화 트릭이 필요한 이유와 확산 모델의 노이즈 예측 손실을 설명한다.",
  ],
  lessons: [generativeModels, detectionSegmentation, multimodal, generativeMath],
  recall: [
    { prompt: "오토인코더와 VAE가 입력을 잠재공간의 무엇으로 매핑하는지 쓰고, VAE에서 새 데이터를 생성할 수 있는 이유를 KL 항으로 설명하라." },
    { prompt: "GAN의 생성자와 판별자가 각각 무엇을 학습하는지 쓰고, 확산 모델의 순방향·역방향 과정과 신경망이 예측하는 대상을 쓰라." },
    { prompt: "상자 $(0, 0, 4, 4)$와 $(2, 2, 6, 6)$의 IoU를 계산하고, NMS의 절차와 분할에서 픽셀 정확도 대신 Dice를 쓰는 이유를 쓰라." },
    { prompt: "CLIP의 대조 학습을 $N \\times N$ 유사도 행렬로 설명하고, zero-shot 분류에서 프롬프트 앙상블이 정확도를 높이는 이유를 쓰라." },
  ],
});
