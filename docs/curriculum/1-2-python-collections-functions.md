<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 1-2 컬렉션과 함수

[전체 목차](README.md) · 트랙 1 프로그래밍 기초 · [모듈 원본](../../src/content/modules/python-collections-functions/index.ts)

리스트·튜플·딕셔너리·집합, 인덱싱과 슬라이싱, 함수, 참조와 복사, 컴프리헨션과 반복자

## 목표 문제

학생 기록(이름·과목·점수)의 리스트를 받아 과목별 평균, 과목별 최고점 학생, 이름 → 점수 조회표를 만드는 함수를 작성한다. 함수는 원본 기록을 바꾸지 않고 새 결과를 돌려주며, 데이터를 앞뒤로 나누거나 일정한 크기의 묶음으로 차례로 내주는 함수도 함께 만든다. 이 함수들의 구조는 [3-2 pandas의 Series와 DataFrame](3-2-pandas.md#lesson-dataframes)에서 표 데이터를 다루는 방식과 [5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)의 데이터 로더로 이어진다.

## 학습 목표

- 리스트·튜플·딕셔너리·집합의 성질을 비교하고, 문제에 맞는 자료구조를 골라 추가·조회·삭제·순회한다.
- 인덱싱과 슬라이싱으로 원소와 구간을 꺼내 데이터를 나누고 연속 구간을 자른다.
- 매개변수·기본값·반환값을 갖춘 함수를 정의하고, 변수의 범위 규칙과 함수를 인자로 넘기는 방법을 적용한다.
- 대입과 인자 전달이 객체를 공유한다는 점을 설명하고, 얕은 복사와 깊은 복사를 구분해 원본을 보호한다.
- 컴프리헨션으로 변환과 걸러내기를 쓰고, 반복자와 제너레이터의 동작을 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [리스트, 튜플, 딕셔너리, 집합](#lesson-collections) | 핵심 | 45분 | #5 리스트, 튜플, 딕셔너리, 집합 |
| 2 | [인덱싱과 슬라이싱](#lesson-indexing-slicing) | 핵심 | 35분 | #6 인덱싱과 슬라이싱 |
| 3 | [함수, 매개변수, 반환값, 변수의 범위](#lesson-functions-scope) | 핵심 | 40분 | #7 함수, 매개변수, 반환값, 변수의 범위 |
| 4 | [가변·불변 객체와 참조·복사](#lesson-mutability-copy) | 핵심 | 40분 | #8 가변·불변 객체, 참조와 복사 |
| 5 | [컴프리헨션과 반복자](#lesson-comprehensions-iterators) | 핵심 | 40분 | #9 리스트 컴프리헨션과 반복자 |

## 핵심 레슨

<a id="lesson-collections"></a>

### 1. 리스트, 튜플, 딕셔너리, 집합

핵심 · 45분 · [본문 원본](../../src/content/modules/python-collections-functions/collections.ts) · [실습 원본](../../src/content/modules/python-collections-functions/labs/collections.ts)

**학습 목표:** 리스트·튜플·딕셔너리·집합의 순서·중복·변경 가능 여부를 비교하고, 문제에 맞는 자료구조를 골라 원소를 추가·조회·삭제·순회한다.

**쓰이는 곳:** 학습 데이터는 샘플의 리스트로, 실험 설정은 딕셔너리로, 어휘(서로 다른 단어 목록)는 집합으로 다룬다. [3-1 NumPy 배열, 축, 형태, 자료형](3-1-numpy.md#lesson-numpy-arrays)의 배열과 [3-2 pandas의 Series와 DataFrame](3-2-pandas.md#lesson-dataframes)의 표도 이 자료구조로 만든 데이터를 받아서 시작한다.

**본문 절:** 네 가지 컬렉션 · 리스트 · 튜플 · 딕셔너리 · 집합 · 문제에 맞는 자료구조 고르기

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 6

**실습**

- `ex1` 단어 빈도와 공통 어휘

**서술형**

- `d1` 리스트·튜플·집합·딕셔너리의 차이를 순서·중복·변경 가능 여부로 설명하고, 머신러닝 코드에서 각각을 쓰는 예를 하나씩 들어라.

**참고 자료**

- [Python 자습서 5장 — 자료 구조 (한국어)](https://docs.python.org/ko/3/tutorial/datastructures.html) — 리스트 메서드, 튜플, 집합, 딕셔너리

<a id="lesson-indexing-slicing"></a>

### 2. 인덱싱과 슬라이싱

핵심 · 35분 · [본문 원본](../../src/content/modules/python-collections-functions/indexing-slicing.ts) · [실습 원본](../../src/content/modules/python-collections-functions/labs/indexing-slicing.ts)

**학습 목표:** 양수·음수 인덱스와 [시작:끝:간격] 슬라이싱으로 리스트·튜플·문자열의 원소와 구간을 꺼내고, 데이터 분할·구간 자르기·중첩 리스트 선택에 적용한다.

**쓰이는 곳:** 데이터를 학습용과 평가용으로 나누기, 최근 n개의 기록 보기, 시계열에서 길이 k의 구간을 잘라 입력으로 만들기가 모두 슬라이싱이다. 같은 문법이 [3-1 인덱싱, 불리언 마스킹, 브로드캐스팅](3-1-numpy.md#lesson-array-indexing)에서 다차원 배열의 행과 열을 고르는 데 그대로 쓰인다.

**본문 절:** 인덱스 · 슬라이싱 · 데이터를 앞뒤로 나누기 · 연속 구간 자르기 · 중첩 리스트

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 4 · 그림 1

**실습**

- `ex1` 데이터 분할과 구간 자르기

**서술형**

- `d1` 슬라이싱 `[시작:끝]`이 끝 인덱스를 포함하지 않는 규칙의 장점을, 데이터를 앞 80%와 뒤 20%로 나누는 예로 설명하라.

**참고 자료**

- [Python 자습서 3.1.2 — 문자열의 인덱싱과 슬라이싱 (한국어)](https://docs.python.org/ko/3/tutorial/introduction.html#text) — 인덱스와 슬라이스의 기본 규칙

<a id="lesson-functions-scope"></a>

### 3. 함수, 매개변수, 반환값, 변수의 범위

핵심 · 40분 · [본문 원본](../../src/content/modules/python-collections-functions/functions-scope.ts) · [실습 원본](../../src/content/modules/python-collections-functions/labs/functions-scope.ts)

**학습 목표:** 매개변수·기본값·키워드 인자·반환값을 갖춘 함수를 정의하고, 지역·전역 범위 규칙과 함수를 값으로 넘기는 방법을 적용한다.

**쓰이는 곳:** 전처리, 손실 계산, 평가 지표는 모두 입력을 받아 값을 돌려주는 함수로 작성한다. 같은 계산을 함수로 묶어야 실험마다 같은 방식으로 다시 쓸 수 있다. 수학의 함수와 합성([2-1 함수, 정의역·치역, 함수의 합성](2-1-math-functions.md#lesson-functions-composition)), 연산을 이어 붙여 기울기를 구하는 역전파([5-1 순전파, 역전파, 계산 그래프](5-1-neural-networks.md#lesson-backprop))도 이 구조를 그대로 쓴다.

**본문 절:** 함수 정의와 호출 · 매개변수: 위치, 키워드, 기본값 · 여러 값을 돌려주기 · 변수의 범위 · 함수도 값이다 · 함수를 잘 나누는 기준

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 5

**실습**

- `ex1` 손실 함수와 평가 함수

**서술형**

- `d1` 함수 안에서 전역 변수를 직접 바꾸는 대신 매개변수와 반환값을 쓰는 것이 좋은 이유를, 같은 실험을 설정만 바꿔 여러 번 실행하는 상황을 예로 들어 설명하라.

**참고 자료**

- [Python 자습서 4.7~4.9 — 함수 정의, 인자, 람다 (한국어)](https://docs.python.org/ko/3/tutorial/controlflow.html#defining-functions) — 기본값, 키워드 인자, lambda
- [Python 자습서 9.2 — 스코프와 이름 공간 (한국어)](https://docs.python.org/ko/3/tutorial/classes.html#python-scopes-and-namespaces) — 이름을 찾는 순서

<a id="lesson-mutability-copy"></a>

### 4. 가변·불변 객체와 참조·복사

핵심 · 40분 · [본문 원본](../../src/content/modules/python-collections-functions/mutability-copy.ts) · [실습 원본](../../src/content/modules/python-collections-functions/labs/mutability-copy.ts)

**학습 목표:** 가변·불변 자료형을 구분하고, 대입과 함수 인자 전달이 같은 객체를 공유한다는 점과 얕은 복사·깊은 복사의 차이를 코드로 확인한다.

**쓰이는 곳:** 전처리 함수에 데이터를 넘겼더니 원본이 바뀌거나, 실험 설정을 복사했다고 생각했는데 두 설정이 함께 바뀌는 오류는 찾기 어렵다. [3-2 데이터 불러오기, 조회, 필터링, 정렬](3-2-pandas.md#lesson-pandas-selection)에서 원본과 복사본을 구분하는 문제, [5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)에서 텐서가 메모리를 공유하는 문제도 같은 원리다.

**본문 절:** 두 이름이 같은 객체를 가리킬 때 · 가변 객체와 불변 객체 · 얕은 복사와 깊은 복사 · 함수에 넘긴 객체는 공유된다 · 기본값으로 가변 객체를 쓰면 안 된다

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 5 · 그림 1

**실습**

- `ex1` 원본을 바꾸지 않는 함수

**서술형**

- `d1` 함수가 인자로 받은 리스트를 그 자리에서 고칠 때 생기는 문제를 예로 들고, 이를 피하는 방법 두 가지를 설명하라.

**참고 자료**

- [Python 표준 라이브러리 — copy: 얕은 복사와 깊은 복사 연산 (한국어)](https://docs.python.org/ko/3/library/copy.html) — copy()와 deepcopy()의 차이
- [Python 자습서 4.8.1 — 기본 인자 값 (한국어)](https://docs.python.org/ko/3/tutorial/controlflow.html#default-argument-values) — 기본값이 한 번만 평가된다는 주의 사항

<a id="lesson-comprehensions-iterators"></a>

### 5. 컴프리헨션과 반복자

핵심 · 40분 · [본문 원본](../../src/content/modules/python-collections-functions/comprehensions-iterators.ts) · [실습 원본](../../src/content/modules/python-collections-functions/labs/comprehensions-iterators.ts)

**학습 목표:** 리스트·딕셔너리·집합 컴프리헨션으로 변환과 걸러내기를 한 식에 쓰고, 반복자와 제너레이터가 값을 한 번씩 차례로 만든다는 점을 enumerate·zip·sum과 함께 적용한다.

**쓰이는 곳:** 토큰 목록을 번호로 바꾸기, 조건에 맞는 샘플만 고르기, 레이블 이름과 번호의 대응표 만들기는 컴프리헨션 한 줄로 쓴다. 데이터를 한꺼번에 메모리에 올리지 않고 묶음 단위로 차례로 내주는 데이터 로더([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch))는 이 레슨의 제너레이터와 같은 방식으로 동작한다.

**본문 절:** 리스트 컴프리헨션 · 딕셔너리·집합 컴프리헨션 · enumerate와 zip · 반복자: 한 번 꺼내면 끝난다 · 제너레이터: 필요할 때 하나씩 만든다 · 컴프리헨션을 쓰지 않을 때

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 6

**실습**

- `ex1` 성적 요약 함수: 빈 리스트까지 안전하게

**서술형**

- `d1` `zip` 결과 같은 반복자를 두 번 순회하면 두 번째에 아무 값도 나오지 않는 이유를 설명하고, 같은 데이터를 여러 번 순회해야 할 때의 해결 방법을 써라.

**참고 자료**

- [Python 자습서 5.1.3 — 리스트 컴프리헨션 (한국어)](https://docs.python.org/ko/3/tutorial/datastructures.html#list-comprehensions) — 중첩 컴프리헨션 포함
- [Python 자습서 9.8~9.10 — 이터레이터, 제너레이터, 제너레이터 표현식 (한국어)](https://docs.python.org/ko/3/tutorial/classes.html#iterators) — iter, next, yield의 동작

## 백지 복습

1. 리스트·튜플·딕셔너리·집합을 순서·중복·변경 가능 여부로 비교하는 표를 만들고, 각각의 쓰임새를 하나씩 쓰라.
2. `data[:k]`와 `data[k:]`로 데이터를 나누는 코드를 쓰고, 끝 인덱스를 포함하지 않는 규칙이 이 분할에서 왜 편리한지 설명하라.
3. 기본값이 있는 매개변수와 키워드 인자를 쓰는 함수를 하나 정의하고, 함수 안에서 전역 변수에 대입하면 어떻게 되는지 설명하라.
4. `b = a`, `b = a.copy()`, `b = copy.deepcopy(a)`의 차이를 안쪽에 리스트가 들어 있는 딕셔너리 `a`로 설명하라.
5. 레이블 이름 → 번호 딕셔너리를 컴프리헨션으로 만들고, `zip` 결과를 두 번 순회하면 어떻게 되는지 설명하라.
