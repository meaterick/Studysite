import { defineLesson, md } from "../../kit";

export default defineLesson({
  id: "modules-environments",
  title: "모듈, 패키지, 가상환경, 의존성",
  tier: "core",
  concepts: ["modules-environments"],
  goal: "모듈·패키지·가상환경, Jupyter·Colab, Git의 add·commit·push 흐름이 각각 어떤 문제를 해결하는지 설명할 수 있다.",
  why: "",
  body: md`
이 사이트에서는 아무것도 설치하지 않고 브라우저 안에서 파이썬을 실행한다. 하지만 캡스톤 프로젝트나 실무에서는 자기 컴퓨터나 Google Colab에서 작업하게 되고, 그때는 "필요한 라이브러리를 어떻게 설치하고, 코드를 어디서 실행하며, 바뀐 내용을 어떻게 기록·공유하는가"를 스스로 해결해야 한다. 이 단계는 그 세 가지 도구를 정리한다.

### 모듈·패키지·가상환경(venv)

모듈(module)은 재사용 가능한 코드를 담은 파이썬 파일 하나이고, 패키지(package)는 그런 모듈들을 모아놓은 묶음이다(\`import numpy\`가 바로 numpy라는 패키지를 불러오는 것이다). pip은 이런 패키지를 설치하는 도구이고, 가상환경(virtual environment, venv)은 프로젝트마다 독립된 패키지 설치 공간을 만들어, 프로젝트 A가 필요한 라이브러리 버전과 프로젝트 B가 필요한 버전이 서로 충돌하지 않도록 격리해준다.

\`\`\`bash
python -m venv .venv          # 가상환경 생성
source .venv/bin/activate     # 활성화 (Windows는 .venv\Scripts\activate)
pip install numpy pandas matplotlib
\`\`\`

[[diagram:venv-isolation]]

### Jupyter Notebook과 Google Colab

Jupyter Notebook은 코드를 "셀" 단위로 나눠 하나씩 실행하고 결과를 바로 확인할 수 있는 대화형 개발 환경이다. Google Colab은 이 Jupyter Notebook을 구글 클라우드에서 무료로 제공하는 서비스로, 별도 설치 없이 브라우저만으로 실행할 수 있고 무료 GPU까지 쓸 수 있다. 이번 스터디의 모든 실습 코드는 Colab에서 바로 실행되도록 작성되어 있다. 지금 이 페이지의 파이썬 코드 블록을 그대로 복사해 Colab 셀에 붙여넣으면 된다.

### Git·GitHub 기초

Git은 코드의 변경 이력을 시간순으로 저장해두는 버전관리 시스템이고, GitHub은 그 Git 저장소를 온라인에 올려 다른 사람과 함께 작업할 수 있게 해주는 서비스다. 지금 당장 전부 외울 필요는 없지만, 아래 명령어들은 앞으로 과제를 제출하거나 협업할 때 계속 쓰게 된다.

| 명령 | 의미 |
| --- | --- |
| \`git init\` | 현재 폴더를 Git 저장소로 초기화 |
| \`git add <file>\` | 변경사항을 커밋 대상으로 등록(스테이징) |
| \`git commit -m "메시지"\` | 스테이징된 변경사항을 하나의 기록으로 저장 |
| \`git push\` | 로컬의 커밋을 원격 저장소(GitHub)로 올리기 |
| \`git pull\` | 원격 저장소의 변경사항을 로컬로 받아오기 |
| \`git clone <url>\` | 원격 저장소를 통째로 복제해오기 |
| \`git status\` | 지금 무엇이 바뀌었는지 확인 |

### 하루 작업의 흐름

세 도구를 합치면 하루 작업은 대개 이렇게 흘러간다. ① \`git clone\`(처음 한 번) 또는 \`git pull\`로 최신 코드를 받는다. ② 가상환경을 활성화하고 필요한 패키지를 \`pip install\`한다. ③ Jupyter나 Colab에서 실험하며 코드를 고친다. ④ 의미 있는 단위로 \`git add\` → \`git commit -m "무엇을 왜 바꿨는지"\` → \`git push\`. 커밋 메시지에 "무엇을 왜"를 적어 두면, 몇 주 뒤 "그때 왜 학습률을 바꿨더라?"라는 질문에 기억이 아니라 기록으로 답할 수 있다(8주차 실험 추적과 같은 생각이다).

[[diagram:git-flow]]

### 올리면 안 되는 것과 환경을 공유하는 법

Git에 한 번 올라간 파일은 지워도 기록에 남는다. 그래서 처음부터 올리지 않을 파일을 \`.gitignore\`에 적어 둔다. 대표적인 것이 API 키·비밀번호를 담은 \`.env\` 파일, 가상환경 폴더 \`.venv/\`, 용량이 큰 데이터와 모델 파일이다. 특히 API 키가 공개 저장소에 올라가면 몇 분 안에 자동 수집되어 악용될 수 있다. 실수로 올렸다면 파일을 지우는 것으로는 부족하고, 키 자체를 즉시 폐기하고 새로 발급받아야 한다.

다른 사람이 내 코드를 같은 환경에서 실행하려면 필요한 패키지와 버전 목록을 함께 공유한다. 관례적으로 \`requirements.txt\`라는 파일에 적는다.

\`\`\`bash
echo ".env" >> .gitignore            # 비밀값 파일은 Git이 무시하게
echo ".venv/" >> .gitignore          # 가상환경 폴더도 올리지 않는다
pip freeze > requirements.txt        # 지금 환경의 패키지와 버전을 파일로 저장
pip install -r requirements.txt      # (다른 컴퓨터에서) 같은 패키지를 한 번에 설치
\`\`\`
`,
  checks: [
    {
      key: "c1",
      question: "프로젝트 A와 B가 서로 다른 버전의 라이브러리를 필요로 할 때 충돌을 막아주는 도구는?",
      choices: ["Git", "가상환경(venv)", "Jupyter Notebook", "Matplotlib"],
      answer: 1,
      explanation: "가상환경은 프로젝트마다 독립된 패키지 설치 공간을 만든다. Git은 코드 변경 이력 관리, Jupyter는 셀 단위 대화형 실행 환경이다.",
    },
    {
      key: "c2",
      question: "작업한 내용을 GitHub 원격 저장소에 올리기까지의 올바른 순서는?",
      choices: ["`git add` → `git commit` → `git push`", "`git push` → `git add` → `git commit`", "`git commit` → `git push` → `git add`", "`git clone` → `git push` → `git add`"],
      answer: 0,
      explanation: "`add`로 기록할 변경을 고르고(스테이징), `commit`으로 하나의 기록으로 저장한 뒤, `push`로 원격 저장소에 올린다.",
    },
    {
      key: "c3",
      question: "이 사이트의 브라우저 실행 환경보다 Google Colab을 쓰는 편이 나은 경우는?",
      choices: ["GPU가 필요하거나 그래프를 화면에 그려 보고 싶을 때", "짧은 코드 셀 하나를 바로 실행해 볼 때", "설치 없이 파이썬을 써 보고 싶을 때", "NumPy 배열 연산을 연습할 때"],
      answer: 0,
      explanation: "이 사이트의 코드는 브라우저(Pyodide) 안에서 화면 없이 실행되고 GPU를 쓰지 않는다. 큰 모델 학습이나 그래프 시각화는 Colab이 적합하다.",
    },
    {
      key: "c4",
      question: "Git 저장소에 **올리지 말고** `.gitignore`에 넣어야 하는 것으로 가장 알맞은 것은?",
      choices: ["API 키가 들어 있는 `.env` 파일", "`requirements.txt`", "분석 코드가 담긴 `.py` 파일", "프로젝트 설명 `README.md`"],
      answer: 0,
      explanation: "비밀값은 공개되면 즉시 악용될 수 있고, 한 번 올라가면 기록에 남는다. `requirements.txt`와 코드, README는 공유해야 하는 파일이다.",
    },
    {
      key: "c5",
      question: "`pip install -r requirements.txt`가 하는 일은?",
      choices: ["파일에 적힌 패키지(와 버전)를 한 번에 설치한다", "설치된 패키지를 모두 지운다", "가상환경을 새로 만든다", "코드를 GitHub에 올린다"],
      answer: 0,
      explanation: "`pip freeze > requirements.txt`로 저장해 둔 목록을 다른 컴퓨터에서 그대로 설치해, 같은 환경에서 코드를 재현할 수 있게 한다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "가상환경(venv)이 해결하는 문제는 무엇인가? `git add`·`git commit`·`git push`가 각각 무엇을 하는지 순서대로 설명하라.",
      answer: md`
가상환경은 프로젝트마다 독립된 패키지 설치 공간을 만들어, 한 프로젝트가 요구하는 라이브러리 버전이 다른 프로젝트나 시스템 Python과 충돌하는 문제를 막고 \`requirements.txt\`로 같은 환경을 재현하게 해 준다. \`git add\`는 변경한 파일 중 이번 기록에 넣을 것을 스테이징 영역에 올리고, \`git commit\`은 스테이징된 변경을 메시지와 함께 로컬 저장소의 이력으로 확정하며, \`git push\`는 로컬 커밋을 GitHub 같은 원격 저장소로 올려 공유·백업한다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "내 컴퓨터에서 잘 돌던 노트북을 동료가 실행했더니 숫자가 다르게 나오거나 오류가 났습니다. 원인이 될 수 있는 것을 세 가지 들고, 각각을 막는 방법을 이번 주에 배운 도구로 설명하십시오.",
      answer: md`
첫째, 라이브러리 버전 차이입니다. 같은 함수도 버전에 따라 기본값이나 동작이 다르므로, 프로젝트마다 가상환경(venv)을 만들고 \`pip freeze > requirements.txt\`로 버전을 고정해 함께 공유합니다. 둘째, 난수입니다. 데이터 생성·초기화·섞기에 난수를 쓰면 실행마다 결과가 달라지므로 \`np.random.default_rng(42)\`처럼 시드를 고정합니다. 셋째, Jupyter의 실행 순서입니다. 셀을 위아래로 오가며 실행하면 화면에 없는 변수 상태에 의존하게 되므로, 공유 전에 커널을 재시작하고 처음부터 모두 실행(Restart & Run All)해 확인합니다. 코드는 Git으로 커밋해 어떤 버전으로 실행했는지 남깁니다.
`,
      keyPoints: ["라이브러리 버전 → venv와 requirements.txt로 고정", "난수 → 시드 고정", "Jupyter 셀 실행 순서·숨은 상태 → 재시작 후 처음부터 실행", "Git으로 코드 버전 기록(데이터 경로 등 환경 차이도 인정)"],
    },
  ],
  references: [
    { title: "Pro Git (한국어판)", url: "https://git-scm.com/book/ko/v2", note: "2장 Git의 기초만 읽어도 과제 제출에 충분" },
    { title: "Python 문서 — venv: 가상 환경 만들기", url: "https://docs.python.org/ko/3/library/venv.html", note: "가상환경 생성·활성화 방법" },
    { title: "Google Colab 소개", url: "https://colab.research.google.com/notebooks/intro.ipynb", note: "셀 실행, GPU 런타임 설정" },
  ],
});
