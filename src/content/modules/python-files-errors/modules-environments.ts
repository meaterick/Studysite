import { defineLesson, md, py } from "../../kit";
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

**모듈(module)**은 함수·클래스·변수를 담은 파이썬 파일(\`.py\`) 하나다. 다른 파일의 코드를 쓰려면 \`import\`로 불러온다. 불러오는 방법은 세 가지다.

| 형식 | 쓰는 법 | 특징 |
| --- | --- | --- |
| \`import math\` | \`math.sqrt(2)\` | 어느 모듈의 이름인지 코드에 드러난다 |
| \`import numpy as np\` | \`np.mean(x)\` | 긴 이름을 짧게 쓴다. \`np\`, \`pd\`, \`plt\`는 관례적인 별칭이다 |
| \`from math import sqrt\` | \`sqrt(2)\` | 이름을 직접 가져온다. 같은 이름이 겹치지 않게 주의한다 |

\`from 모듈 import *\`는 모듈의 이름을 모두 가져와 어떤 이름이 어디서 왔는지 알 수 없게 하므로 쓰지 않는다.

\`\`\`python
import math
import statistics as st
from collections import Counter

print(math.sqrt(16), math.log(math.e))           # 4.0 1.0
print(st.mean([2, 4, 9]), st.median([2, 4, 9]))  # 5 4
print(Counter("banana").most_common(1))          # [('a', 3)]
\`\`\`

모듈은 처음 import할 때 한 번만 실행되고, 그 뒤의 import는 이미 불러온 모듈을 다시 쓴다.

### 표준 라이브러리와 외부 패키지

파이썬을 설치하면 함께 오는 모듈 묶음을 **표준 라이브러리**라고 한다. \`math\`, \`random\`, \`statistics\`, \`json\`, \`csv\`, \`pathlib\`, \`collections\`, \`time\`이 여기에 속한다. 그 밖의 라이브러리는 **패키지(package)**로 배포되며, 파이썬 패키지 저장소(PyPI)에서 \`pip\`으로 설치한다. 패키지는 여러 모듈을 폴더 하나에 묶은 것이다.

이 사이트의 코드 셀은 Pyodide라는 브라우저용 파이썬에서 실행된다. NumPy, pandas, scikit-learn, matplotlib는 \`import\`하면 자동으로 내려받아 쓸 수 있지만, PyTorch처럼 Pyodide에서 지원하지 않는 패키지는 쓸 수 없다. 그런 코드는 "Colab 등 외부 환경에서 실행"으로 표시하고 실행 버튼을 두지 않는다.

### 내 모듈 만들기

자주 쓰는 함수를 \`.py\` 파일에 모아 두면 여러 노트북·스크립트에서 import해 쓸 수 있다. 파이썬은 모듈을 찾을 때 **실행 중인 폴더를 먼저** 보고, 그다음 설치된 패키지를 본다(\`sys.path\`의 순서). 그래서 내 파일 이름을 \`random.py\`나 \`numpy.py\`처럼 라이브러리와 같게 지으면, 라이브러리 대신 내 파일이 불려 와 \`AttributeError\`가 난다.

\`\`\`python
import importlib, sys
from pathlib import Path

Path("mytools.py").write_text(
    'def clip(x, lo, hi):\n    """x를 [lo, hi] 범위로 자른다"""\n    return max(lo, min(x, hi))\n',
    encoding="utf-8",
)
sys.path.insert(0, ".")          # 현재 폴더를 모듈 검색 경로 맨 앞에 둔다
importlib.invalidate_caches()    # 방금 만든 파일을 찾도록 검색 정보를 새로 고친다
import mytools
print(mytools.clip(1.7, 0, 1), mytools.clip.__doc__)
\`\`\`

모듈 파일 안에 \`if __name__ == "__main__":\` 블록을 두면, 그 파일을 직접 실행할 때만 블록이 실행되고 다른 파일에서 import할 때는 실행되지 않는다. 함수 정의와 시험 실행 코드를 한 파일에 두는 관례다.

### pip과 버전

\`pip install 패키지\`는 PyPI에서 패키지를 내려받아 설치한다. \`pip install 패키지==버전\`으로 버전을 지정할 수 있다. 버전 번호는 보통 \`주.부.수\`(예: \`2.1.3\`) 형식이고, 주 번호가 바뀌면 이전 코드가 동작하지 않는 변경이 있을 수 있다. 설치된 패키지와 버전은 \`pip list\`로, 코드 안에서는 \`패키지.__version__\`으로 확인한다.

\`\`\`python
import sys
import numpy as np

print(sys.version.split()[0])    # 파이썬 버전
print(np.__version__)            # NumPy 버전
\`\`\`

### 가상환경

모든 프로젝트가 컴퓨터 한 곳에 패키지를 설치하면, 프로젝트 A가 pandas 1.x를, 프로젝트 B가 pandas 2.x를 필요로 할 때 둘을 함께 쓸 수 없다. **가상환경(virtual environment)**은 프로젝트마다 독립된 패키지 설치 폴더를 만들어 이 충돌을 막는다.

[[diagram:venv-isolation]]

\`\`\`bash
python -m venv .venv            # 프로젝트 폴더에 가상환경 만들기
source .venv/bin/activate       # 켜기(Windows: .venv\Scripts\activate)
python -m pip install numpy pandas scikit-learn
deactivate                      # 끄기
\`\`\`

가상환경을 켜면 \`python\`과 \`pip\`이 그 가상환경의 것으로 바뀐다. 설치는 \`pip\` 대신 \`python -m pip\`으로 하면, 지금 쓰는 파이썬에 설치된다는 것이 보장된다. 설치했는데 \`ModuleNotFoundError\`가 나면 대개 다른 파이썬(가상환경을 켜지 않은 상태)에 설치한 것이다. 가상환경 관리 도구로는 \`venv\` 외에 conda, uv 등이 있으며 원리는 같다.

### 의존성 기록과 재설치

프로젝트가 쓰는 패키지와 버전을 **의존성(dependency)**이라고 한다. 다른 사람(또는 몇 달 뒤의 나)이 같은 환경을 만들 수 있도록 \`requirements.txt\`에 적어 둔다. 한 줄에 \`패키지==버전\`을 하나씩 쓰고, \`#\` 뒤는 주석이다.

\`\`\`bash
pip freeze > requirements.txt        # 지금 환경의 패키지와 버전을 저장
pip install -r requirements.txt      # 다른 컴퓨터에서 같은 버전을 설치
\`\`\`

\`pip freeze\`는 직접 설치한 패키지뿐 아니라 그 패키지가 필요로 하는 패키지까지 모두 적는다. 직접 쓰는 패키지만 손으로 적고 버전을 고정하는 방법도 많이 쓴다. 파이썬 버전도 결과에 영향을 줄 수 있으므로 README 등에 함께 적는다. 가상환경 폴더(\`.venv/\`) 자체는 공유하지 않는다. 운영체제마다 내용이 달라 다른 컴퓨터에서 그대로 쓸 수 없기 때문이다. \`requirements.txt\`만 공유하고, 각자 가상환경을 새로 만든다([[lesson:git-basics]]의 \`.gitignore\`).

:::warn 흔한 실수
- **설치했는데 \`ModuleNotFoundError\`가 난다.** 가상환경을 켜지 않았거나 다른 파이썬에 설치했다. \`python -m pip install\`로 설치한다.
- **파일 이름을 라이브러리와 같게 짓는다.** \`random.py\`를 만들면 표준 라이브러리 \`random\` 대신 내 파일이 불려 온다.
- **\`from 모듈 import *\`를 쓴다.** 이름이 어디서 왔는지 알 수 없고 기존 이름을 덮어쓴다.
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
        "random 모듈은 표준 라이브러리가 아니어서 설치가 필요하다",
        "모듈 검색이 작업 폴더부터 시작해 표준 라이브러리 대신 내 `random.py`가 불려 왔다",
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
        "pandas의 철자",
        "노트북이 쓰는 파이썬(가상환경)과 pip이 설치한 파이썬이 같은지",
        "인터넷 속도",
        "파일의 인코딩",
      ],
      answer: 1,
      explanation: "pip이 다른 파이썬에 설치했다면 지금 실행 중인 파이썬은 pandas를 찾지 못한다. 가상환경을 켜고 `python -m pip install pandas`로 설치한다.",
    },
    {
      key: "c5",
      question: "`pip install -r requirements.txt`가 하는 일은?",
      choices: ["파일에 적힌 패키지(와 버전)를 한 번에 설치한다", "설치된 패키지를 모두 지운다", "가상환경을 새로 만든다", "코드를 원격 저장소에 올린다"],
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
