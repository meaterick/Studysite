# Studysite 문서

[저장소 소개](../README.md)

## 학습자

- [커리큘럼 목차](curriculum/README.md): 분야별 모듈과 레슨, 학습 목표, 16주 추천 일정. 모듈마다 목표 문제, 학습 목표, 레슨, 백지 복습, 과제를 정리한 문서가 있습니다.
- [개념 색인](curriculum/concept-index.md): 80개 개념과 그 개념을 다루는 레슨, 선수 개념.
- [집계표](curriculum/coverage.md): 모듈별 레슨·문항·실습·그림 수와 예상 시간.
- [사이트와 학습 흐름](development/site-guide.md): 페이지, 레슨 완료 조건, 진단 평가, 실습 탭, 백지 복습, 자기 점검 과제 이용 방식.

## 개발자·콘텐츠 기여자

- [기술 구조와 저장소 지도](development/architecture.md): 폴더 역할, 데이터 흐름, 생성물, 검증 명령.
- [학습 콘텐츠 편집 안내](contributing/content-authoring.md): 모듈·레슨·실습·과제의 작성 방법, 문체와 용어, ID 보존, 검증 명령.
- [학습자료 생성 프롬프트](contributing/prompts/learning-content-generator-prompt.md): 초안 작성용 보조 도구. 실제 스키마와 검증 명령은 편집 안내를 우선합니다.
- [저장소 정리 기록](maintenance/repository-cleanup.md): 이동·삭제 이유와 유지 기준.

## 운영자

- [배포](operations/deployment.md): GitHub Actions, OCI, Google OAuth, 환경 변수.
- [데이터 저장소](operations/data.md): SQLite, 저장 위치, 학습 기록의 형식, 마이그레이션.
- [보안 운영 개요](operations/security.md), [IP 방어](operations/ip-defense.md), [보안 모니터링](operations/security-monitoring.md).

## 설계와 계획 이력

현재 동작은 위의 문서를 기준으로 합니다.

**초기 구조 개편 기록.** 현재 분야·모듈·레슨 구조의 출발점을 정리한 문서입니다. 당시 화면과 운영 방식은 달라졌습니다.

- [AI 커리큘럼 탑다운 재구성 플랜](plans/top-down-curriculum.md): 80개 AI 개념 기준의 트랙·모듈·레슨 구조, 사이트 정보 구조와 진도 이전, 실행 순서.
- [부록: 기존 104단계 재배치표](plans/top-down-curriculum-mapping.md): 예전 8주 구성의 모든 단계가 옮겨 간 레슨과 처리.

**검토용(구현하지 않음).** 현재 사이트와 구조가 다른 개편안입니다.

- [Python·AI 탑다운 커리큘럼 기획안](product/learning-platform-plan.md): Python과 AI 각 6모듈·24레슨의 기본 경로, 목적별 선택 심화, 레슨·화면·진도·단계별 공개 기준. Python은 작은 프로그램을 실행·수정·검증하며 학습하고, AI는 캡스톤·프로젝트·필수 구현·제출·채점 없이 개념·원리·해설 예시를 전달하는 지식형 과정으로 설계한 안입니다.

## 과거 검토·설계 이력

아래 자료는 당시의 제안·관측 기록입니다. 현재 구현 안내와 구분해서 읽습니다.

- [콘텐츠 저장 구조 변경 제안](archive/design/content-system-redesign.md).
- [학습 콘텐츠 교육 설계 검토](archive/design/learning-content-educational-review.md).
- [2026-10-19 보안 점검](archive/security/security-review-2026-10-19.md).
- [2026-10-19 외부 Nmap 위험 검토](archive/security/nmap-risk-review-2026-10-19.md).
- [2026-10-19 보안 구조·효율 점검](archive/security/security-architecture-review-2026-10-19.md).

## 문서 유지 방법

커리큘럼 원본은 `src/content/`입니다. `npm run docs:generate`가 `curriculum/`의 목차·모듈 문서·개념 색인·집계표를 생성합니다. `npm run docs:check`는 원본과의 동기화, 생성 파일 목록, 저장소 내부 문서 링크를 검사합니다. 새 문서는 목적에 맞는 폴더에 넣고 이 홈에서 연결합니다.
