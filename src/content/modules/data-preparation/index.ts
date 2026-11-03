import { defineModule, md } from "../../kit";
import dataCleaning from "./data-cleaning";
import visualization from "./visualization";
import eda from "./eda";
import encodingScaling from "./encoding-scaling";
import featureEngineering from "./feature-engineering";
import assignment from "./assignment";

export default defineModule({
  slug: "data-preparation",
  track: "data",
  order: 3,
  title: "정제·탐색·특성",
  summary: "결측치·이상치 처리, 시각화, 탐색적 데이터 분석, 인코딩과 스케일링, 특성 공학",
  anchor: md`
중고차 매물 데이터에서 "Hyundai"와 "현대 "처럼 다르게 적힌 브랜드, 다시 등록된 매물, 연식 2099 같은 잘못된 값, 판매가 끝난 뒤에야 기록되는 가격 열을 찾아낸다. 결측을 채우는 기준과 범주 목록은 학습 데이터에서만 계산해 테스트 데이터에 적용하고, 범주형 열은 원-핫 인코딩으로, 연식과 주행거리는 나이·연간 주행거리 같은 특성으로 바꾼다. 무엇을 발견하고 어떻게 처리했는지는 데이터 카드로 남긴다.
`,
  objectives: [
    "결측·중복·표기 불일치·잘못된 값·이상치를 찾아 원인에 맞게 처리하고, 결측을 채우는 기준을 학습 데이터에서만 계산한다.",
    "질문에 맞는 그래프를 고르고 matplotlib으로 그리며, 그래프가 잘못 읽히는 설정을 피한다.",
    "정해진 순서로 데이터를 점검해 품질 문제와 클래스 불균형, 누수 후보를 찾고 결과를 기록한다.",
    "범주형 인코딩과 스케일링을 상황에 맞게 고르고, fit과 transform을 나눠 적용한다.",
    "파생 특성을 만들고 중복 특성을 골라내며, 차원의 저주가 거리 기반 방법에 주는 영향을 설명한다.",
  ],
  lessons: [dataCleaning, visualization, eda, encodingScaling, featureEngineering],
  recall: [
    { prompt: "결측의 원인 세 가지를 쓰고, 원인에 따라 행 삭제가 위험해지는 경우를 설명하라. 결측 표시 열을 남기는 이유도 쓰라." },
    { prompt: "데이터 `[12, 13, 13, 14, 14, 15, 16, 95]`에서 IQR 방법과 Z-score 방법의 판정이 다른 이유를 가림 효과로 설명하라." },
    { prompt: "변수 하나의 분포, 두 수치형 변수의 관계, 범주에 따른 차이를 볼 때 각각 어떤 그래프를 쓰는지와, 그래프가 잘못 읽히는 경우 두 가지를 쓰라." },
    { prompt: "EDA의 점검 순서를 쓰고, 목표 변수와 상관이 매우 큰 특성을 발견했을 때 누수인지 판단하는 질문을 쓰라." },
    { prompt: "원-핫 인코딩과 순서 정수 인코딩을 각각 언제 쓰는지, 스케일러를 학습 데이터로만 fit해야 하는 이유, 차원의 저주가 무엇인지 쓰라." },
  ],
  assignment,
});
