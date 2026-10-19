# 2026-10-19 외부 Nmap 결과와 침해 영향 검토

대상은 사용자가 제공한 `161.33.143.189`의 2026-10-19 약 15:04 KST TCP 스캔이다. 저장소의 앱·배포 코드를 함께 검토했다. 별도 공격·취약점 악용·대규모 재스캔은 수행하지 않았다. 아래 관측과 침해 시나리오는 구분해야 한다. **이 결과는 침해 사실이나 공격 성공률을 증명하지 않는다.**

## 운영 배포에서 확인한 실제 설정

2026-10-19 15:48 KST, [운영 배포 39211818318](https://github.com/meaterick/Studysite/actions/runs/39211818318)의 읽기 전용 점검 결과다. 외부 스캔 시각과 약 44분 차이가 있으며 호스트 기본 네트워크 네임스페이스의 관측이다.

- **최우선 위험: 러너 계정의 전체 `NOPASSWD: ALL` sudo 권한이 확인됐다.** 러너 UID 자체는 root가 아니지만 전체 무암호 sudo가 있다. 앱 PM2와 러너가 같은 계정을 쓰는 현재 배포 구조에서 앱 권한의 임의 코드 실행이 발생하면 root 권한까지 확대할 수 있다. 아직 이 경계를 분리하거나 sudo 권한을 회수한 것은 아니다. 이는 침해가 이미 발생했다는 증거가 아니라 침해 시 피해 범위에 대한 확인이다.
- SSH: 실제 설치 `openssh-server 1:9.6p1-3ubuntu13.20`. 전역 설정은 `passwordauthentication no`, `kbdinteractiveauthentication no`, `pubkeyauthentication yes`, `permitrootlogin without-password`, `allowtcpforwarding yes`, `maxauthtries 6`. root의 키 인증 로그인은 여전히 허용되는 설정이다. 접속별 Match 조건·키 소유자·OCI 출발지 제한과 실제 로그인 이력은 별도 검토 대상이다.
- DNS: TCP/UDP 53은 **루프백의 systemd-resolved만 관측**됐다. `bind9` 패키지는 설치 정보를 얻지 못했다(`not installed / unavailable`). 외부 Nmap의 RHEL BIND 응답을 이 호스트의 공개 BIND라고 확정할 수 없다. 컨테이너 네임스페이스·DNAT·OCI 네트워크 경로·스캔 출발지의 중간 장비·시점 차이는 검사하지 않았다. 이 결과만으로 외부 53번이 닫혔다고 결론 내리지 않는다.
- 앱: TCP 3000은 루프백 대기 상태였다. 제공 Nmap의 외부 `closed` 결과 및 배포 코드의 loopback 바인딩과 부합한다. 모든 시점·IPv6·다른 네트워크 경로의 접근 차단까지 입증하는 것은 아니다.
- nginx 설치 패키지는 `1.24.0-2ubuntu7.18`. 서비스 검증은 HTTP→HTTPS 301, 내부 HTTPS 200, 외부 HTTPS 200, 별도 health 200이었다. 이 응답은 서비스 가동 확인이며 침해 점검 결과가 아니다.

## 관측과 우선순위

| 항목 | 제공 결과로 확인되는 내용 | 판단과 조치 |
| --- | --- | --- |
| TCP 22 | OpenSSH 9.6p1 Ubuntu 3ubuntu13.20 응답 | 관리 인터페이스가 외부에서 응답했다. `.20`은 Ubuntu USN-8928-1(2026-10-14)의 24.04 보안 수정 패키지 `1:9.6p1-3ubuntu13.20`과 일치한다. upstream `9.6` 숫자만 보고 취약하다고 단정하지 않는다. 실제 설치 패키지·재시작 여부·SSH 인증 정책·OCI 출발지 제한을 확인한다. |
| TCP 53 | tcpwrapped 및 BIND `9.11.36-RedHat-9.11.36-16.el8_10.15` 문자열 | 예상 밖 노출을 가장 먼저 대조한다. tcpwrapped는 인증·안전성 보장이 아니다. Ubuntu SSH와 RHEL BIND 문자열이 함께 있어 같은 OS 프로세스라는 전제도 검증해야 한다. 서버 리스너, OCI/NAT 경로, 서비스 소유자를 확인한다. DNS를 직접 제공하지 않으면 외부 TCP/UDP 53 허용을 제거한다. 실제 DNS라면 재귀·캐시 접근, zone transfer ACL과 해당 배포판 지원·패치 상태를 확인한다. 열린 재귀 서버나 UDP 증폭 가능성은 이 TCP 결과에서 입증되지 않았다. |
| TCP 80 | nginx, HTTPS 리다이렉트 | 일반적인 웹 서비스 진입점. IP 대상으로 https IP로 이동하는 현상만으로 취약하다고 판단하지 않는다. 도메인 기준 HTTPS·인증서·리다이렉트를 확인한다. |
| TCP 443 | 스터디 사이트 제목, 도메인 인증서 | 인터넷에 앱이 노출된 상태. 인증·권한·입력 처리·의존성·비밀키 관리가 핵심이다. 인증서 유효 기간은 스캔 당시 유효하며 자동 갱신 실패 여부는 별도 모니터링한다. |
| TCP 3000 | **closed** | 스캔 위치와 시점에서 TCP 연결을 받지 않았다. 필터링과 다르며 `ppp`는 포트 이름일 뿐 실제 PPP 서비스 탐지 결과가 아니다. 저장소 배포는 3000/3001을 `127.0.0.1`에 바인딩한다. 3001과 IPv6의 외부 접근성은 제공 결과만으로 보장되지 않는다. |
| 나머지 TCP | 65,530개 filtered | 무응답으로 상태를 확정하지 못한 것이다. 숨은 취약점이 없다는 뜻이 아니며 UDP 결과도 아니다. |
| OS / NSE | JUST GUESSING, non-ideal, 여러 script execution failed | 실제 커널 버전을 확정할 수 없다. VMware/RPC/JDWP 스크립트 오류는 해당 서비스의 존재나 취약점 증거가 아니다. `TLS randomness does not represent time` 자체도 취약점 판정이 아니다. |

## ‘털렸을 때’ 가능한 피해

다음은 조건부 영향 분석이며 현재 발생했다고 주장하는 내용이 아니다.

1. **앱 프로세스 권한의 임의 코드 실행 / 계정 탈취: 높음.** `DATA_DIR`의 SQLite, 회원 이메일·이름·학습 기록·제출물·상담 채팅, 첨부 파일·초안·로컬 DB 백업을 읽거나 바꿀 수 있다. 보안 로그도 같은 계정에서 변경할 수 있어 침해 후 무결성을 보장하지 못한다.
2. **비밀키·인증 체계 피해: 높음.** 앱이 읽는 세션 서명키가 유출되면 기존 계정의 세션 위조 위험이 있다. Google OAuth client secret 등 배포 비밀도 유출 범위에 포함된다. Google 비밀번호가 저장돼 있거나 Google 계정 전체가 자동으로 탈취된다는 의미는 아니다. 서명키 교체·세션 무효화, 노출된 OAuth 비밀 교체와 공급자 감사가 필요하다.
3. **호스트 전체 침해로 확대: 매우 높음, 계정 권한에 의존.** 현재 배포 스크립트는 앱 PM2와 self-hosted Actions 러너를 같은 계정으로 실행한다. 앱 계정은 자신의 배포 파일·러너 영역을 조작하고 다음 배포 비밀을 노릴 수 있다. 이 계정에 전체 `NOPASSWD: ALL` sudo 또는 root 권한이 있으면 앱 침해가 서버 전체 장악으로 이어질 수 있다. 방화벽·인증서 키·다른 프로세스·로그·백업도 영향을 받는다. 위 운영 점검에서 실제 전체 무암호 sudo가 확인됐으므로 이 권한 확대 경로는 현재 설정에서 존재한다. 임의 코드 실행 자체의 발생 여부는 확인되지 않았다.
4. **클라우드 / GitHub 확산: 부여된 권한에 의존.** OCI instance principal과 dynamic group IAM 정책이 부여됐다면 메타데이터로 얻는 단기 자격 증명의 권한까지 영향을 받을 수 있다. OCI 전체 권한이 자동 부여되는 것은 아니다. 러너의 실행 중 토큰·등록 정보·다음 작업 비밀도 침해 대상이며 저장소·환경 권한에 따라 영향이 달라진다. 현재 PR 검증은 GitHub 호스팅 러너, 배포는 main의 self-hosted 러너다.
5. **DNS 프로세스 침해:** 해당 프로세스 권한·격리에 따라 DNS 응답 변경, 서비스 중단, 데이터 노출 및 호스트 권한 상승 시도가 가능하다. DNS 문자열 하나로 원격 코드 실행이나 현재 취약 CVE를 단정할 수 없다.

## 우선 대응

- 53번의 실제 서비스 소유자를 확인하고 필요 없는 공인 진입점을 OCI NSG/Security List와 호스트 방화벽에서 닫는다. 도메인을 사용하는 것과 이 웹 서버에서 DNS를 직접 제공하는 것은 별개다. 로컬 `systemd-resolved`의 루프백 53번을 무조건 종료하지 않는다.
- 22번은 필요한 관리 IP 또는 OCI Bastion으로 제한하고 키 인증을 사용한다. 비밀번호·대화형 인증 및 root 직접 로그인 필요성을 검토한다. 현재 접속과 복구 경로를 확인한 뒤 설정을 바꾼다.
- 앱을 전용 비특권 계정으로 실행하고 배포 러너와 분리한다. 전체 무암호 sudo를 제거하고 필요한 root 작업만 고정된 배포 경계에서 수행한다. 가능하면 러너를 별도 VM/일회성 깨끗한 환경으로 분리한다.
- OS와 설치 패키지는 배포판 보안 공지를 기준으로 업데이트한다. 로컬 `dpkg-query` 결과와 실행 프로세스 재시작을 대조한다. 배너를 숨기는 것은 패치를 대신하지 않는다.
- 인증·보안 로그와 중요한 백업은 다른 계정/호스트 또는 접근 제한된 외부 저장소에 보관한다. 같은 호스트의 IP 밴·로그는 SSH/DNS 공격, 볼륨 DDoS, root 공격자를 막지 못한다.
- 실제 침해 증거가 있으면: OCI에서 격리·증거 보존, 신뢰할 수 있는 다른 환경에서 노출 자격 증명/세션 폐기, 러너 폐기·재등록, IAM·GitHub 감사, 깨끗한 이미지 재설치와 검증된 백업 복구를 우선한다. IP 해제나 재부팅만으로 복구 완료라고 판단하지 않는다.

## 새 관리자 화면과 확인 범위

`/operator/security`의 **서버 점검**은 배포 시 `ss` TCP/UDP 리스너, SSH 전역 설정, 선택 패키지, 러너 UID/root 및 전체 무암호 sudo 여부를 읽는다. SSH Match 조건, 실제 외부 접근성, OCI 방화벽/IAM 정책, 계정 로그인 이력, DNS 재귀 응답은 검사하지 않는다. 시각과 확인 실패 항목을 표시하며 24시간을 넘으면 오래된 결과임을 알린다. 파일은 서버 내부 0600이고 관리자로 확인된 요청에만 화면을 제공한다. 호스트가 침해되면 이 스냅숏도 변조될 수 있다.

확인된 전체 sudo 권한과 공유 실행 계정의 분리를 우선 조치하고, 외부 53번 응답의 출처는 추가 대조해야 한다. SSH/방화벽/DNS 설정을 이 변경에서 자동으로 바꾸지는 않는다.

## 근거

- Ubuntu USN-8928-1, 2026-10-14: https://ubuntu.com/security/notices/USN-8928-1
- Ubuntu 보안 업데이트와 배포판 수정: https://documentation.ubuntu.com/security/security-updates/
- Nmap 포트 상태 정의: https://nmap.org/book/man-port-scanning-basics.html
- Nmap OS 추정의 의미: https://nmap.org/book/man-os-detection.html
- BIND 재귀/전송 ACL: https://bind9.readthedocs.io/en/latest/reference.html (설치한 구버전의 기본값은 해당 버전 문서와 실제 설정을 확인)
- GitHub self-hosted runner 보안: https://docs.github.com/en/actions/reference/security/secure-use
- OCI Compute metadata/IAM 보안: https://docs.oracle.com/en-us/iaas/Content/Security/Reference/compute_security.htm
- 저장소 근거: `.github/workflows/deploy.yml`, `scripts/deploy/deploy.sh`, `ecosystem.config.js`, `scripts/deploy/nginx-site.sh`, `src/lib/dataDir.ts`, `src/lib/db.ts`, `src/lib/session.ts`, `src/lib/ipDefense.ts`.
