import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/notebooks-reproducibility";

export default defineLesson({
  id: "notebooks-reproducibility",
  title: "Jupyter Notebook과 재현 가능한 실행",
  tier: "core",
  concepts: ["notebooks-reproducibility"],
  goal: "노트북의 셀 실행 순서와 커널 상태가 결과에 주는 영향을 설명하고, 처음부터 다시 실행·시드 고정·환경과 데이터 기록으로 같은 결과를 다시 얻는다.",
  why: "실험 결과는 다른 사람이 같은 코드를 실행해 같은 숫자를 얻을 수 있을 때 근거가 된다. 이 과정의 과제는 '실행 환경 초기화 후 전체 실행'으로 재현되는지 확인하고 채점하며, 모델 비교([[lesson:cross-validation]])와 연구 보고([[lesson:research-methods]])도 여러 시드의 결과로 판단한다.",
  body: md`
### 노트북과 커널

**Jupyter Notebook**은 코드를 셀 단위로 나눠 실행하고, 결과(출력·표·그림)를 셀 아래에 바로 보여 주는 문서 형식이다(\`.ipynb\`). Google Colab은 Jupyter 노트북을 클라우드에서 실행하는 서비스다. 셀을 실행하는 파이썬 프로세스를 **커널(kernel)**이라고 하며, 커널은 지금까지 실행한 모든 셀의 결과(변수, 함수, 불러온 모듈)를 메모리에 유지한다. 이 사이트의 레슨 코드 셀과 과제 작업 공간도 같은 방식으로 동작한다.

### 숨은 상태

커널은 화면에 보이는 셀이 아니라 **실행한 순서**를 기억한다. 그래서 다음과 같은 일이 생긴다.

- 셀 A에서 \`threshold = 0.5\`를 정의하고 셀 B에서 썼다. 나중에 셀 A를 지워도 커널에는 \`threshold\`가 남아 있어 셀 B가 계속 동작한다. 노트북을 다시 열어 처음부터 실행하면 셀 B에서 \`NameError\`가 난다.
- 셀 C에서 \`data = data * 2\`를 실행했다. 이 셀을 두 번 실행하면 데이터가 네 배가 된다. 화면만 보면 두 배로 보인다.
- 아래쪽 셀을 먼저 실행한 뒤 위쪽 셀의 변수를 바꾸면, 화면의 출력은 지금 코드와 다른 상태에서 나온 결과다.

셀 왼쪽의 실행 번호(\`[3]\`, \`[7]\`)가 위에서 아래로 차례대로 늘어나지 않으면 이런 문제가 있을 수 있다. 결과를 공유하거나 제출하기 전에는 **커널을 다시 시작하고 처음부터 모든 셀을 실행**(Restart & Run All)해, 화면의 코드만으로 같은 결과가 나오는지 확인한다. 이 사이트의 과제 작업 공간에서는 "실행 환경 초기화" 후 "전체 실행"이 같은 일을 한다. 같은 셀을 여러 번 실행해도 결과가 같도록, 이전 결과를 덮어쓰는 \`data = data * 2\` 대신 \`scaled = data * 2\`처럼 새 이름에 대입한다.

### 난수와 시드

데이터 섞기, 학습·평가 분할, 가중치 초기화, 드롭아웃에는 난수를 쓴다. 컴퓨터의 난수는 **시드(seed)**라는 시작값에서 정해진 규칙으로 만드는 수열(의사 난수)이라서, 시드가 같으면 항상 같은 수열이 나온다. 결과를 다시 얻으려면 시드를 고정한다.

- 표준 라이브러리: \`rng = random.Random(42)\`로 시드를 가진 생성기를 만들어 쓴다. \`random.seed(42)\`는 프로그램 전체가 함께 쓰는 생성기를 바꾸므로, 다른 코드가 중간에 난수를 쓰면 순서가 달라진다.
- NumPy: \`rng = np.random.default_rng(42)\`로 생성기를 만들어 \`rng.normal(...)\`, \`rng.permutation(...)\`을 쓴다([[lesson:vectorization]]).
- 라이브러리마다 생성기가 따로 있다. PyTorch는 \`torch.manual_seed(42)\`를 따로 정한다.

\`\`\`python
import random

a = random.Random(42)
b = random.Random(42)
print([round(a.random(), 4) for _ in range(3)])
print([round(b.random(), 4) for _ in range(3)])   # 시드가 같으면 같은 수열

items = list(range(10))
for seed in (0, 0, 1):
    shuffled = list(items)            # 원본을 바꾸지 않도록 복사한 뒤 섞는다
    random.Random(seed).shuffle(shuffled)
    print(seed, shuffled[:8], shuffled[8:])   # 같은 시드는 같은 분할, 다른 시드는 다른 분할
\`\`\`

시드를 고정하는 목적은 같은 결과를 **다시 얻는 것**이지, 좋은 결과를 고르는 것이 아니다. 여러 시드로 실행해 가장 좋은 결과 하나만 보고하면 성능을 실제보다 높게 말하게 된다. 결과가 시드에 따라 얼마나 흔들리는지는 여러 시드의 평균과 표준편차로 보고한다.

\`\`\`python
import numpy as np

def run_experiment(seed):
    """잡음이 있는 데이터를 만들고, x > 0이면 1로 예측하는 규칙의 평가 정확도를 잰다."""
    rng = np.random.default_rng(seed)
    x = rng.normal(0, 1, 200)
    y = (x + rng.normal(0, 1, 200) > 0).astype(int)
    test = rng.permutation(200)[150:]          # 무작위로 고른 50개로 평가
    return float(np.mean((x[test] > 0).astype(int) == y[test]))

accs = [run_experiment(s) for s in range(5)]
print([round(a, 2) for a in accs])
print(f"정확도 {np.mean(accs):.3f} ± {np.std(accs):.3f} (시드 5개)")
\`\`\`

같은 방법인데도 시드에 따라 정확도가 0.72에서 0.86까지 달라진다. 시드 하나의 결과로 두 방법을 비교하면, 차이가 방법 때문인지 시드 때문인지 구분할 수 없다.

### 환경과 데이터 기록

같은 코드와 시드라도 라이브러리 버전이나 데이터가 다르면 결과가 달라진다. 결과와 함께 다음을 기록한다.

| 기록할 것 | 방법 |
| --- | --- |
| 코드 버전 | Git 커밋 해시([[lesson:git-basics]]) |
| 패키지와 파이썬 버전 | \`requirements.txt\`, \`sys.version\`, \`패키지.__version__\`([[lesson:modules-environments]]) |
| 데이터 버전 | 파일 내용의 해시 값(같은 데이터인지 확인) |
| 설정과 시드 | 하이퍼파라미터와 시드를 결과 파일에 함께 저장 |

파일의 **해시 값**은 파일 내용에서 계산한 고정 길이의 문자열로, 내용이 한 글자만 달라도 완전히 다른 값이 된다. 데이터 파일 자체를 저장소에 넣지 않더라도 해시 값을 기록해 두면, 나중에 같은 데이터로 실행했는지 확인할 수 있다.

\`\`\`python
import hashlib, json, sys

with open("tiny.csv", "w", encoding="utf-8") as f:
    f.write("a,b\n1,2\n")

def file_hash(path):
    with open(path, "rb") as f:                 # 바이트로 읽는다
        return hashlib.sha256(f.read()).hexdigest()[:12]

record = {
    "python": sys.version.split()[0],
    "numpy": np.__version__,
    "data_sha256": file_hash("tiny.csv"),
    "seed": 42,
    "accuracy_mean": round(float(np.mean(accs)), 3),
}
print(json.dumps(record, ensure_ascii=False, indent=2))
\`\`\`

경로는 내 컴퓨터에서만 존재하는 절대 경로(\`C:/Users/me/Downloads/data.csv\`) 대신 프로젝트 폴더를 기준으로 한 상대 경로(\`data/data.csv\`)로 쓴다.

### 이 사이트와 Colab

| | 이 사이트의 코드 셀 | Google Colab |
| --- | --- | --- |
| 실행 위치 | 내 브라우저(Pyodide) | 클라우드 서버 |
| 패키지 | NumPy, pandas, scikit-learn, matplotlib 등 Pyodide가 지원하는 것 | \`pip install\`로 대부분 설치 가능(PyTorch 포함) |
| GPU | 없음 | 무료 GPU를 쓸 수 있다(사용 시간 제한) |
| 알맞은 일 | 레슨 예제, 실습, 과제(작은 데이터) | 큰 모델 학습, PyTorch 코드, 오래 걸리는 실험 |

두 환경 모두 처음부터 다시 실행해 같은 결과가 나오는지 확인하는 원칙은 같다.

:::warn 흔한 실수
- **셀을 위아래로 오가며 실행한 결과를 그대로 공유한다.** 다시 시작하고 처음부터 실행해 확인한다.
- **이전 결과를 덮어쓰는 셀을 여러 번 실행한다.** \`x = x * 2\` 대신 새 이름에 대입한다.
- **시드를 바꿔 가며 가장 좋은 결과만 보고한다.** 여러 시드의 평균과 표준편차를 보고한다.
- **절대 경로를 쓴다.** 다른 컴퓨터에서 \`FileNotFoundError\`가 난다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "셀 A에서 `threshold = 0.5`를 정의했고 셀 B에서 이를 쓴다. 셀 A를 지운 뒤에도 셀 B는 잘 실행되었다. 노트북을 다시 열어 처음부터 실행하면?",
      choices: [
        "셀 B도 그대로 잘 실행된다",
        "셀 B에서 `NameError`가 난다",
        "`threshold`가 자동으로 0이 된다",
        "셀 A가 자동으로 복구된다",
      ],
      answer: 1,
      explanation: "지운 셀의 변수는 그 커널이 살아 있는 동안만 남아 있다. 커널을 새로 시작하면 `threshold`를 정의하는 코드가 없으므로 `NameError`가 난다.",
    },
    {
      key: "c2",
      question: "`random.Random(42)`로 만든 생성기 두 개에서 각각 `random()`을 세 번씩 호출하면?",
      choices: ["두 수열이 같다", "두 수열이 다르다", "첫 번째 값만 같다", "오류가 난다"],
      answer: 0,
      explanation: "의사 난수 생성기는 시드에서 정해진 규칙으로 수를 만든다. 시드가 같으면 수열 전체가 같다.",
    },
    {
      key: "c3",
      question: "두 모델 중 어느 쪽이 나은지 판단하려고 한다. 결과를 보고하는 방법으로 가장 알맞은 것은?",
      choices: [
        "시드를 바꿔 가며 실행해 가장 좋은 결과 하나를 보고한다",
        "여러 시드로 실행해 각 모델의 평균과 표준편차를 함께 보고한다",
        "시드를 고정하지 않고 한 번 실행한 결과를 보고한다",
        "평가 데이터를 바꿔 가며 가장 좋은 결과를 보고한다",
      ],
      answer: 1,
      explanation: "결과는 시드에 따라 흔들린다. 평균과 표준편차를 함께 보아야 차이가 모델 때문인지 무작위성 때문인지 판단할 수 있다. 가장 좋은 값만 고르면 성능을 부풀린다.",
    },
    {
      key: "c4",
      question: "데이터 파일의 SHA-256 해시 값을 결과와 함께 기록하는 이유는?",
      choices: [
        "파일을 암호화해 다른 사람이 읽지 못하게 하려고",
        "나중에 같은 내용의 데이터로 실행했는지 확인하려고",
        "파일 크기를 줄이려고",
        "파일을 더 빨리 읽으려고",
      ],
      answer: 1,
      explanation: "해시 값은 내용이 조금만 달라도 완전히 달라진다. 기록해 둔 값과 지금 데이터의 해시 값이 같으면 같은 데이터라는 것을 확인할 수 있다.",
    },
    {
      key: "c5",
      question: "PyTorch로 신경망을 학습하는 코드를 GPU에서 실행하려고 한다. 알맞은 실행 환경은?",
      choices: [
        "이 사이트의 코드 셀",
        "Google Colab(GPU 런타임)",
        "브라우저 개발자 도구 콘솔",
        "GPU는 파이썬에서 쓸 수 없다",
      ],
      answer: 1,
      explanation: "이 사이트의 코드 셀은 브라우저 안의 Pyodide에서 실행되어 GPU가 없고 PyTorch를 지원하지 않는다. Colab은 PyTorch를 설치해 GPU로 실행할 수 있다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import random
a = random.Random(42)
b = random.Random(42)
x = [a.random() for _ in range(3)]
y = [b.random() for _ in range(3)]
print(x == y, round(x[0], 4))
`,
      expected: "True 0.6394",
      explanation: "시드가 같은 두 생성기는 같은 수열을 만든다. 시드 42의 첫 번째 값은 0.6394…로, 어느 컴퓨터에서 실행해도 같다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "내 컴퓨터에서 잘 돌던 노트북을 동료가 실행했더니 숫자가 다르게 나오거나 오류가 났다. 원인이 될 수 있는 것을 세 가지 들고, 각각을 막는 방법을 설명하라.",
      answer: md`
첫째, 라이브러리 버전 차이다. 같은 함수도 버전에 따라 기본값이나 동작이 다르므로, 프로젝트마다 가상환경을 만들고 \`requirements.txt\`로 버전을 고정해 공유한다. 둘째, 난수다. 데이터 섞기·초기화에 난수를 쓰면 실행마다 결과가 달라지므로 \`np.random.default_rng(42)\`처럼 시드를 고정한다. 셋째, 노트북의 실행 순서와 숨은 상태다. 셀을 오가며 실행하면 화면에 없는 변수 상태에 의존하게 되므로, 공유 전에 커널을 다시 시작하고 처음부터 모두 실행해 확인한다. 그 밖에 절대 경로나 다른 데이터 파일도 원인이 되므로 상대 경로를 쓰고 데이터의 해시 값을 기록하며, 코드는 Git 커밋으로 버전을 남긴다.
`,
      keyPoints: ["라이브러리 버전 → 가상환경과 requirements.txt", "난수 → 시드 고정", "실행 순서·숨은 상태 → 다시 시작 후 처음부터 실행", "경로·데이터 차이 → 상대 경로, 데이터 해시, Git 커밋"],
    },
  ],
  references: [
    { title: "Google Colab 소개", url: "https://colab.research.google.com/notebooks/intro.ipynb", note: "셀 실행, GPU 런타임 설정" },
    { title: "NumPy — Random Generator", url: "https://numpy.org/doc/stable/reference/random/generator.html", note: "default_rng로 시드를 가진 생성기 만들기 (영문)" },
    { title: "Python 표준 라이브러리 — hashlib (한국어)", url: "https://docs.python.org/ko/3/library/hashlib.html", note: "SHA-256 해시 계산" },
  ],
});
