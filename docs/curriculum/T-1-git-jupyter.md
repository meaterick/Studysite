<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# T-1 Git과 Jupyter Notebook

[전체 목차](README.md) · 트랙 T 개발 도구 · [모듈 원본](../../src/content/modules/git-jupyter/index.ts)

Git으로 코드 변경 이력 관리하기, 노트북의 실행 순서와 숨은 상태, 시드·환경·데이터 기록으로 결과 재현하기

## 목표 문제

작은 실험 코드를 Git 저장소로 관리한다. 관련된 변경만 골라 무엇을 왜 바꿨는지 적은 커밋으로 남기고, 비밀값과 큰 데이터는 `.gitignore`로 저장소 밖에 둔다. 실험은 노트북에서 실행하되, 실행 환경을 초기화한 뒤 처음부터 실행해도 같은 숫자가 나오도록 시드를 고정하고, 결과와 함께 코드 버전(커밋 해시)·패키지 버전·데이터 해시·설정을 기록한다. Python 문법과 별개인 선택 분야라서 완료 조건은 없다. Python 분야의 과제 「학생 기록 정리 리포트」의 재현 확인 단계와 캡스톤의 실험 기록([7-1 신뢰할 수 있는 실험 절차](7-1-capstone-project.md#lesson-research-methods))이 이 방법을 쓴다.

## 학습 목표

- 작업 폴더·스테이징 영역·저장소의 관계를 설명하고, 커밋 메시지와 .gitignore로 변경 이력을 관리한다.
- 노트북의 숨은 상태를 피하고, 시드·환경·데이터 해시를 기록해 같은 결과를 다시 얻는다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [Git과 버전 관리](#lesson-git-basics) | 심화 | 25분 | — |
| 2 | [Jupyter Notebook과 재현 가능한 실행](#lesson-notebooks-reproducibility) | 심화 | 35분 | — |

## 심화 레슨

<a id="lesson-git-basics"></a>

### 1. Git과 버전 관리

심화 · 25분 · [본문 원본](../../src/content/modules/git-jupyter/git-basics.ts) · [실습 원본](../../src/content/modules/git-jupyter/labs/git-basics.ts)

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

### 2. Jupyter Notebook과 재현 가능한 실행

심화 · 35분 · [본문 원본](../../src/content/modules/git-jupyter/notebooks-reproducibility.ts) · [실습 원본](../../src/content/modules/git-jupyter/labs/notebooks-reproducibility.ts)

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

1. `git add`, `git commit`, `git push`의 역할과 스테이징 영역이 필요한 이유를 설명하라.
2. 노트북에서 셀 실행 순서 때문에 생기는 문제를 하나 들고, 제출 전에 확인할 방법을 쓰라.
3. 같은 결과를 다시 얻기 위해 실험 결과와 함께 기록할 것 네 가지를 쓰라.
