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

CI의 운영 의존성 감사에서 기존 Next.js 16.3.8이 보안 권고의 영향 범위에 들어가는 것을 확인해 `next`와 `eslint-config-next`를 16.4.3으로 맞췄습니다. 근거는 [이미지 최적화](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Server Actions](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [use cache](https://github.com/advisories/GHSA-673q-mjm6-r5xr) 권고입니다. 버전과 전이 의존성은 `package-lock.json`에 고정합니다.

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

## 2026-11 트랙·모듈·레슨 재구성

[재구성 플랜](../plans/top-down-curriculum.md)에 따라 사이트를 다시 만들면서 다음을 옮기거나 지웠습니다.

| 이전 | 현재·이유 |
| --- | --- |
| `src/content/weeks/`, `sections/`, `labs/`, `assignments/`, `syllabus.ts`, `quizAnswers.ts` | `src/content/modules/<slug>/`(모듈·레슨·실습·과제를 한 폴더에)와 `src/content/curriculum/`(트랙·개념·일정·예전 주소 대응표). 레슨 파일 하나에 본문·문항·모범답안을 함께 둡니다 |
| 주차별 커리큘럼 문서 8개(`docs/curriculum/week-0N.md`) | 모듈별 문서 27개와 목차·개념 색인·집계표. `scripts/docs/generate-curriculum.ts`가 새 원본에서 생성합니다 |
| 일일 백업, 마이그레이션 전 스냅숏, 백업 내려받기, 시스템 화면의 백업 기능, `BACKUP_MIRROR_DIR` | 삭제. 사이트는 DB 백업 사본을 만들지 않으며 개인정보처리방침도 같게 고쳤습니다([데이터 저장소](../operations/data.md)) |
| 예전 JSON 저장소 가져오기(`legacyImport.ts`) | 삭제. 모든 운영 데이터가 이미 SQLite로 옮겨졌습니다 |
| `docs/operations/data-and-backups.md` | `docs/operations/data.md` |
| 본문에서 빠진 교육 이미지 13개, 쓰이지 않는 그림 4개(`exception-flow`, `knn-vote`, `phase-roadmap`, `difficulty-curve`) | 삭제. `validate:content`가 쓰이지 않는 그림과 레슨 이미지를 경고합니다 |

예전 8주 구성의 주소(`/weeks/...`)는 `src/content/curriculum/legacy.ts`의 대응표로 새 레슨과 과제에 연결합니다. 예전 단계 기준의 학습 기록은 DB에 남아 있지만 새 사이트는 읽지 않습니다. 그림 파일 이름(`w1.tsx`~`w8.tsx`)은 예전 주제 묶음을 따른 것으로 레슨의 위치와는 관계없습니다.

## 자기 점검 과제 전환 이후

과제 제출과 운영자 채점이 사라진 뒤 호출처가 없는 제출 저장·채점·다운로드·집계 코드와 제출 검사·마감일 계산·제출 요청 제한을 제거했습니다. 이전 노트북 복원, 보관 첨부 크기 표시와 계정 삭제 시 파일 정리는 기존 데이터를 다루므로 유지합니다.
