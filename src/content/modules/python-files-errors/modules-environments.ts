import { defineLesson, md } from "../../kit";
import exercises from "./labs/modules-environments";

export default defineLesson({
  id: "modules-environments",
  title: "모듈, 패키지, 가상환경, 의존성",
  tier: "core",
  concepts: ["modules-environments"],
  goal: "import로 모듈과 패키지를 불러오는 규칙을 설명하고, 가상환경과 requirements.txt로 프로젝트의 의존성을 격리·기록·재설치한다.",
  why: "NumPy, pandas, scikit-learn, PyTorch는 모두 패키지로 설치해 import해 쓴다. 패키지 버전이 다르면 같은 코드도 다른 결과를 내거나 실행되지 않으므로, 의존성을 기록해 두어야 실험을 다른 컴퓨터에서 재현할 수 있다([[lesson:notebooks-reproducibility]]).",
  body: md`
### 모듈과 import

**모듈(module)**은 함수·클래스·변수를 담은 파이썬 파일(\`.py\`) 하나다. 다른 파일에 정의된 코드를 가져다 쓰려면 \`import\`로 불러온다. 덕분에 제곱근, 통계, 날짜 계산처럼 많은 사람이 쓰는 기능을 직접 만들지 않고 가져다 쓸 수 있다. 불러오는 방법은 세 가지다.

| 형식 | 쓰는 법 | 특징 |
| --- | --- | --- |
| \`import math\` | \`math.sqrt(2)\` | 어느 모듈의 이름인지 코드에 드러난다 |
| \`import numpy as np\` | \`np.mean(x)\` | 긴 이름을 짧게 쓴다. \`np\`, \`pd\`, \`plt\`는 관례적인 별칭이다 |
| \`from math import sqrt\` | \`sqrt(2)\` | 이름을 직접 가져온다. 같은 이름이 겹치지 않게 주의한다 |

\`import math\`를 실행하면 이름 \`math\`가 모듈 객체를 가리키게 된다. 모듈 안의 함수와 값은 \`모듈.이름\` 형식으로 꺼낸다. \`math.pi\`는 원주율 값이고, \`math.sqrt\`는 제곱근 함수다.

\`\`\`python
import math
import statistics as st
from collections import Counter

print(type(math).__name__)                       # module
print(math.sqrt(16), math.log(math.e))           # 4.0 1.0
print(math.pi)                                   # 3.141592653589793
print(math.floor(3.7), math.ceil(3.2))           # 3 4
print(st.mean([2, 4, 9]), st.median([2, 4, 9]))  # 5 4
print(Counter("banana").most_common(1))          # [('a', 3)]
\`\`\`

\`math.floor\`는 내림, \`math.ceil\`은 올림이다. \`statistics\`를 \`st\`라는 별칭으로 불러왔으므로 \`st.mean\`으로 쓴다. \`Counter\`는 원소마다 개수를 세어 주는 딕셔너리이고, \`most_common(1)\`은 가장 많이 나온 원소와 개수를 돌려준다.

\`from 모듈 import *\`는 모듈의 이름을 모두 가져와 어떤 이름이 어디서 왔는지 알 수 없게 하고, 이미 있는 같은 이름을 덮어쓰므로 쓰지 않는다. 모듈은 처음 import할 때 한 번만 실행되고, 그 뒤의 import는 이미 불러온 모듈을 다시 쓴다.

### 표준 라이브러리와 외부 패키지

파이썬을 설치하면 함께 오는 모듈 묶음을 **표준 라이브러리**라고 한다. 따로 설치하지 않고 바로 import할 수 있다.

| 모듈 | 하는 일 |
| --- | --- |
| \`math\`, \`statistics\` | 수학 함수, 평균·중앙값 같은 통계 |
| \`random\` | 난수, 무작위 선택과 섞기 |
| \`json\`, \`csv\`, \`pathlib\` | 파일 형식 읽고 쓰기, 경로 다루기([[lesson:file-io]]) |
| \`collections\` | \`Counter\` 등 추가 자료구조 |
| \`datetime\`, \`time\` | 날짜와 시간 |

\`\`\`python
import random
from datetime import date

rng = random.Random(42)                       # 시드 42로 만든 난수 생성기
print(rng.randint(1, 6), rng.randint(1, 6))   # 6 1
print(rng.choice(["가위", "바위", "보"]))      # 가위
print((date(2026, 3, 1) - date(2026, 2, 1)).days)   # 28
\`\`\`

\`randint(1, 6)\`은 1 이상 6 이하의 정수를 무작위로 고른다. 시드(seed)를 정해 생성기를 만들면 실행할 때마다 같은 수가 같은 순서로 나온다(시드는 선택 분야 레슨 [[lesson:notebooks-reproducibility]]에서 자세히 다룬다). 날짜끼리 빼면 두 날짜 사이의 기간이 나오고, \`.days\`는 그 일수다.

표준 라이브러리 밖의 라이브러리는 **패키지(package)**로 배포되며, 파이썬 패키지 저장소(PyPI)에서 \`pip\`으로 설치한다. 패키지는 여러 모듈을 폴더 하나에 묶은 것이다. NumPy, pandas, scikit-learn, PyTorch가 모두 패키지다.

이 사이트의 코드 셀은 Pyodide라는 브라우저용 파이썬에서 실행된다. NumPy, pandas, scikit-learn, matplotlib는 \`import\`하면 자동으로 내려받아 쓸 수 있지만, PyTorch처럼 Pyodide에서 지원하지 않는 패키지는 쓸 수 없다. 그런 코드는 "Colab 등 외부 환경에서 실행"으로 표시하고 실행 버튼을 두지 않는다.

### 내 모듈 만들기

자주 쓰는 함수를 \`.py\` 파일에 모아 두면 여러 노트북·스크립트에서 import해 쓸 수 있다. 아래 셀은 \`mytools.py\` 파일을 만들고 import한다. 파일 맨 위의 \`print\`로 모듈이 언제 실행되는지 확인한다.

\`\`\`python
import importlib, sys
from pathlib import Path

Path("mytools.py").write_text(
    'print("mytools 모듈을 실행한다. __name__ =", __name__)\n'
    '\n'
    'def clip(x, lo, hi):\n'
    '    """x를 [lo, hi] 범위로 자른다"""\n'
    '    return max(lo, min(x, hi))\n',
    encoding="utf-8",
)
sys.path.insert(0, ".")          # 현재 폴더를 모듈 검색 경로 맨 앞에 둔다
importlib.invalidate_caches()    # 방금 만든 파일을 찾도록 검색 정보를 새로 고친다
import mytools                   # 처음 import: 모듈 파일을 실행한다
import mytools                   # 두 번째 import: 다시 실행하지 않는다
print(mytools.clip(1.7, 0, 1))   # 1
print(mytools.clip(-3, 0, 1))    # 0
print(mytools.clip.__doc__)      # x를 [lo, hi] 범위로 자른다
print(__name__)                  # __main__
\`\`\`

\`\`\`output
mytools 모듈을 실행한다. __name__ = mytools
1
0
x를 [lo, hi] 범위로 자른다
__main__
\`\`\`

\`import mytools\`를 두 번 썼지만 모듈 안의 \`print\`는 한 번만 실행되었다. 이 셀을 다시 실행해도 모듈은 이미 불러온 상태라 첫 줄이 다시 출력되지 않는다. 파일을 고친 뒤 다시 불러오려면 \`importlib.reload(mytools)\`를 쓴다.

출력에서 \`__name__\`의 값도 확인할 수 있다. 모듈을 import하면 그 모듈의 \`__name__\`은 모듈 이름(\`mytools\`)이고, 직접 실행하는 코드(셀이나 \`python 파일.py\`로 실행한 파일)의 \`__name__\`은 \`"__main__"\`이다. 그래서 모듈 파일 안에 \`if __name__ == "__main__":\` 블록을 두면, 그 파일을 직접 실행할 때만 블록이 실행되고 다른 파일에서 import할 때는 실행되지 않는다. 함수 정의와 시험 실행 코드를 한 파일에 두는 관례다.

\`\`\`text
# mytools.py
def clip(x, lo, hi):
    return max(lo, min(x, hi))

if __name__ == "__main__":       # python mytools.py로 직접 실행할 때만
    print(clip(1.7, 0, 1))       # 시험 실행
\`\`\`

파이썬은 모듈을 찾을 때 **실행 중인 폴더를 먼저** 보고, 그다음 표준 라이브러리와 설치된 패키지를 본다(\`sys.path\`의 순서). 그래서 내 파일 이름을 \`random.py\`나 \`numpy.py\`처럼 라이브러리와 같게 지으면, 라이브러리 대신 내 파일이 불려 와 \`AttributeError\`가 난다. 예를 들어 작업 폴더에 \`random.py\`를 만들고 \`import random; random.randint(1, 6)\`을 실행하면, 내 \`random.py\`에는 \`randint\`가 없으므로 \`AttributeError: module 'random' has no attribute 'randint'\`가 난다.

### pip과 버전

\`pip install 패키지\`는 PyPI에서 패키지를 내려받아 설치한다. \`pip install 패키지==버전\`으로 버전을 지정할 수 있다. 설치된 패키지와 버전은 \`pip list\`로, 코드 안에서는 \`패키지.__version__\`으로 확인한다.

\`\`\`python
import sys
import numpy as np

# 두 줄의 출력은 실행 환경에 따라 다르다
# 파이썬 버전
print(sys.version.split()[0])
# NumPy 버전
print(np.__version__)
\`\`\`

버전 번호는 보통 \`주.부.수\`(예: \`2.1.3\`) 형식이다. 주 번호가 바뀌면 이전 코드가 동작하지 않는 변경이 있을 수 있다. 버전을 문자열 그대로 비교하면 틀린다. 문자열은 앞 글자부터 비교하므로 \`"10.0"\`이 \`"9.0"\`보다 작다고 판단한다([[lesson:conditionals]]). 점으로 나눈 조각을 정수로 바꿔 튜플로 비교하면 앞 번호부터 수로 비교한다.

\`\`\`python
print("2.1.3".split("."))               # ['2', '1', '3']
print("10.0" < "9.0")                   # True
print((10, 0) < (9, 0))                 # False
v = tuple(int(p) for p in "2.1.3".split("."))
print(v, v > (1, 26, 4))                # (2, 1, 3) True
\`\`\`

### 가상환경

모든 프로젝트가 컴퓨터 한 곳에 패키지를 설치하면, 프로젝트 A가 pandas 1.x를, 프로젝트 B가 pandas 2.x를 필요로 할 때 둘을 함께 쓸 수 없다. 한 곳에는 한 버전만 설치되기 때문이다. **가상환경(virtual environment)**은 프로젝트마다 독립된 패키지 설치 폴더를 만들어 이 충돌을 막는다.

[[diagram:venv-isolation]]

가상환경은 내 컴퓨터의 터미널(명령 창)에서 만든다. 이 사이트의 코드 셀에서는 실행되지 않는다.

\`\`\`bash
python -m venv .venv            # 프로젝트 폴더에 가상환경 만들기
source .venv/bin/activate       # 켜기(Windows: .venv\Scripts\activate)
python -m pip install numpy pandas scikit-learn
deactivate                      # 끄기
\`\`\`

| 명령 | 하는 일 |
| --- | --- |
| \`python -m venv .venv\` | 현재 폴더에 \`.venv\`라는 가상환경 폴더를 만든다 |
| \`source .venv/bin/activate\` | 가상환경을 켠다. 터미널 앞에 \`(.venv)\`가 붙는다 |
| \`python -m pip install 패키지\` | 켜져 있는 가상환경에 패키지를 설치한다 |
| \`deactivate\` | 가상환경을 끈다 |

가상환경을 켜면 \`python\`과 \`pip\`이 그 가상환경의 것으로 바뀐다. 설치는 \`pip\` 대신 \`python -m pip\`으로 하면, 지금 쓰는 파이썬에 설치된다는 것이 보장된다. 설치했는데 \`ModuleNotFoundError\`가 나면 대개 다른 파이썬(가상환경을 켜지 않은 상태)에 설치한 것이다. 지금 쓰는 파이썬이 어느 것인지는 \`sys.executable\`(파이썬 실행 파일의 경로)로 확인한다. 가상환경 관리 도구로는 \`venv\` 외에 conda, uv 등이 있으며 원리는 같다.

### 의존성 기록과 재설치

프로젝트가 쓰는 패키지와 버전을 **의존성(dependency)**이라고 한다. 다른 사람(또는 몇 달 뒤의 나)이 같은 환경을 만들 수 있도록 \`requirements.txt\`에 적어 둔다. 한 줄에 \`패키지==버전\`을 하나씩 쓰고, \`#\` 뒤는 주석이다.

\`\`\`text
# requirements.txt
numpy==1.26.4
pandas==2.2.2        # 표 데이터
scikit-learn==1.5.0
\`\`\`

\`\`\`bash
pip freeze > requirements.txt        # 지금 환경의 패키지와 버전을 저장
pip install -r requirements.txt      # 다른 컴퓨터에서 같은 버전을 설치
\`\`\`

첫 줄의 \`>\`는 명령의 출력을 파일에 저장한다는 뜻이다. 가상환경을 새로 만들고 패키지를 설치한 뒤 다른 사람이 같은 환경을 만들게 하기까지의 순서는 다음과 같다.

1. 만들기: \`python -m venv .venv\`
2. 켜기: \`source .venv/bin/activate\`
3. 설치: \`python -m pip install numpy pandas\`
4. 기록: \`pip freeze > requirements.txt\`
5. 다른 컴퓨터에서 다시 설치: 가상환경을 새로 만들고 켠 뒤 \`pip install -r requirements.txt\`

\`pip freeze\`는 직접 설치한 패키지뿐 아니라 그 패키지가 필요로 하는 패키지까지 모두 적는다. 직접 쓰는 패키지만 손으로 적고 버전을 고정하는 방법도 많이 쓴다. 파이썬 버전도 결과에 영향을 줄 수 있으므로 README 등에 함께 적는다. 가상환경 폴더(\`.venv/\`) 자체는 공유하지 않는다. 운영체제마다 내용이 달라 다른 컴퓨터에서 그대로 쓸 수 없기 때문이다. \`requirements.txt\`만 공유하고, 각자 가상환경을 새로 만든다. Git으로 코드를 관리한다면 \`.venv/\`를 \`.gitignore\`에 적어 저장소에서 뺀다([[lesson:git-basics]]).

:::warn 흔한 실수
- **설치했는데 \`ModuleNotFoundError\`가 난다.** 가상환경을 켜지 않았거나 다른 파이썬에 설치했다. \`python -m pip install\`로 설치한다.
- **파일 이름을 라이브러리와 같게 짓는다.** \`random.py\`를 만들면 표준 라이브러리 \`random\` 대신 내 파일이 불려 온다.
- **\`from 모듈 import *\`를 쓴다.** 이름이 어디서 왔는지 알 수 없고 기존 이름을 덮어쓴다.
- **버전을 문자열로 비교한다.** \`"10.0" < "9.0"\`은 \`True\`다. 정수 튜플로 바꿔 비교한다.
- **버전을 기록하지 않는다.** 몇 달 뒤 같은 코드가 다른 결과를 내도 원인을 찾을 수 없다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "프로젝트 A와 B가 서로 다른 버전의 라이브러리를 필요로 할 때 충돌을 막아 주는 도구는?",
      choices: ["Git", "가상환경(venv)", "Jupyter Notebook", "matplotlib"],
      answer: 1,
      explanation: "가상환경은 프로젝트마다 독립된 패키지 설치 공간을 만든다. Git은 코드 변경 이력 관리, Jupyter는 셀 단위 대화형 실행 환경이다.",
    },
    {
      key: "c2",
      question: "`import numpy as np` 다음에 평균을 구하는 올바른 코드는?",
      choices: ["`numpy.mean(x)`", "`np.mean(x)`", "`mean(x)`", "`np(mean, x)`"],
      answer: 1,
      explanation: "`as np`는 모듈에 `np`라는 별칭을 붙인다. 이후에는 `np.이름`으로 모듈의 함수를 쓴다. `numpy`라는 이름은 이 경우 정의되지 않는다.",
    },
    {
      key: "c3",
      question: "작업 폴더에 `random.py`를 만든 뒤 `import random; random.randint(1, 6)`을 실행했더니 `AttributeError`가 났다. 원인은?",
      choices: [
        "random 모듈은 표준 라이브러리가 아니어서 `pip install random`이 필요하다",
        "작업 폴더의 내 `random.py`가 표준 라이브러리 대신 불려 왔다",
        "randint의 인자 순서가 틀렸다",
        "가상환경을 켜지 않았다",
      ],
      answer: 1,
      explanation: "파이썬은 실행 중인 폴더를 먼저 찾는다. 내 `random.py`에는 `randint`가 없으므로 `AttributeError`가 난다. 라이브러리와 같은 이름의 파일을 만들지 않는다.",
    },
    {
      key: "c4",
      question: "`pip install pandas`를 실행했는데 노트북에서 `import pandas`가 `ModuleNotFoundError`를 낸다. 가장 먼저 확인할 것은?",
      choices: [
        "`import pandas`의 철자와 대소문자가 맞는지",
        "pip과 노트북이 같은 파이썬(가상환경)을 쓰는지",
        "pip이 내려받을 때의 인터넷 속도",
        "노트북 파일이 UTF-8로 저장되었는지",
      ],
      answer: 1,
      explanation: "pip이 다른 파이썬에 설치했다면 지금 실행 중인 파이썬은 pandas를 찾지 못한다. 가상환경을 켜고 `python -m pip install pandas`로 설치한다.",
    },
    {
      key: "c5",
      question: "`pip install -r requirements.txt`가 하는 일은?",
      choices: ["파일에 적힌 패키지를 버전대로 한 번에 설치한다", "설치된 패키지를 모두 지우고 처음 상태로 되돌린다", "`requirements.txt`라는 이름의 가상환경을 새로 만든다", "코드를 원격 저장소에 올린다"],
      answer: 0,
      explanation: "`pip freeze > requirements.txt` 등으로 저장해 둔 목록을 다른 컴퓨터에서 그대로 설치해, 같은 환경에서 코드를 실행할 수 있게 한다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "가상환경이 해결하는 문제를 설명하고, 가상환경 폴더(`.venv/`) 대신 `requirements.txt`를 공유하는 이유를 써라.",
      answer: md`
가상환경은 프로젝트마다 독립된 패키지 설치 공간을 만들어, 한 프로젝트가 요구하는 라이브러리 버전이 다른 프로젝트나 시스템 파이썬의 버전과 충돌하지 않게 한다. 가상환경 폴더에는 운영체제와 파이썬 설치 위치에 따라 달라지는 실행 파일과 내려받은 패키지가 들어 있어, 다른 컴퓨터에 그대로 옮기면 동작하지 않고 용량도 크다. 대신 패키지 이름과 버전만 적은 \`requirements.txt\`를 공유하면, 받는 쪽이 자기 컴퓨터에서 가상환경을 새로 만들고 \`pip install -r requirements.txt\`로 같은 버전을 설치할 수 있다.
`,
      keyPoints: ["프로젝트별로 패키지 버전 충돌을 막는다", "가상환경 폴더는 컴퓨터마다 달라 옮겨 쓸 수 없다", "requirements.txt로 같은 버전을 다시 설치한다"],
    },
  ],
  references: [
    { title: "Python 자습서 6장 — 모듈 (한국어)", url: "https://docs.python.org/ko/3/tutorial/modules.html", note: "import 방식, 모듈 검색 경로, 패키지" },
    { title: "Python 자습서 12장 — 가상 환경 및 패키지 (한국어)", url: "https://docs.python.org/ko/3/tutorial/venv.html", note: "venv와 pip, requirements.txt" },
    { title: "Pyodide에서 쓸 수 있는 패키지 목록", url: "https://pyodide.org/en/stable/usage/packages-in-pyodide.html", note: "브라우저 실행 환경에서 import할 수 있는 패키지" },
  ],
});
