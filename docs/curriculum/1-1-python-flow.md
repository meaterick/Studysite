<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 1-1 값과 제어 흐름

[전체 목차](README.md) · 트랙 1 프로그래밍 기초 · [모듈 원본](../../src/content/modules/python-flow/index.ts)

변수와 자료형, 기본 연산, 조건문과 반복문

## 목표 문제

파일에서 읽은 문자열 점수 목록을 숫자로 바꾸고, 잘못된 값을 걸러 낸 뒤 평균·최고점·등급별 인원을 계산해 정해진 서식으로 출력하는 프로그램을 작성한다. 값과 자료형, 연산, 조건문, 반복문만으로 작성할 수 있는 프로그램이며, 이후 트랙에서 데이터를 읽고 정리하고 학습 루프를 도는 모든 코드가 이 형태를 확장한 것이다.

## 학습 목표

- 대입문이 이름과 객체를 연결하는 방식을 설명하고, 문자열로 들어온 값을 int·float·bool로 올바르게 변환한다.
- 산술·문자열 연산과 연산자 우선순위를 적용해 식의 값을 계산하고, f-string으로 결과를 서식에 맞게 출력한다.
- 비교·논리 연산과 if/elif/else로 조건 분기를 작성하고, 진릿값 규칙과 단락 평가를 설명한다.
- for·while 반복문과 break·continue로 누적, 탐색, 조건부 종료를 구현한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [변수, 값, 자료형, 형 변환](#lesson-variables-types) | 핵심 | 35분 | #1 변수와 값, 자료형, 형 변환 |
| 2 | [숫자·문자열·불리언과 기본 연산](#lesson-operators) | 핵심 | 40분 | #2 숫자·문자열·불리언과 기본 연산 |
| 3 | [비교 연산, 논리 연산, 조건문](#lesson-conditionals) | 핵심 | 35분 | #3 비교 연산, 논리 연산, 조건문 |
| 4 | [반복문과 반복 제어](#lesson-loops) | 핵심 | 40분 | #4 반복문과 반복 제어 |

## 핵심 레슨

<a id="lesson-variables-types"></a>

### 1. 변수, 값, 자료형, 형 변환

핵심 · 35분 · [본문 원본](../../src/content/modules/python-flow/variables-types.ts) · [실습 원본](../../src/content/modules/python-flow/labs/variables-types.ts)

**학습 목표:** 대입문이 이름과 객체를 연결하는 방식을 설명하고, int·float·str·bool·None을 구분하며, 문자열로 들어온 값을 알맞은 자료형으로 변환한다.

**쓰이는 곳:** 모든 데이터 처리 코드는 값을 변수에 담아 계산한다. 파일이나 입력 창에서 읽은 값은 숫자처럼 보여도 문자열이므로, 숫자로 변환하지 않으면 평균이나 손실을 계산할 수 없다. 자료형을 다루는 규칙은 [3-2 수치형·범주형·시계열 데이터](3-2-pandas.md#lesson-data-types)의 표 데이터 자료형 처리로 그대로 이어진다.

**본문 절:** 코드 셀 실행하기 · 값, 객체, 변수 · 기본 자료형 · 형 변환 · 동적 타이핑

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 4

**실습**

- `ex1` 문자열 기록을 자료형에 맞게 변환하기

**서술형**

- `d1` 설문 파일에서 회원 여부가 `"yes"`/`"no"` 문자열로 들어온다. `bool(값)`으로 변환하면 어떤 문제가 생기는지 설명하고, 올바른 변환 방법을 써라.

**참고 자료**

- [Python 자습서 3장 — 파이썬의 간략한 소개 (한국어)](https://docs.python.org/ko/3/tutorial/introduction.html) — 숫자, 문자열, 대입의 기본 동작
- [Python 자습서 15장 — 부동 소수점 산술: 문제점 및 한계 (한국어)](https://docs.python.org/ko/3/tutorial/floatingpoint.html) — 0.1 + 0.2가 0.3이 아닌 이유
- [점프 투 파이썬 2장 (위키독스)](https://wikidocs.net/book/1) — 자료형을 예제와 함께 정리한 한국어 입문서

<a id="lesson-operators"></a>

### 2. 숫자·문자열·불리언과 기본 연산

핵심 · 40분 · [본문 원본](../../src/content/modules/python-flow/operators.ts) · [실습 원본](../../src/content/modules/python-flow/labs/operators.ts)

**학습 목표:** 산술·문자열 연산과 연산자 우선순위를 적용해 식의 값을 계산하고, 몫·나머지·거듭제곱과 f-string 서식을 데이터 처리 코드에 쓴다.

**쓰이는 곳:** 손실 계산, 데이터를 배치로 나눌 때의 반복 횟수, 실험 결과의 출력 서식처럼 모델 코드의 대부분은 기본 연산의 조합이다. 몫·나머지는 데이터를 일정한 크기로 나누는 계산([1-2 인덱싱과 슬라이싱](1-2-python-collections-functions.md#lesson-indexing-slicing))에, 거듭제곱은 오차를 제곱하는 손실([4-1 손실함수, 목적함수, 학습과 추론](4-1-ml-framing.md#lesson-loss-functions))에 그대로 쓰인다.

**본문 절:** 산술 연산 · 연산자 우선순위 · 복합 대입과 정수·실수의 혼합 · 문자열 연산 · f-string으로 결과 출력하기 · 불리언도 수처럼 계산된다

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 5

**실습**

- `ex1` 몫·나머지와 결과 서식

**서술형**

- `d1` `/`와 `//`의 차이를 설명하고, 데이터 1,000개를 32개씩 나눌 때 각각이 어디에 필요한지 예를 들어라.

**참고 자료**

- [Python 언어 레퍼런스 6.17 — 연산자 우선순위 (한국어)](https://docs.python.org/ko/3/reference/expressions.html#operator-precedence) — 모든 연산자의 우선순위 표
- [Python 표준 라이브러리 — 문자열 메서드 (한국어)](https://docs.python.org/ko/3/library/stdtypes.html#string-methods) — strip, split, join, replace 등 전체 목록
- [Python 자습서 7.1 — 출력 서식 (한국어)](https://docs.python.org/ko/3/tutorial/inputoutput.html#formatted-string-literals) — f-string과 서식 지정

<a id="lesson-conditionals"></a>

### 3. 비교 연산, 논리 연산, 조건문

핵심 · 35분 · [본문 원본](../../src/content/modules/python-flow/conditionals.ts) · [실습 원본](../../src/content/modules/python-flow/labs/conditionals.ts)

**학습 목표:** 비교·논리 연산의 결과를 계산하고, if/elif/else의 실행 순서와 진릿값 규칙을 적용해 조건 분기 코드를 작성한다.

**쓰이는 곳:** 데이터 정제에서 잘못된 값을 거르는 규칙, 분류 모델이 출력한 확률을 임계값과 비교해 클래스를 정하는 단계([4-2 로지스틱 회귀, 시그모이드, 분류 임계값](4-2-linear-models.md#lesson-logistic-regression)), 손실이 더 줄지 않으면 학습을 멈추는 조건이 모두 조건문으로 작성된다.

**본문 절:** 비교 연산 · 논리 연산과 단락 평가 · 진릿값 · if, elif, else · 조건 표현식

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3

**실습**

- `ex1` 점수 등급과 확률 임계값

**서술형**

- `d1` 조건 `x == 1 or 2`가 x의 값과 관계없이 참이 되는 이유를 단락 평가와 진릿값으로 설명하고, 의도대로 고친 조건을 써라.

**참고 자료**

- [Python 자습서 4.1 — if 문 (한국어)](https://docs.python.org/ko/3/tutorial/controlflow.html#if-statements) — if/elif/else의 기본 형태
- [Python 표준 라이브러리 — 진릿값 검사 (한국어)](https://docs.python.org/ko/3/library/stdtypes.html#truth-value-testing) — 거짓으로 취급하는 값의 전체 목록

<a id="lesson-loops"></a>

### 4. 반복문과 반복 제어

핵심 · 40분 · [본문 원본](../../src/content/modules/python-flow/loops.ts) · [실습 원본](../../src/content/modules/python-flow/labs/loops.ts)

**학습 목표:** for와 while 반복문으로 누적·탐색·조건부 종료를 구현하고, range와 break·continue로 반복 횟수와 종료 시점을 제어한다.

**쓰이는 곳:** 모델 학습은 같은 계산을 정해진 횟수만큼, 또는 조건을 만족할 때까지 반복하는 일이다. 데이터를 여러 번 훑는 학습 루프([2-3 최솟값과 경사하강법](2-3-calculus-optimization.md#lesson-gradient-descent))와 손실이 더 줄지 않으면 멈추는 조기 종료가 모두 이 레슨의 반복문과 종료 조건으로 작성된다.

**본문 절:** for 반복문과 range · 누적: 합계, 개수, 최댓값 · while 반복문 · break와 continue · 중첩 반복 · 학습 루프의 형태

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 6

**실습**

- `ex1` 탐색과 조기 종료

**서술형**

- `d1` for 반복문과 while 반복문을 각각 어떤 상황에 쓰는지 설명하고, 학습 루프에서 두 방식을 함께 쓰는 예(최대 반복 횟수와 조기 종료)를 들어라.

**참고 자료**

- [Python 자습서 4.2~4.5 — for 문, range, break와 continue (한국어)](https://docs.python.org/ko/3/tutorial/controlflow.html#for-statements) — 반복문의 기본 형태와 else 절

## 백지 복습

1. `x = 10` 다음에 `x = x + 1`을 실행할 때 무슨 일이 일어나는지 이름과 객체라는 말을 써서 설명하라.
2. 파일에서 읽은 문자열 `" 175.5 "`와 `"no"`를 각각 계산에 쓸 실수와 불리언으로 바꾸는 방법을 쓰고, `bool("no")`를 쓰면 안 되는 이유를 설명하라.
3. `-7 / 2`, `-7 // 2`, `-7 % 2`의 값을 쓰고, 데이터를 일정한 크기로 나눌 때 `//`와 `%`를 어디에 쓰는지 예를 들어라.
4. if/elif/else에서 조건의 순서가 결과를 바꾸는 예를 하나 들고, `x == 1 or 2`가 항상 참이 되는 이유를 설명하라.
5. 최대 반복 횟수와 조기 종료 조건을 모두 갖춘 반복문의 형태를 코드로 쓰고, `break`와 `continue`의 차이를 설명하라.
