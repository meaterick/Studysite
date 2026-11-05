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

## 운영자

- [배포](operations/deployment.md): GitHub Actions, OCI, Google OAuth, 환경 변수.
- [데이터 저장소](operations/data.md): SQLite, 저장 위치, 학습 기록의 형식, 마이그레이션.
- [보안 운영 개요](operations/security.md), [IP 방어](operations/ip-defense.md), [보안 모니터링](operations/security-monitoring.md).

## 문서 유지 방법

커리큘럼 원본은 `src/content/`입니다. `npm run docs:generate`가 `curriculum/`의 목차·모듈 문서·개념 색인·집계표를 생성합니다. `npm run docs:check`는 원본과의 동기화, 생성 파일 목록, 저장소 내부 문서 링크를 검사합니다. 새 문서는 목적에 맞는 폴더에 넣고 이 홈에서 연결합니다.
