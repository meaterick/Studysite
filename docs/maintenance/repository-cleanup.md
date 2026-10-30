# 저장소 정리 기록

[문서 홈](../README.md) · [기술 구조](../development/architecture.md)

## 점검 범위와 원칙

정리 시작 시점의 추적 파일 352개를 대상으로 파일 배치, 소스 import(부수 효과 import 포함), 정적 자산 참조, npm 명령, CI·배포 경로와 문서를 점검했습니다. 프레임워크가 찾는 페이지·라우트·설정 파일은 규약 위치에 둡니다. 학습 단계·문항·실습·과제 셀 ID는 저장된 학습 기록과 연결되므로 유지합니다.

## 문서 재배치

| 이전 위치 | 현재 위치·이유 |
| --- | --- |
| 긴 루트 README | 빠른 시작·주요 링크로 축소. 상세 설명은 아래 목적별 문서로 이동 |
| README의 사이트 구조·학습 흐름·권한 | [사이트 안내](../development/site-guide.md) |
| README의 콘텐츠 수정 방법 | [편집 안내](../contributing/content-authoring.md) |
| README의 스택·저장소 배치 | [기술 구조](../development/architecture.md) |
| README의 배포·백업·보안 | `docs/operations/`의 목적별 안내 |
| 루트 docs의 IP 방어·모니터링 | `docs/operations/` |
| 날짜가 있는 보안 검토 보고서 | `docs/archive/security/`: 당시 관측 기록 보존 |
| 미구현 콘텐츠 구조 제안·교육 검토 | `docs/archive/design/`: 현재 구현과 구분하는 안내 추가 |
| `docs/prompts/` | `docs/contributing/prompts/`: 콘텐츠 작성 보조 자료 |
| 없던 커리큘럼 통합 목차 | `docs/curriculum/`: 총괄·8개 장·개념 색인·원본 대비 집계 |

## 실행 도구와 검사 코드

| 이전 위치 | 현재 위치 |
| --- | --- |
| `scripts/validate-content.ts` | `scripts/content/validate.ts` |
| `scripts/check-labs.ts`, `scripts/lab-fixtures.ts` | `scripts/content/check-labs.ts`, `scripts/content/fixtures.ts` |
| `scripts/security-benchmark.mjs`, `scripts/security-http-smoke.mjs` | `scripts/security/benchmark.mjs`, `scripts/security/http-smoke.mjs` |
| `scripts/*.test.ts`, `scripts/*.test.py` | `tests/security/` |
| 문서 생성·검사 도구 | `scripts/docs/` |

기존 npm 명령 이름은 유지하고 내부 경로·import·Python 수집기 경로·CI 명령을 함께 바꿨습니다. `docs:generate`, `docs:check`, `typecheck`, `test:security:python` 명령을 추가했습니다. Monaco 복사 스크립트는 `fileURLToPath`를 사용해 Windows 드라이브·공백 경로를 해석하도록 수정했습니다. 실습 검증은 `PYTHON` 실행 파일 지정과 UTF-8 입출력을 지원하고, Python 의존성 목록을 `scripts/content/requirements.txt`에 모았습니다. Linux 수집기의 오프라인 검사는 비루트 UID를 모의해 Windows에서도 실행할 수 있게 했습니다.

전체 실습 검증 중 발견한 7주차 RAG 예제의 문서 이름 추출도 `Path(path).stem`으로 수정했습니다. `/`로만 나누던 코드가 Windows CPython에서 `course\\week7`을 문서 이름으로 만들던 문제이며, 브라우저의 `/course/week7.md`와 로컬 환경 모두에서 같은 `week7`을 얻습니다. 과제·셀 ID와 학습 범위는 유지합니다.

## 삭제와 보존 근거

- `src/components/TierRings.tsx`: import와 호출이 없는 이전 진행률 UI를 제거했습니다.
- `src/components/home/TiltCard.tsx`와 전용 `.tilt-card*` CSS: 사용하지 않는 카드 효과를 함께 제거했습니다.
- `public/.gitkeep`: 실제 정적 파일이 이미 있어 디렉터리 유지용 빈 파일을 제거했습니다.
- `src/lib/monacoSetup.ts`: 이름을 참조하는 import가 없어 보일 수 있지만 편집기 3곳의 부수 효과 import이므로 보존했습니다.
- `public/images/aegis-oauth-logo.png`: 코드 밖의 OAuth 설정에서 URL을 사용할 수 있는 브랜드 자산이므로 보존했습니다.
- `legacyImport.ts`, 이전 경로에서 이동하는 페이지, 배포 수집기·설정: 영속 데이터 이전·라우팅·운영에 필요한 파일이므로 보존했습니다.
- `src/content/`의 8주 학습 원본·다이어그램·교육 이미지는 현재 콘텐츠를 구성하므로 보존했습니다.

## 이후 유지 기준

콘텐츠를 수정하면 원본 검증과 목차 재생성을 함께 수행합니다. 과거 보고서는 삭제 대신 archive에 보존하고, 실제 운영법은 operations에서 관리합니다. 새 검사 코드는 tests에, 실행 도구는 scripts의 해당 영역에 둡니다. 폴더를 옮길 때는 package.json·워크플로·상대 import·문서 링크를 한 변경에서 갱신합니다.
