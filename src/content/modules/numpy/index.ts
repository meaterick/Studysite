import { defineModule, md } from "../../kit";
import numpyArrays from "./numpy-arrays";
import arrayIndexing from "./array-indexing";
import vectorization from "./vectorization";

export default defineModule({
  slug: "numpy",
  track: "data",
  order: 1,
  title: "NumPy 배열",
  summary: "배열의 축·형태·자료형, 인덱싱과 브로드캐스팅, 벡터화와 난수 시드",
  anchor: md`
학생 수백 명의 과목별 점수가 담긴 배열에서 과목별 평균과 학생별 순위를 반복문 없이 계산하고, 기준을 넘는 학생만 골라낸다. 점 수천 개 사이의 모든 거리를 배열 연산 한 번으로 구해 가장 가까운 점을 찾고, 같은 시드로 학습용·평가용 데이터를 항상 같게 나눈다.
`,
  objectives: [
    "NumPy 배열을 만들고 자료형을 확인·변환하며, 원소별 연산과 축을 지정한 집계의 결과와 모양을 예측한다.",
    "인덱싱·슬라이싱·불리언 마스킹·정수 배열로 원소를 고르고, 뷰와 복사본을 구분한다.",
    "브로드캐스팅 규칙으로 모양이 다른 배열의 연산 결과를 예측하고, (n, 1)과 (n,)을 섞는 버그를 찾는다.",
    "반복문을 배열 연산으로 바꾸고, 난수 생성기와 시드로 무작위 과정을 재현한다.",
  ],
  lessons: [numpyArrays, arrayIndexing, vectorization],
  recall: [
    { prompt: "모양이 `(n, d)`인 배열에 `sum(axis=0)`과 `sum(axis=1)`을 적용한 결과의 모양과 뜻을 쓰라. `keepdims=True`는 언제 쓰는지도 쓰라." },
    { prompt: "정수 배열에 실수를 넣을 때와 문자열이 섞인 리스트로 배열을 만들 때 각각 어떤 일이 생기는지 쓰라." },
    { prompt: "슬라이싱과 불리언 마스킹의 결과가 각각 뷰인지 복사본인지 쓰고, 두 조건을 함께 거는 마스크 식을 쓰라." },
    { prompt: "브로드캐스팅 규칙 세 가지를 쓰고, `(n, 1)`과 `(n,)`을 빼면 어떤 모양이 되어 왜 위험한지 설명하라." },
    { prompt: "점 n개와 m개 사이의 모든 거리 제곱을 브로드캐스팅으로 구하는 식을 쓰고, 시드를 고정한 생성기를 반복문 밖에서 한 번만 만들어야 하는 이유를 설명하라." },
  ],
});
