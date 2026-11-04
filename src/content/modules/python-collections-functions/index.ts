import { defineModule, md } from "../../kit";
import collections from "./collections";
import indexingSlicing from "./indexing-slicing";
import functionsScope from "./functions-scope";
import mutabilityCopy from "./mutability-copy";
import comprehensionsIterators from "./comprehensions-iterators";

export default defineModule({
  slug: "python-collections-functions",
  track: "programming",
  order: 2,
  title: "컬렉션과 함수",
  summary: "리스트·튜플·딕셔너리·집합, 인덱싱과 슬라이싱, 함수, 참조와 복사, 컴프리헨션과 반복자",
  anchor: md`
학생 기록(이름·과목·점수)의 리스트를 받아 과목별 평균, 과목별 최고점 학생, 이름 → 점수 조회표를 만드는 함수를 작성한다. 함수는 원본 기록을 바꾸지 않고 새 결과를 돌려주며, 데이터를 앞뒤로 나누거나 일정한 크기의 묶음으로 차례로 내주는 함수도 함께 만든다. 이 함수들의 구조는 [[lesson:dataframes]]에서 표 데이터를 다루는 방식과 [[lesson:pytorch]]의 데이터 로더로 이어진다.
`,
  objectives: [
    "리스트·튜플·딕셔너리·집합의 성질을 비교하고, 문제에 맞는 자료구조를 골라 추가·조회·삭제·순회한다.",
    "인덱싱과 슬라이싱으로 원소와 구간을 꺼내 데이터를 나누고 연속 구간을 자른다.",
    "매개변수·기본값·반환값을 갖춘 함수를 정의하고, 변수의 범위 규칙과 함수를 인자로 넘기는 방법을 적용한다.",
    "대입과 인자 전달이 객체를 공유한다는 점을 설명하고, 얕은 복사와 깊은 복사를 구분해 원본을 보호한다.",
    "컴프리헨션으로 변환과 걸러내기를 쓰고, 반복자와 제너레이터의 동작을 설명한다.",
  ],
  lessons: [collections, indexingSlicing, functionsScope, mutabilityCopy, comprehensionsIterators],
  recall: [
    { prompt: "리스트·튜플·딕셔너리·집합을 순서·중복·변경 가능 여부로 비교하는 표를 만들고, 각각의 쓰임새를 하나씩 쓰라." },
    { prompt: "`data[:k]`와 `data[k:]`로 데이터를 나누는 코드를 쓰고, 끝 인덱스를 포함하지 않는 규칙이 이 분할에서 왜 편리한지 설명하라." },
    { prompt: "기본값이 있는 매개변수와 키워드 인자를 쓰는 함수를 하나 정의하고, 함수 안에서 전역 변수에 대입하면 어떻게 되는지 설명하라." },
    { prompt: "`b = a`, `b = a.copy()`, `b = copy.deepcopy(a)`의 차이를 안쪽에 리스트가 들어 있는 딕셔너리 `a`로 설명하라.", hint: "바깥 객체와 안쪽 객체를 나눠서 생각한다." },
    { prompt: "레이블 이름 → 번호 딕셔너리를 컴프리헨션으로 만들고, `zip` 결과를 두 번 순회하면 어떻게 되는지 설명하라." },
  ],
});
