import { defineModule, md } from "../../kit";
import aiLandscape from "./ai-landscape";
import endToEndDemo from "./end-to-end-demo";

export default defineModule({
  slug: "course-overview",
  track: "intro",
  order: 1,
  title: "AI 시스템 개요",
  summary: "AI·머신러닝·딥러닝·생성형 AI의 관계와, 데이터에서 예측·생성까지의 전체 처리 과정",
  anchor: md`
집 면적으로 가격을 예측하는 회귀 모델과, 앞 글자를 보고 다음 글자를 고르는 언어 모델을 브라우저에서 직접 실행한다. 두 시스템은 하는 일이 다르지만 **데이터로 파라미터를 정하고, 손실로 그 결과를 평가한다**는 같은 원리로 동작한다. 이 모듈을 마치면 이후 트랙에서 배우는 각 개념이 이 처리 과정의 어느 단계에 쓰이는지 짚을 수 있다.
`,
  objectives: [
    "AI·머신러닝·딥러닝·생성형 AI·파운데이션 모델의 관계를 분류 기준(방법·기능)과 함께 설명한다.",
    "학습을 손실 $L(\\theta)$를 최소화하는 파라미터 $\\theta$를 찾는 문제로 정의하고, 작은 예에서 손실을 직접 계산한다.",
    "데이터 분할 → 학습 → 평가 → 예측·생성의 처리 과정을 회귀 모델과 언어 모델에 각각 대응시킨다.",
  ],
  lessons: [aiLandscape, endToEndDemo],
  recall: [
    { prompt: "AI, 머신러닝, 딥러닝, 생성형 AI의 관계를 그림으로 그리고, 생성형 AI가 포함관계 사슬 안에 들어가지 않는 이유를 설명하라.", hint: "두 분류의 기준이 무엇인지부터 적는다." },
    { prompt: "머신러닝의 학습을 수식 한 줄로 쓰고, 각 기호가 무엇을 뜻하는지 설명하라." },
    { prompt: "집 면적으로 가격을 예측하는 모델을 만드는 과정을 데이터 분할부터 새 입력의 예측까지 순서대로 쓰라.", hint: "평가 데이터를 언제, 왜 따로 두는지 포함한다." },
    { prompt: "글자 단위 언어 모델이 문장을 생성하는 방법을 '다음 글자의 확률분포'라는 표현을 써서 설명하라." },
  ],
});
