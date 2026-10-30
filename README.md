# Aegis AI 스터디 「AI 기초부터 활용까지」

8주 동안 수학·Python·머신러닝에서 신경망·Transformer·LLM·RAG·에이전트와 캡스톤까지 배우는 학습 사이트입니다. 단계별 학습 자료, 브라우저 Python 실습, 확인 문제, 백지공부, 과제 제출·피드백을 제공합니다.

## 먼저 볼 문서

| 목적 | 문서 |
| --- | --- |
| 전체 과정과 모든 단계·개념 확인 | [AI 커리큘럼 상세 목차](docs/curriculum/README.md) |
| 학습·개발·운영 문서 탐색 | [문서 홈](docs/README.md) |
| 코드 구조와 파일 역할 이해 | [기술 구조와 저장소 지도](docs/development/architecture.md) |
| 학습 자료 수정·추가 | [콘텐츠 편집 안내](docs/contributing/content-authoring.md) |
| 배포·로그인 설정 | [배포 안내](docs/operations/deployment.md) |
| 데이터 보관·복구 | [데이터와 백업](docs/operations/data-and-backups.md) |

## 로컬 실행

CI와 같은 Node.js 24 환경을 사용합니다. 로그인 설정은 [.env.example](.env.example)을 참고해 `.env.local`에 작성합니다.

```bash
npm ci
npm run dev
```

`http://localhost:3000`에서 확인합니다. 프로덕션 빌드는 `npm run build`, 실행은 `npm run start`입니다.

## 수정 후 확인

```bash
npm run docs:generate
npm run docs:check
npm run validate:content
npm run lint
```

실습을 바꾸면 `npm run check:labs`, 보안 코드를 바꾸면 `npm run test:security`와 `npm run test:security:python`을 실행합니다. 전체 구조와 추가 검증은 [개발 안내](docs/development/architecture.md)에 있습니다.

## 구성

Next.js App Router·TypeScript·Tailwind CSS, SQLite(`node:sqlite`), Pyodide 워커, Monaco, KaTeX를 사용합니다. 콘텐츠 원본은 `src/content/`, UI는 `src/app/`과 `src/components/`, 실행·검증 도구는 `scripts/`, 회귀 검사는 `tests/`, 문서는 `docs/`에 둡니다.

`main`에 병합하면 GitHub Actions가 OCI 배포를 시작합니다. 환경 변수와 복구 절차는 [운영 문서](docs/operations/deployment.md)를 먼저 확인하세요.
