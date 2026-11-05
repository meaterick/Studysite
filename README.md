# Aegis 스터디

Python, 수학과 통계, 데이터 처리, 머신러닝, 딥러닝, 생성형 AI 등을 분야별로 학습하는 사이트입니다.

1. [커리큘럼](https://meaterickedu.kro.kr/curriculum)에서 분야와 모듈을 고릅니다.
2. 레슨 본문을 읽고 **실습** 탭에서 코딩테스트, 출력 예측, 확인 문제를 풉니다.
3. 모듈의 백지복습과 과제로 이해를 점검합니다. 과제는 개인 작업 공간에 자동 저장되며, 자동 테스트와 체크리스트로 직접 확인합니다.

## 문서

| 목적 | 문서 |
| --- | --- |
| 전체 과정과 모든 모듈·레슨·개념 확인 | [커리큘럼 목차](docs/curriculum/README.md) |
| 학습·개발·운영 문서 탐색 | [문서 홈](docs/README.md) |
| 코드 구조와 파일 역할 이해 | [기술 구조와 저장소 지도](docs/development/architecture.md) |
| 학습 자료 수정·추가 | [콘텐츠 편집 안내](docs/contributing/content-authoring.md) |
| 배포·로그인 설정 | [배포 안내](docs/operations/deployment.md) |
| 데이터 저장 위치와 구조 변경 | [데이터 저장소](docs/operations/data.md) |

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

`main`에 병합하면 GitHub Actions가 OCI 배포를 시작합니다. 환경 변수와 배포 절차는 [배포 안내](docs/operations/deployment.md)를 먼저 확인하세요.
