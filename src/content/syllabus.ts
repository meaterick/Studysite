export const syllabus = {
  title: "Aegis AI 스터디 「AI 기초부터 활용까지」 8주 커리큘럼",
  designNote:
    "설계 원칙: Stanford CS229/CS231n/CS224n/CS336, MIT 6.S191, Berkeley CS188, CMU 10-601 등 세계 최상위 대학 강의의 구조를 참고하되, \"이해 → 직접 구현 → 설명 → 활용\" 순환으로 재구성했습니다.",
  goalsMd: `
## 1. 스터디 목표 (수료 시 할 수 있는 것)

1. AI/ML/DL/LLM의 수학적·구조적 원리를 백지에 그려가며 설명할 수 있다.
2. 선형회귀·MLP·CNN·Self-Attention을 라이브러리 없이 직접 구현할 수 있다.
3. LLM이 어떻게 학습되고(사전학습→SFT→정렬) 왜 환각을 일으키는지 설명할 수 있다.
4. 프롬프트·RAG·에이전트로 실제 문제를 해결하고, 평가셋으로 성능을 측정할 수 있다.
5. AI의 한계·편향·안전 문제를 비판적으로 논의할 수 있다.

## 2. 학습 구조 한눈에 보기

[[diagram:phase-roadmap]]

[[diagram:difficulty-curve]]
`,
  rhythmMd: `
## 4. 주간 리듬 (학습 사이클)

\`\`\`formula
월: 자료 공개 ─▶ 화~목: 학습 자료 (단계마다 학습 → 확인 문제, 6~8h) + 적용과 복습
─▶ 금: 백지공부 제출 ─▶ 토: 정규 세션(120분) ─▶ 일: 과제 제출(사이트)
─▶ 다음 월: 운영자 채점·피드백 확인 + 다음 주차 시작
\`\`\`

### 사이트에서의 한 주 흐름

주차 페이지는 **개요 → 학습 자료 → 적용과 복습** 세 화면으로 이어집니다.

1. **개요**: 이번 주의 학습 목표, 단계 지도, 함께 보면 좋은 자료를 확인합니다.
2. **학습 자료**: 주차는 여러 단계로 나뉘고, 단계마다 **핵심(초심자)**·**보충(중급자)**·**심화(전문가)** 구분이 있습니다. **핵심 단계만 마치면 그 주의 학습이 완료**됩니다. 보충은 폭을 넓히는 선택 과정이고, 심화는 수식 유도와 최신 기법을 다루는 선택 과정으로 별도의 **심화 달성** 기록이 남습니다. 단계마다 설명을 읽고 객관식 확인 문제를 모두 맞히면 그 단계가 완료됩니다. 순서대로 학습하기를 권장하지만, 끝내지 않은 단계가 있어도 경고만 표시되고 다음 단계로 넘어갈 수 있습니다.
3. **적용과 복습**: 배운 내용을 직접 꺼내 쓰고 적용하는 화면입니다. **필수 활동은 백지공부와 과제** 두 가지이고, 서술형·코딩 실습·추가 퀴즈·복습 노트는 실력을 다지는 추가 활동입니다.
   - **백지공부(필수)**: 핵심 단계를 모두 마친 뒤에 하기를 권장합니다. 자료를 덮고 기억나는 대로 쓴 뒤 제출하면 비교 자료가 공개되고, 칸마다 스스로 점검합니다.
   - **과제(필수)**: 과제 항목도 핵심(필수)·보충·심화(선택)로 나뉘며, 채점은 핵심 항목을 기준으로 합니다. 작업 공간에서 코드를 작성·실행하고 답안을 쓰며, 작성 내용은 자동 저장됩니다. 제출하면 운영자가 채점 기준별 점수와 피드백을 남기거나 재제출을 요청합니다. 막히는 부분은 운영자 채팅으로 질문할 수 있습니다.
   - **복습 노트**: 틀린 문제와 '보완이 필요합니다'로 표시한 답이 모입니다. 정규 세션 전에 한 번 훑어보십시오.

### 정규 세션 120분 구성

| 시간(분) | 내용 | 목적 |
| --- | --- | --- |
| 0~10 | 백지 워밍업(지난주 핵심 5분 쓰기) | 인출 연습 (간격 반복) |
| 10~40 | 핵심 개념 리뷰 + 질문 (스터디원이 번갈아 설명) | 파인만 기법 |
| 40~85 | 페어 실습 (한 명 코딩 / 한 명 설명) | 능동 학습 |
| 85~105 | 토론 (오개념 사냥, 논문 Q&A) | 비판적 사고 |
| 105~120 | Exit Ticket + 과제 안내 | 형성평가 |

## 5. 학습 방법론: 백지공부법

책을 덮고 빈 종이(또는 주차별 "백지공부" 탭)에 **제목 → 핵심 키워드 → 구조도 → 수식/코드 스케치 → 내 말로 설명** 순으로 채웁니다. 막힌 곳이 곧 학습해야 할 곳입니다. 백지공부 탭은 그 주의 핵심 단계를 모두 마치면 열리고, 제출한 뒤에야 비교 자료(키워드·단계 목표)가 공개됩니다. 보면서 쓰면 인출 연습이 되지 않기 때문입니다.
`,
  evaluationMd: `
## 6. 평가 체계 (총 100점)

| 항목 | 비중 | 내용 |
| --- | --- | --- |
| 출석·세션 참여 | 15 | 8회, 무단결석 -3 |
| 백지공부 시트 | 20 | 주 1회 사이트 제출, 루브릭(정확성·구조화·자기언어) |
| 주간 과제 | 35 | W1~W7, 과제 작업 공간에서 코드·답안 작성 후 제출, 운영자가 채점 기준별로 채점 |
| 단계 확인 문제 | 10 | 단계 완료율 기준 (객관식 전부 통과, 서술형 자기평가는 선택) |
| 캡스톤 | 20 | W8 발표 + 재현 가능한 코드·리포트·모델카드 |

수료 기준: 70점 이상 + 캡스톤 제출.
`,
  resourcesMd: `
## 7. 핵심 참고자료 (전체)

### 교재

- Goodfellow, Bengio, Courville. *Deep Learning*: [deeplearningbook.org](https://www.deeplearningbook.org/)
- Zhang et al. *Dive into Deep Learning*: [d2l.ai](https://d2l.ai/) (코드 포함 무료, [한국어판](https://ko.d2l.ai/))
- Prince. *Understanding Deep Learning*: [udlbook.github.io/udlbook](https://udlbook.github.io/udlbook/)
- James et al. *An Introduction to Statistical Learning (ISLP)*, [statlearning.com](https://www.statlearning.com/)
- Deisenroth et al. *Mathematics for Machine Learning*: [mml-book.com](https://mml-book.github.io/)
- Russell & Norvig. *Artificial Intelligence: A Modern Approach* (전체 지형 참고)
- Jurafsky & Martin. *Speech and Language Processing (3판 초안)*: [web.stanford.edu/~jurafsky/slp3](https://web.stanford.edu/~jurafsky/slp3/)
- Chip Huyen. *AI Engineering* (활용 단계)

### 대학 강의

- Stanford [CS229](https://cs229.stanford.edu/) (ML), [CS231n](https://cs231n.stanford.edu/) (Vision), [CS224n](https://web.stanford.edu/class/cs224n/) (NLP), [CS336](https://stanford-cs336.github.io/) (LLM from Scratch)
- MIT 6.S191 Intro to Deep Learning: [introtodeeplearning.com](https://introtodeeplearning.com/)
- Andrej Karpathy, Neural Networks: Zero to Hero: [karpathy.ai/zero-to-hero.html](https://karpathy.ai/zero-to-hero.html)
- 3Blue1Brown: [Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra) / [Neural Networks](https://www.3blue1brown.com/topics/neural-networks) 시리즈

### 필수 논문 (주차별 배정)

- W4 He et al., Deep Residual Learning ([arXiv 1512.03385](https://arxiv.org/abs/1512.03385))
- W5 Vaswani et al., Attention Is All You Need ([arXiv 1706.03762](https://arxiv.org/abs/1706.03762))
- W6 Kaplan et al., Scaling Laws ([2001.08361](https://arxiv.org/abs/2001.08361)); Hoffmann et al., Chinchilla ([2203.15556](https://arxiv.org/abs/2203.15556)); Ouyang et al., InstructGPT ([2203.02155](https://arxiv.org/abs/2203.02155))
- W7 Lewis et al., RAG ([2005.11401](https://arxiv.org/abs/2005.11401)); Yao et al., ReAct ([2210.03629](https://arxiv.org/abs/2210.03629))
- W8 Mitchell et al., Model Cards ([1810.03993](https://arxiv.org/abs/1810.03993))

:::warn 안내
링크·판본은 변동될 수 있으므로 운영자가 학기 시작 전에 재확인합니다. (운영자 가이드 참조)
:::

## 8. 사전 준비물

- 최신 웹 브라우저(Chrome, Edge, Safari 등). 실습과 과제의 Python 코드는 브라우저에서 실행되므로 별도 설치가 필요하지 않습니다.
- (선택) Google 계정: PyTorch 등 일부 참고 코드를 Colab에서 실행해 보고 싶을 때
- Python 기초 문법(변수·함수·리스트)
- 고등학교 수준 미적분·확률 (부족하면 W1에서 보충)
`,
};
