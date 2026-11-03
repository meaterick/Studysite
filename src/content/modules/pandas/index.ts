import { defineModule, md } from "../../kit";
import dataframes from "./dataframes";
import pandasSelection from "./pandas-selection";
import pandasAggregation from "./pandas-aggregation";
import dataTypes from "./data-types";

export default defineModule({
  slug: "pandas",
  track: "data",
  order: 2,
  title: "pandas 표 데이터",
  summary: "Series와 DataFrame, 조회·필터링·정렬, 그룹 집계와 결합, 자료 유형",
  anchor: md`
쉼표가 든 가격, \`-\`로 적힌 결측값, 문자열로 읽힌 날짜가 섞인 주문 CSV를 읽어 알맞은 자료형으로 바꾼다. 조건에 맞는 주문만 골라 정렬하고, 고객별 주문 수·구매액 같은 특성을 그룹 집계로 만든 뒤, 고객 정보 표와 행 수가 변하지 않도록 결합한다.
`,
  objectives: [
    "Series와 DataFrame의 구조를 설명하고, info·describe로 표를 확인하며 열 단위 계산으로 새 열을 만든다.",
    "CSV를 읽으며 결측 표기를 지정하고, loc·iloc·조건식으로 행과 열을 고르고 정렬하며, 고른 행에 값을 안전하게 대입한다.",
    "groupby·agg·transform으로 그룹 통계를 만들고, merge의 결합 방식과 키 중복을 점검하며, melt·pivot으로 표의 형태를 바꾼다.",
    "열의 데이터 유형을 판단하고, 숫자·범주·날짜 자료형으로 변환하며 날짜에서 특성을 꺼낸다.",
  ],
  lessons: [dataframes, pandasSelection, pandasAggregation, dataTypes],
  recall: [
    { prompt: "인덱스가 다른 두 Series를 더하면 어떻게 되는지 쓰고, `df['a']`와 `df[['a']]`의 차이를 쓰라." },
    { prompt: "`loc`과 `iloc`의 차이를 슬라이스의 끝 포함 여부와 함께 쓰고, 조건에 맞는 행의 값을 바꾸는 올바른 코드를 쓰라." },
    { prompt: "`groupby(...).sum()`과 `groupby(...).transform('sum')`이 돌려주는 행 수의 차이를 쓰고, 각각을 언제 쓰는지 예를 들어라." },
    { prompt: "`merge`에서 행 수가 줄거나 늘어나는 경우를 쓰고, 이를 막기 위한 확인 방법 두 가지를 쓰라." },
    { prompt: "숫자로 적혀 있지만 범주형인 열의 예를 들고, 가격 문자열과 날짜 문자열을 알맞은 자료형으로 바꾸는 코드를 쓰라." },
  ],
});
