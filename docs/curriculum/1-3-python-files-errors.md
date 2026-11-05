<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 1-3 파일·오류·모듈

[전체 목차](README.md) · 트랙 1 프로그래밍 기초 · [모듈 원본](../../src/content/modules/python-files-errors/index.ts)

텍스트·CSV·JSON 파일 입출력, 오류 메시지와 예외 처리, 모듈·패키지·가상환경

## 목표 문제

설문 응답 CSV 파일을 읽어 잘못된 줄은 건너뛰고 몇 줄을 건너뛰었는지 기록한 뒤, 문항별 요약 통계를 JSON 파일로 저장하는 스크립트를 작성한다. 자주 쓰는 함수는 모듈 파일로 나누고, 같은 패키지 버전으로 다른 컴퓨터에서도 실행할 수 있도록 의존성을 기록한다. 데이터 파일을 다루는 이후의 모든 코드([3-2 pandas의 Series와 DataFrame](3-2-pandas.md#lesson-dataframes), [3-3 결측치, 중복값, 이상치, 잘못된 자료형](3-3-data-preparation.md#lesson-data-cleaning))가 이 흐름을 따른다.

## 학습 목표

- with와 open으로 텍스트 파일을 읽고 쓰며, csv·json 모듈로 표와 중첩 데이터를 저장하고 다시 읽는다.
- 트레이스백에서 예외의 종류와 위치를 읽고, 예상한 예외만 try/except로 처리하며, 잘못된 입력에는 예외를 일으킨다.
- 최소 재현과 중간 값 확인으로 버그의 원인을 좁힌다.
- import 규칙과 모듈 검색 순서를 설명하고, 가상환경과 requirements.txt로 의존성을 격리·기록·재설치한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [파일 입출력: 텍스트, CSV, JSON](#lesson-file-io) | 핵심 | 35분 | #10 파일 입출력: 텍스트, CSV, JSON |
| 2 | [오류 메시지 읽기, 예외 처리, 디버깅](#lesson-errors-debugging) | 핵심 | 40분 | #11 오류 메시지 읽기, 예외 처리, 디버깅 |
| 3 | [모듈, 패키지, 가상환경, 의존성](#lesson-modules-environments) | 핵심 | 35분 | #12 모듈, 패키지, 가상환경, 의존성 |

## 핵심 레슨

<a id="lesson-file-io"></a>

### 1. 파일 입출력: 텍스트, CSV, JSON

핵심 · 35분 · [본문 원본](../../src/content/modules/python-files-errors/file-io.ts) · [실습 원본](../../src/content/modules/python-files-errors/labs/file-io.ts)

**학습 목표:** open과 with로 텍스트 파일을 읽고 쓰며, csv·json 모듈로 표 형식과 중첩 구조의 데이터를 저장한 뒤 같은 내용으로 다시 읽어 들인다.

**쓰이는 곳:** 학습 데이터는 대부분 CSV나 JSON 파일로 주어지고, 실험 설정과 결과도 파일로 남겨야 나중에 비교하고 재현할 수 있다. [3-2 pandas의 Series와 DataFrame](3-2-pandas.md#lesson-dataframes)의 `read_csv`는 이 레슨의 CSV 읽기와 자료형 변환을 한 번에 해 주는 도구다.

**본문 절:** 파일과 경로 · 텍스트 파일 쓰고 읽기 · CSV: 표 형식의 데이터 · JSON: 중첩된 데이터 · 어떤 형식을 쓰는가

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 4

**실습**

- `ex1` CSV 저장·복원과 JSON 설정 읽기

**서술형**

- `d1` 학생 점수 기록을 CSV와 JSON 중 어느 형식으로 저장할지 정하려고 한다. 두 형식의 차이를 자료형과 구조의 관점에서 설명하고, 각각이 더 알맞은 경우를 예로 들어라.

**참고 자료**

- [Python 자습서 7.2 — 파일을 읽고 쓰기 (한국어)](https://docs.python.org/ko/3/tutorial/inputoutput.html#reading-and-writing-files) — open, with, json 저장
- [Python 표준 라이브러리 — csv (한국어)](https://docs.python.org/ko/3/library/csv.html) — DictReader, DictWriter, newline=''
- [Python 표준 라이브러리 — pathlib (한국어)](https://docs.python.org/ko/3/library/pathlib.html) — Path로 경로 다루기

<a id="lesson-errors-debugging"></a>

### 2. 오류 메시지 읽기, 예외 처리, 디버깅

핵심 · 40분 · [본문 원본](../../src/content/modules/python-files-errors/errors-debugging.ts) · [실습 원본](../../src/content/modules/python-files-errors/labs/errors-debugging.ts)

**학습 목표:** 트레이스백에서 오류의 종류·위치·원인을 읽고, try/except로 예상한 예외만 처리하며, 최소 재현과 assert·print로 버그의 원인을 좁힌다.

**쓰이는 곳:** 데이터 처리와 모델 학습 코드는 잘못된 입력, 모양이 맞지 않는 배열, 0으로 나누기 같은 이유로 자주 멈춘다. 오류 메시지를 정확히 읽고 원인을 좁히는 절차는 [3-3 결측치, 중복값, 이상치, 잘못된 자료형](3-3-data-preparation.md#lesson-data-cleaning)에서 잘못된 값을 처리할 때와 [3-1 NumPy 배열, 축, 형태, 자료형](3-1-numpy.md#lesson-numpy-arrays)에서 배열의 shape 오류를 고칠 때 그대로 쓰인다.

**본문 절:** 트레이스백 읽기 · 자주 만나는 예외 · 예외 처리: try와 except · 예외 일으키기 · assert로 가정 확인하기 · 디버깅 절차

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 5

**실습**

- `ex1` 잘못된 값 건너뛰기와 입력 검사

**서술형**

- `d1` CSV에서 읽은 점수 중 일부가 비어 있거나 "결석"처럼 숫자가 아니다. 이 값들을 처리하는 방법으로 ① 해당 줄을 건너뛰고 개수를 기록하기, ② 0으로 바꾸기를 비교하고, 어느 쪽이 나은지 근거와 함께 설명하라.

**참고 자료**

- [Python 자습서 8장 — 에러와 예외 (한국어)](https://docs.python.org/ko/3/tutorial/errors.html) — try/except/else/finally, raise
- [Python 표준 라이브러리 — 내장 예외 (한국어)](https://docs.python.org/ko/3/library/exceptions.html) — 예외의 종류와 계층

<a id="lesson-modules-environments"></a>

### 3. 모듈, 패키지, 가상환경, 의존성

핵심 · 35분 · [본문 원본](../../src/content/modules/python-files-errors/modules-environments.ts) · [실습 원본](../../src/content/modules/python-files-errors/labs/modules-environments.ts)

**학습 목표:** import로 모듈과 패키지를 불러오는 규칙을 설명하고, 가상환경과 requirements.txt로 프로젝트의 의존성을 격리·기록·재설치한다.

**쓰이는 곳:** NumPy, pandas, scikit-learn, PyTorch는 모두 패키지로 설치해 import해 쓴다. 패키지 버전이 다르면 같은 코드도 다른 결과를 내거나 실행되지 않으므로, 의존성을 기록해 두어야 실험을 다른 컴퓨터에서 재현할 수 있다([1-4 Jupyter Notebook과 재현 가능한 실행](1-4-python-objects-tools.md#lesson-notebooks-reproducibility)).

**본문 절:** 모듈과 import · 표준 라이브러리와 외부 패키지 · 내 모듈 만들기 · pip과 버전 · 가상환경 · 의존성 기록과 재설치

**구성:** 확인 문제 5 · 서술형 1 · 실습 1 · 코드 셀 3 · 그림 1

**실습**

- `ex1` requirements.txt 읽고 설치 상태 확인하기

**서술형**

- `d1` 가상환경이 해결하는 문제를 설명하고, 가상환경 폴더(`.venv/`) 대신 `requirements.txt`를 공유하는 이유를 써라.

**참고 자료**

- [Python 자습서 6장 — 모듈 (한국어)](https://docs.python.org/ko/3/tutorial/modules.html) — import 방식, 모듈 검색 경로, 패키지
- [Python 자습서 12장 — 가상 환경 및 패키지 (한국어)](https://docs.python.org/ko/3/tutorial/venv.html) — venv와 pip, requirements.txt
- [Pyodide에서 쓸 수 있는 패키지 목록](https://pyodide.org/en/stable/usage/packages-in-pyodide.html) — 브라우저 실행 환경에서 import할 수 있는 패키지

## 백지 복습

1. 파일 열기 모드 `r`, `w`, `a`의 차이를 쓰고, 파일을 `with`로 여는 이유를 설명하라.
2. CSV와 JSON에 같은 데이터를 저장했다가 다시 읽을 때 각각 무엇이 달라지는지(자료형, 키, 튜플) 설명하라.
3. 트레이스백을 읽는 순서를 쓰고, 오류가 난 줄과 원인이 생긴 곳이 다를 수 있는 예를 들어라.
4. `except:`로 모든 예외를 잡으면 안 되는 이유와, `assert`와 `raise`를 각각 어디에 쓰는지 설명하라.
5. 가상환경을 만들고 패키지를 설치한 뒤 다른 사람이 같은 환경을 만들 수 있게 하기까지의 명령을 순서대로 쓰라.
