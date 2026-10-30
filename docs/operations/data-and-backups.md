# 데이터 저장소와 백업

[문서 홈](../README.md) · 경로와 명령은 저장소 루트 기준입니다.

## 데이터 저장소와 백업

계정·학습 기록·과제 제출·채팅·운영 설정은 `DATA_DIR/aegis.db`(SQLite) 하나에 저장합니다(`src/lib/db.ts`).
Node.js에 들어 있는 `node:sqlite`를 쓰므로 따로 설치할 것이 없고, 빌드 서버와 운영 서버의 Node 버전이 달라도 됩니다.

- **쓰기 비용이 사용자 수와 무관합니다.** 예전에는 확인 문제 하나를 풀어도 전체 학습 기록 파일(사용자 수에 비례해 커짐)을
  통째로 다시 썼지만, 지금은 바뀐 단계·문항의 행만 씁니다. 1,000명 분량(약 120MB)에서 확인 문제 저장은 1~2ms,
  스터디원 관리·제출함 화면은 전체 기록을 읽지 않고 필요한 숫자만 DB에서 모읍니다.
- **WAL 모드**라 읽기와 쓰기가 서로 막지 않고, 무중단 배포 중 두 버전이 함께 떠 있어도 같은 DB를 안전하게 씁니다.
  가입처럼 "확인 후 생성"하는 작업은 트랜잭션 하나로 처리해 동시에 일어나도 겹치지 않습니다.
- **구조 변경(마이그레이션)** 은 서버가 시작할 때 `src/lib/db.ts`의 `MIGRATIONS` 순서대로 자동 적용되고, 적용 전 DB 스냅숏을
  `backups/…-pre-migration-v<N>.db`로 남깁니다. 무중단 배포 중에는 이전 버전이 아직 돌고 있으므로 열·표를 **추가만** 하고,
  지우거나 이름을 바꾸는 변경은 그 열을 더 이상 쓰지 않는 버전을 먼저 배포한 다음에 합니다.
- **예전 JSON 저장소에서 옮기기** — 서버가 시작할 때 `DATA_DIR`에 `users.json`·`learning.json`·`submissions.json`·
  `chats.json`(또는 `threads.json`)·`settings.json`이 있으면 DB로 옮깁니다(`src/lib/legacyImport.ts`). 무중단 배포 중
  이전 버전이 그 사이 JSON에 쓴 내용도 3분 동안 따라잡은 뒤 원본을 `legacy-json/<시각>/`으로 옮겨 6주 동안 보관합니다.
  JSON을 읽지 못하면 서버가 상태 확인에 실패해 배포가 취소되고, 사이트는 이전 버전으로 계속 동작합니다.
  옮긴 결과는 `/operator/system`에 표시됩니다.
- **백업** — 매일 새벽 4시 무렵(한국 시간) DB 전체를 `backups/aegis-<시각>-daily.db.gz`로 백업하고, 최근 7일치는 모두,
  그 이전 5주는 주마다 하나를 남깁니다(수동·업그레이드 전 백업은 종류별 최근 5개). 어떤 백업도 6주를 넘겨 보관하지 않습니다 —
  탈퇴한 사용자의 기록이 백업에 남는 기간의 상한으로, 개인정보처리방침에 적혀 있습니다. 서버가 그 시간에 꺼져 있었으면 다시 켜질 때 만듭니다. `/operator/system`에서
  바로 백업하거나 내려받을 수 있습니다. 같은 디스크의 백업은 실수를 되돌리는 용도이므로, 디스크 고장에 대비하려면
  가끔 내려받아 두거나 `BACKUP_MIRROR_DIR`(다른 볼륨)을 지정하세요. 첨부 파일(`uploads/`)은 백업에 들어가지 않습니다.
- **오류 기록** — 요청 처리 중 난 서버 오류는 최근 300건까지 DB에 남아 `/operator/system`에서 볼 수 있습니다(경로만 기록하고
  쿼리 문자열은 남기지 않습니다). 전체 로그는 `DEPLOY_DIR/logs/`에 있습니다.

백업에서 되돌리기(서버에서):

```bash
cd /home/ubuntu/aegis-ai-study
APP="$(cat active-name)"
pm2 stop "$APP"
for f in aegis.db aegis.db-wal aegis.db-shm; do [ -f "data/$f" ] && mv "data/$f" "data/$f.before-restore"; done
gunzip -c data/backups/aegis-<시각>-daily.db.gz > data/aegis.db   # 업그레이드 전 스냅숏(.db)은 cp로 복사
pm2 start "$APP"
```

이 저장 방식 이전 버전(JSON 파일)으로 되돌려 배포하면 그 버전은 DB를 읽지 못합니다. 그럴 일이 있으면 먼저
`legacy-json/<시각>/`의 파일(6주 동안 보관)을 `data/`로 되돌려야 하며, 옮긴 뒤에 생긴 기록은 그 버전에서 보이지 않습니다.
