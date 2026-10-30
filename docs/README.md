# Studysite 문서

[저장소 소개](../README.md)

## 학습자: AI 과정 전체 보기

- [AI 커리큘럼 상세 목차](curriculum/README.md): 4부·8주 전체 구성, 모든 핵심·보충·심화 단계와 학습 목표.
- [개념 색인](curriculum/concept-index.md): 본문의 개념·비교 항목에서 관련 단계 찾기.
- [누락 검증표](curriculum/coverage.md): 원본 대비 단계·소제목·실습·문항·과제 집계.
- [사이트와 학습 흐름](development/site-guide.md): 페이지, 단계 완료 조건, 과제·피드백 이용 방식.

## 개발자·콘텐츠 기여자

- [기술 구조와 저장소 지도](development/architecture.md): 폴더 역할, 데이터 흐름, 생성물, 검증 명령.
- [학습 콘텐츠 편집 안내](contributing/content-authoring.md): 본문 문법, 단계·실습·과제 스키마, ID 보존.
- [학습자료 생성 프롬프트](contributing/prompts/learning-content-generator-prompt.md): 초안 작성용 보조 도구. 실제 스키마와 검증 명령은 편집 안내를 우선합니다.
- [저장소 정리 기록](maintenance/repository-cleanup.md): 이동·삭제 이유와 유지 기준.

## 운영자

- [배포](operations/deployment.md): GitHub Actions, OCI, Google OAuth, 환경 변수.
- [데이터와 백업](operations/data-and-backups.md): SQLite, 마이그레이션, 보관, 복구.
- [보안 운영 개요](operations/security.md), [IP 방어](operations/ip-defense.md), [보안 모니터링](operations/security-monitoring.md).

## 과거 검토·설계 이력

아래 자료는 당시의 제안·관측 기록입니다. 현재 구현 안내와 구분해서 읽습니다.

- [콘텐츠 저장 구조 변경 제안](archive/design/content-system-redesign.md).
- [학습 콘텐츠 교육 설계 검토](archive/design/learning-content-educational-review.md).
- [2026-10-19 보안 점검](archive/security/security-review-2026-10-19.md).
- [2026-10-19 외부 Nmap 위험 검토](archive/security/nmap-risk-review-2026-10-19.md).
- [2026-10-19 보안 구조·효율 점검](archive/security/security-architecture-review-2026-10-19.md).

## 문서 유지 방법

커리큘럼 원본은 `src/content/`입니다. `npm run docs:generate`가 `curriculum/`의 목차·색인·검증표를 생성합니다. `npm run docs:check`는 원본과의 동기화, 생성 파일 목록, 저장소 내부 문서 링크를 검사합니다. 새 문서는 목적에 맞는 폴더에 넣고 이 홈에서 연결합니다.
