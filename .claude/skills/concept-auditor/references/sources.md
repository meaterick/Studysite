# 참고한 자료와 라이선스

2026-11-24에 조사했다. 이 스킬의 문서는 아래 자료의 **생각**을 참고해 새로 썼으며, 문장을 옮겨 오지 않았다. 예외는 [misconceptions.md](misconceptions.md)의 일부 항목으로, MIT 라이선스 자료를 고쳐 쓰고 라이선스 문구를 붙였다.

## 설치한 스킬

| 스킬 | 위치 | 라이선스 | 이 스킬에서 쓰는 방식 |
| --- | --- | --- | --- |
| [narosemena/master-instructional-design](https://github.com/narosemena/master-instructional-design) | `.claude/skills/master-instructional-design/` | CC BY-NC-ND 4.0 | 원본 그대로 설치. 감사 틀 가운데 인지부하·연습과 전이·피드백 관점과 블룸·Merrill·4C/ID·ZPD 정리를 참조한다. 변경 금지 조건 때문에 내용을 고쳐 쓰지 않고 위치만 가리킨다. |
| `pauljbernard/content`의 learning-pedagogy | `.claude/skills/learning-pedagogy/` | 표시 없음 | 원본 저장소가 공개되어 있지 않아 레지스트리 미러를 그대로 설치했다(`SOURCE.md`). 교수 접근(행동주의·인지주의·구성주의·연결주의)이 내용 유형에 맞는지 묻는 관점만 쓴다. |

## 조사한 스킬과 도구

| 자료 | 라이선스 | 참고한 생각 |
| --- | --- | --- |
| [GarethManning/education-agent-skills](https://github.com/GarethManning/education-agent-skills) — `cognitive-load-analyser`, `hinge-question-designer`, `erroneous-example-designer`, `text-complexity-analyser`, `assessment-validity-checker` | CC BY-SA 4.0 | 요소 상호작용 수 세기, 내재 부하와 설계 결함 구분, 전문성 역전 점검 / 오답마다 오개념 하나, 부정형·"모두" 선택지 배제 / 오류 예제는 올바른 예 다음에 하나의 오류로 / 양적·질적·독자-과제 세 측면의 텍스트 복잡도 / 구인 무관 변량과 구인 과소대표 |
| [dmccreary/ibook-skills](https://github.com/dmccreary/ibook-skills) — `quiz-generator` | CC BY-NC-SA 4.0 | 장의 수준별 블룸 목표 분포, 정답 위치 균형(선택지마다 20~30%), 오답 유형(부분 진실·반대·비슷한 용어·흔한 실수), 해설이 오답을 다룰 것 |
| [cdmorozov/claude-tutors](https://github.com/cdmorozov/claude-tutors) — `programming-tutor`, `math-tutor` | MIT | 실수와 오개념의 구분, 학습자가 직접 계산하는 반례로 반박, Python·수학 오개념 목록(일부 고쳐 씀) |
| [Achieve OER Rubrics](https://achieve.org/node/2636) | CC BY 3.0 | "주제 설명의 질" 기준: 대상 학습자가 이해할 만큼 설명하고 관련 개념과 연결할 때 최고 등급 |
| [Google, LearnLM 교수법 원칙](https://services.google.com/fh/files/misc/googlespedagogicalframework.pdf) | 공개 문서 | 능동 학습, 인지부하 관리, 학습자 적응, 호기심, 메타인지 다섯 원칙 |
| [The Carpentries 레슨 개발 안내](https://docs.carpentries.org/handbooks/lesson_developers.html) | CC BY 4.0 | 레슨 검토에서 인지부하·의욕을 꺾는 표현·접근성을 함께 본다 |
| [progmiscon.org](https://progmiscon.org/) (Chiodini 외, 2021) | 표시 확인 못 함 | 프로그래밍 언어 오개념 목록의 형식. 내용은 옮기지 않았다 |
| 국립국어원 「쉬운 공공언어 쓰기」 | 공공 자료 | 긴 문장을 짧은 문장 여럿으로 나누는 원칙 |

## 이론 출처

- Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). *A Taxonomy for Learning, Teaching, and Assessing*. — 개정 블룸 분류
- Biggs, J. (1996). Enhancing teaching through constructive alignment. *Higher Education*, 32, 347–364. — 목표·활동·평가의 정렬
- Mager, R. F. (1997). *Preparing Instructional Objectives* (3rd ed.). — 측정 가능한 목표 동사
- Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2). / Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review*, 31. — 인지부하, 풀이 예 효과
- Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist*, 38(1). — 숙련 학습자에게는 지원이 오히려 부담
- Renkl, A., & Atkinson, R. K. (2003). Structuring the transition from example study to problem solving. *Educational Psychologist*, 38(1). — 풀이 예의 점진적 생략
- Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, 17. — 스캐폴딩
- Merrill, M. D. (2002). First principles of instruction. *ETR&D*, 50(3). — 활성화·시연·적용·통합
- Reigeluth, C. M. (1999). The elaboration theory. In *Instructional-Design Theories and Models* Vol. II. — 단순에서 복잡으로
- Posner, G. J., Strike, K. A., Hewson, P. W., & Gertzog, W. A. (1982). Accommodation of a scientific conception. *Science Education*, 66(2). — 개념 변화
- Guzzetti, B. J., Snyder, T. E., Glass, G. V., & Gamas, W. S. (1993). Promoting conceptual change in science. *Reading Research Quarterly*, 28(2). / Tippett, C. D. (2010). Refutation text in science education. *IJSME*, 8. — 반박 텍스트
- Große, C. S., & Renkl, A. (2007). Finding and fixing errors in worked examples. *Learning and Instruction*, 17(6). — 오류 예제
- Wiliam, D. (2011). *Embedded Formative Assessment*. — 진단 문항(hinge question)
- Haladyna, T. M., Downing, S. M., & Rodriguez, M. C. (2002). A review of multiple-choice item-writing guidelines. *Applied Measurement in Education*, 15(3). — 선택형 문항 작성 지침
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science*, 17(3). — 인출 연습
- Messick, S. (1989). Validity. In *Educational Measurement* (3rd ed.). — 구인 타당도
- du Boulay, B. (1986). Some difficulties of learning to program. *Journal of Educational Computing Research*, 2(1). — 프로그램 실행 모형(notional machine)
