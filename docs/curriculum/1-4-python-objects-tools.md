<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 1-4 객체·효율·개발 도구

[전체 목차](README.md) · 트랙 1 프로그래밍 기초 · [모듈 원본](../../src/content/modules/python-objects-tools/index.ts)

클래스와 객체, 자료구조와 시간복잡도, Git, 노트북과 재현 가능한 실행

## 목표 문제

학생 기록을 이름별·과목별로 바로 조회하는 기록부 클래스를 만들고, 데이터가 수만 건으로 늘어나도 조회가 느려지지 않도록 자료구조를 고른다. 작업은 Git 커밋으로 남기고, 시드와 환경을 기록해 누가 언제 실행해도 같은 결과가 나오게 한다. 이 모듈을 마치면 트랙 프로젝트 「학생 기록 정리 리포트」를 제출할 수 있으며, 이후 모델 클래스([4-2 선형회귀, 잔차, 평균제곱오차](4-2-linear-models.md#lesson-linear-regression))와 실험 기록([7-1 신뢰할 수 있는 실험 절차](7-1-capstone-project.md#lesson-research-methods))이 같은 방식을 따른다.

## 학습 목표

- 클래스로 상태와 동작을 묶고, fit·predict 형태의 모델 클래스를 작성한다.
- 연산 비용을 빅오 표기로 나타내고, 리스트·딕셔너리·집합·덱 중 알맞은 자료구조를 골라 이차 시간 코드를 선형 시간으로 바꾼다.
- 작업 폴더·스테이징 영역·저장소의 관계를 설명하고, 커밋 메시지와 .gitignore로 변경 이력을 관리한다.
- 노트북의 숨은 상태를 피하고, 시드·환경·데이터 해시를 기록해 같은 결과를 다시 얻는다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [클래스와 객체](#lesson-classes-objects) | 핵심 | 35분 | #13 클래스와 객체의 기초 |
| 2 | [기본 자료구조와 시간복잡도](#lesson-complexity) | 핵심 | 35분 | #14 기본 자료구조와 시간복잡도 |
| 3 | [Git과 버전 관리](#lesson-git-basics) | 핵심 | 25분 | #15 Git 기초와 코드 버전 관리 |
| 4 | [Jupyter Notebook과 재현 가능한 실행](#lesson-notebooks-reproducibility) | 핵심 | 35분 | #16 Jupyter Notebook과 재현 가능한 실행 |

## 핵심 레슨

<a id="lesson-classes-objects"></a>

### 1. 클래스와 객체

핵심 · 35분 · [본문 원본](../../src/content/modules/python-objects-tools/classes-objects.ts) · [실습 원본](../../src/content/modules/python-objects-tools/labs/classes-objects.ts)

**학습 목표:** 클래스로 상태(속성)와 동작(메서드)을 묶고 `self`와 `__init__`의 역할을 설명하며, fit·predict 형태의 모델 클래스를 작성한다.

**쓰이는 곳:** scikit-learn의 모델은 `model.fit(X, y)`로 학습하고 `model.predict(X)`로 예측하는 클래스이고, PyTorch의 신경망도 클래스로 정의한다([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)). [5-1 자동미분 엔진 구현](5-1-neural-networks.md#lesson-micrograd)에서 직접 만드는 자동미분 엔진의 `Value`도 값과 기울기를 함께 담은 클래스다.

**본문 절:** 클래스와 인스턴스 · 클래스가 필요한 경우 · fit과 predict: 모델 클래스의 형태

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3 · 그림 2

**실습**

- `ex1` 평균과 분산을 함께 유지하는 기록기 클래스

**서술형**

- `d1` 클래스와 인스턴스의 관계를 설명하고, 메서드의 첫 매개변수 `self`가 무엇을 가리키는지 적어라. 상태와 동작을 클래스로 묶으면 좋은 경우의 예를 하나 들어라.

**참고 자료**

- [Python 자습서 9장 — 클래스 (한국어)](https://docs.python.org/ko/3/tutorial/classes.html) — 9.3 클래스와의 첫 만남, 인스턴스 변수와 클래스 변수
- [scikit-learn — Developing scikit-learn estimators](https://scikit-learn.org/stable/developers/develop.html) — fit/predict 규약과 학습 속성의 밑줄 이름 관례 (영문)

<a id="lesson-complexity"></a>

### 2. 기본 자료구조와 시간복잡도

핵심 · 35분 · [본문 원본](../../src/content/modules/python-objects-tools/complexity.ts) · [실습 원본](../../src/content/modules/python-objects-tools/labs/complexity.ts)

**학습 목표:** 연산의 실행 시간이 입력 크기에 따라 늘어나는 정도를 빅오 표기로 나타내고, 리스트·딕셔너리·집합·덱의 주요 연산 비용을 비교해 알맞은 자료구조를 고른다.

**쓰이는 곳:** 데이터가 수백 건일 때는 어떤 방법이든 빠르지만, 수백만 건이 되면 같은 결과를 내는 코드의 실행 시간이 몇 초와 몇 시간으로 갈린다. 어휘 사전 조회([6-1 토큰화, 서브워드, 토큰 임베딩, 위치 정보](6-1-transformers.md#lesson-tokenization)), 유사한 문서 찾기([6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval))처럼 큰 데이터를 반복해서 찾는 작업은 자료구조 선택이 성능을 결정한다.

**본문 절:** 실행 시간을 입력 크기로 나타내기 · 자료구조별 연산 비용 · 스택과 큐 · 이차 시간을 선형 시간으로 바꾸기

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3

**실습**

- `ex1` 중복 검사와 두 수의 합을 선형 시간에

**서술형**

- `d1` 리스트 `a`와 `b`(각각 길이 $n$)에 공통으로 들어 있는 값을 찾는 두 가지 방법(중첩 반복, 집합 이용)의 시간복잡도를 비교하고, 집합을 쓰는 방법의 대가를 함께 설명하라.

**참고 자료**

- [Python Wiki — TimeComplexity](https://wiki.python.org/moin/TimeComplexity) — 리스트·deque·dict·set 연산의 시간복잡도 표 (영문)
- [Python 표준 라이브러리 — collections.deque (한국어)](https://docs.python.org/ko/3/library/collections.html#collections.deque) — 양 끝에서 O(1)로 넣고 빼는 큐

<a id="lesson-git-basics"></a>

### 3. Git과 버전 관리

핵심 · 25분 · [본문 원본](../../src/content/modules/python-objects-tools/git-basics.ts) · [실습 원본](../../src/content/modules/python-objects-tools/labs/git-basics.ts)

**학습 목표:** 작업 폴더·스테이징 영역·저장소·브랜치의 관계를 설명하고, 변경을 기록·비교·되돌리는 Git 명령의 흐름과 .gitignore로 저장소에 넣지 않을 파일을 정한다.

**쓰이는 곳:** 실험 코드는 계속 바뀌므로 어떤 결과가 어떤 코드에서 나왔는지 기록하지 않으면 재현할 수 없다. 커밋에 코드와 설정을 함께 남기면 몇 주 뒤에도 결과를 낸 정확한 버전으로 돌아갈 수 있고, 캡스톤 프로젝트([7-1 핵심 논문과 캡스톤 설계](7-1-capstone-project.md#lesson-capstone-design))도 이 방식으로 관리한다.

**본문 절:** Git이 하는 일 · 세 영역과 커밋 · 기본 명령 · 좋은 커밋 · 브랜치와 충돌 · 저장소에 넣지 않을 파일: .gitignore

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 그림 1

**실습**

- `ex1` git status 읽기와 .gitignore 규칙

**서술형**

- `d1` `git add`, `git commit`, `git push`가 각각 무엇을 하는지 순서대로 설명하고, 커밋 메시지에 '무엇을 왜' 바꿨는지 적는 이유를 실험 기록의 관점에서 설명하라.

**참고 자료**

- [Pro Git 2판 (한국어)](https://git-scm.com/book/ko/v2) — 2장 Git의 기초, 3장 브랜치
- [GitHub Docs — Ignoring files](https://docs.github.com/en/get-started/git-basics/ignoring-files) — .gitignore 작성법 (영문)

<a id="lesson-notebooks-reproducibility"></a>

### 4. Jupyter Notebook과 재현 가능한 실행

핵심 · 35분 · [본문 원본](../../src/content/modules/python-objects-tools/notebooks-reproducibility.ts) · [실습 원본](../../src/content/modules/python-objects-tools/labs/notebooks-reproducibility.ts)

**학습 목표:** 노트북의 셀 실행 순서와 커널 상태가 결과에 주는 영향을 설명하고, 처음부터 다시 실행·시드 고정·환경과 데이터 기록으로 같은 결과를 다시 얻는다.

**쓰이는 곳:** 실험 결과는 다른 사람이 같은 코드를 실행해 같은 숫자를 얻을 수 있을 때 근거가 된다. 이 과정의 과제는 '실행 환경 초기화 후 전체 실행'으로 재현되는지 확인하고 채점하며, 모델 비교([4-3 교차검증, 시계열 검증, 하이퍼파라미터 탐색](4-3-generalization.md#lesson-cross-validation))와 연구 보고([7-1 신뢰할 수 있는 실험 절차](7-1-capstone-project.md#lesson-research-methods))도 여러 시드의 결과로 판단한다.

**본문 절:** 노트북과 커널 · 숨은 상태 · 난수와 시드 · 환경과 데이터 기록 · 이 사이트와 Colab

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3

**실습**

- `ex1` 시드로 재현되는 데이터 분할

**서술형**

- `d1` 내 컴퓨터에서 잘 돌던 노트북을 동료가 실행했더니 숫자가 다르게 나오거나 오류가 났다. 원인이 될 수 있는 것을 세 가지 들고, 각각을 막는 방법을 설명하라.

**참고 자료**

- [Google Colab 소개](https://colab.research.google.com/notebooks/intro.ipynb) — 셀 실행, GPU 런타임 설정
- [NumPy — Random Generator](https://numpy.org/doc/stable/reference/random/generator.html) — default_rng로 시드를 가진 생성기 만들기 (영문)
- [Python 표준 라이브러리 — hashlib (한국어)](https://docs.python.org/ko/3/library/hashlib.html) — SHA-256 해시 계산

## 백지 복습

1. 클래스, 인스턴스, 속성, 메서드, `self`의 관계를 예제 클래스 하나로 설명하라.
2. 리스트와 집합에서 `x in ...`의 시간복잡도를 비교하고, 반복문 안의 포함 여부 검사를 빠르게 바꾸는 방법을 쓰라.
3. `git add`, `git commit`, `git push`의 역할과 스테이징 영역이 필요한 이유를 설명하라.
4. 노트북에서 셀 실행 순서 때문에 생기는 문제를 하나 들고, 제출 전에 확인할 방법을 쓰라.
5. 같은 결과를 다시 얻기 위해 실험 결과와 함께 기록할 것 네 가지를 쓰라.

## 과제: 학생 기록 정리 리포트

저장 키 `python-records-report` · 자기 점검 · [과제 원본](../../src/content/modules/python-objects-tools/assignment.ts)

과목별 점수 기록이 담긴 CSV 파일을 **표준 라이브러리만으로** 읽어, 잘못된 줄을 종류별로 기록하고, 과목별·학생별 요약을 계산해 JSON 파일로 저장합니다. 트랙 1의 파일 입출력, 컬렉션과 함수, 예외 처리, 클래스, 시간복잡도, 재현 가능한 실행을 한 작업 공간에서 함께 씁니다. 모든 코드는 브라우저에서 실행됩니다.

**핵심** 단계 네 개(기록 읽기·요약 계산·기록부 클래스·리포트 저장)를 먼저 완료합니다. **보충**(빠진 과목 찾기)과 **심화**(큰 데이터에서 조회 시간 비교) 단계는 선택입니다. 마지막으로 "실행 환경 초기화" 후 "전체 실행"으로 처음부터 같은 결과가 나오는지 확인합니다.

### 요구사항

- `load_records`가 정상 기록 17건을 정수 점수로 읽고, 문제가 있는 다섯 줄을 줄 번호와 사유로 기록한다.
- `subject_summary`, `student_means`, `top_students`가 과목별 개수·평균·최고점과 학생별 평균, 상위 학생을 계산한다(평균이 같으면 이름순).
- `RecordBook`이 잘못된 점수에 `ValueError`를 일으키고, 이름별·과목별 조회를 딕셔너리로 바로 처리한다.
- 리포트를 `report.json`에 한국어 그대로(UTF-8) 저장하고, 다시 읽은 내용이 저장 전과 같다. 시드 42로 고른 학생 표본이 매번 같다.
- 실행 환경을 초기화한 뒤 처음부터 실행해도 같은 결과가 나온다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| 기록 읽기와 잘못된 줄 처리 | 핵심 | 코드 `load-data`, 코드 `load-code`, 답안 `load-answer`(최소 80자) |
| 과목별·학생별 요약 | 핵심 | 코드 `summary-code`, 답안 `summary-answer`(최소 200자) |
| 기록부 클래스 | 핵심 | 코드 `class-code`, 답안 `class-answer`(최소 60자) |
| 리포트 저장과 재현 확인 | 핵심 | 코드 `report-code`, 답안 `report-answer`(최소 60자) |
| 보충: 빠진 과목 찾기 | 보충 | 코드 `missing-code`, 답안 `missing-answer` |
| 심화: 큰 데이터에서 조회 시간 비교 | 심화 | 코드 `scale-code`, 답안 `scale-answer` |

### 자기 점검 기준

| 기준 | 확인 내용 |
| --- | --- |
| 데이터 읽기와 오류 처리 | 문제가 있는 줄을 종류별로 구분해 줄 번호와 함께 기록하고, 정상 줄은 빠짐없이 정수 점수로 읽었습니다. 잘못된 값을 0점으로 바꾸지 않은 이유를 설명했습니다. |
| 집계의 정확성 | 과목별 개수·평균·최고점, 학생별 평균, 상위 학생(동점 처리 포함)이 정확하고, 평균 비교의 한계를 설명했습니다. |
| 클래스 설계와 자료구조 선택 | RecordBook이 잘못된 점수를 거부하고 복사본을 돌려주며, 딕셔너리를 고른 이유를 시간복잡도로 설명했습니다. |
| 재현성과 코드 품질 | 초기화 후 전체 실행으로 같은 결과가 나오고, 저장한 JSON을 다시 읽은 내용이 같으며, 함수가 입력을 바꾸지 않습니다. |

### 자동 테스트

- `load`: 정상 기록 17건과 문제 줄 다섯 개를 정확히 구분한다
- `summary`: 과목별 요약과 상위 학생이 정확하다
- `class`: RecordBook이 잘못된 점수를 거부하고 복사본을 돌려준다
- `report`: 표본이 재현되고 JSON 저장 전후가 같다
- `missing`: 빠진 과목이 있는 학생을 찾는다

### 선택 심화 문제

- `ch1` 중앙값과 최빈값
