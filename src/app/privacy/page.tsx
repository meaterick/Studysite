import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "Aegis AI 스터디 개인정보처리방침",
};

const UPDATED_AT = "2026년 9월 27일";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--border-hairline)] py-7 first:border-t-0 first:pt-0">
      <h2 className="mb-3 text-lg font-black text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-ink-secondary">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <PageHeader eyebrow="Aegis AI 스터디" title="개인정보처리방침" description={`시행일: ${UPDATED_AT}`} className="mb-6" />
      <p className="surface p-5 text-sm leading-7 text-ink-secondary">
        Aegis AI 스터디(이하 “서비스”)는 학습 서비스 제공에 필요한 최소한의 개인정보만 처리합니다. 이 방침은
        서비스에서 어떤 정보를 왜 처리하는지와 이용자가 행사할 수 있는 권리를 설명합니다.
      </p>

      <div className="mt-10">
        <Section title="1. 처리하는 개인정보와 목적">
          <div className="surface overflow-x-auto rounded-xl">
            <table className="w-full min-w-[620px] text-left text-xs leading-6 sm:text-sm">
              <thead className="bg-[var(--surface-card-2)] text-ink">
                <tr>
                  <th className="px-4 py-3 font-bold">구분</th>
                  <th className="px-4 py-3 font-bold">처리 항목</th>
                  <th className="px-4 py-3 font-bold">처리 목적</th>
                  <th className="px-4 py-3 font-bold">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--border-hairline)]">
                  <td className="px-4 py-3">계정</td>
                  <td className="px-4 py-3">이름, 이메일, 계정 ID, 가입일, 권한</td>
                  <td className="px-4 py-3">가입자 식별, 로그인, 스터디 운영</td>
                  <td className="px-4 py-3">회원 탈퇴 시까지</td>
                </tr>
                <tr className="border-t border-[var(--border-hairline)]">
                  <td className="px-4 py-3">Google 로그인</td>
                  <td className="px-4 py-3">Google 계정 식별자, Google이 확인한 이름·이메일</td>
                  <td className="px-4 py-3">Google OAuth 로그인과 계정 연결</td>
                  <td className="px-4 py-3">회원 탈퇴 시까지</td>
                </tr>
                <tr className="border-t border-[var(--border-hairline)]">
                  <td className="px-4 py-3">학습 기록</td>
                  <td className="px-4 py-3">단계별 확인 문제 응답, 서술형 답안과 자기평가, 백지공부 답안, 단계 완료 시각</td>
                  <td className="px-4 py-3">학습 진도 관리, 복습 노트 제공, 스터디 운영</td>
                  <td className="px-4 py-3">회원 탈퇴 시까지</td>
                </tr>
                <tr className="border-t border-[var(--border-hairline)]">
                  <td className="px-4 py-3">과제</td>
                  <td className="px-4 py-3">작성 중인 과제(코드·실행 결과·답안, 자동 저장), 제출 버전, 첨부 파일, 채점 결과와 피드백, 과제 메시지</td>
                  <td className="px-4 py-3">과제 작성 지원, 채점과 피드백</td>
                  <td className="px-4 py-3">회원 탈퇴 시까지</td>
                </tr>
                <tr className="border-t border-[var(--border-hairline)]">
                  <td className="px-4 py-3">보안 로그</td>
                  <td className="px-4 py-3">로그인 시도 시각, 이메일 식별값, IP 주소</td>
                  <td className="px-4 py-3">무차별 대입 등 인증 공격 방지</td>
                  <td className="px-4 py-3">최대 15분, 서버 메모리 내에서만</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>서비스는 이메일·비밀번호 로그인을 제공하지 않으며, Google이 확인한 계정 정보만 사용합니다.</p>
        </Section>

        <Section title="2. 브라우저에만 저장되는 정보">
          <p>
            학습 자료의 실습 코드 편집 내용, 저장하기 전의 서술형·백지공부 초안, 화면 테마 설정은 이용 편의를 위해
            브라우저에만 저장됩니다. 이 정보는 서버로 전송되지 않으며, 브라우저 데이터 삭제·기기 변경·브라우저
            초기화 시 사라질 수 있습니다.
          </p>
        </Section>

        <Section title="3. 개인정보의 제공 및 처리 위탁">
          <p>
            서비스는 개인정보를 판매하거나 광고 목적으로 제3자에게 제공하지 않습니다. 이용자가 Google 로그인을
            선택하면 인증을 위해 Google OAuth 서비스를 이용하며, Google이 제공하는 이름·이메일·고유 식별자를
            수신합니다. 코드 실행 환경(Pyodide)과 코드 편집기는 외부 콘텐츠 전송망(jsDelivr)에서 내려받으며,
            작성한 코드는 이용자의 브라우저 안에서만 실행됩니다.
          </p>
        </Section>

        <Section title="4. 쿠키와 세션">
          <p>
            로그인 상태 유지와 OAuth 보안 검증을 위해 httpOnly 세션 쿠키 및 짧은 수명의 OAuth 상태 쿠키를
            사용합니다. 이 쿠키는 광고 추적 목적으로 사용하지 않습니다. 브라우저 설정에서 쿠키를 차단하면 로그인
            기능을 이용하지 못할 수 있습니다.
          </p>
        </Section>

        <Section title="5. 정보주체의 권리와 행사 방법">
          <p>
            이용자는 로그인 후 <Link className="font-bold text-[var(--series-blue)] hover:underline" href="/account">내 계정</Link>에서
            자신의 계정 정보를 확인하고 회원 탈퇴를 요청할 수 있습니다. 탈퇴 시 서버에 보관된 계정 정보, 학습 기록,
            과제(제출물·첨부 파일 포함)는 즉시 삭제됩니다. 브라우저에 남은 정보는 각 브라우저의 사이트 데이터 삭제
            기능으로 직접 지울 수 있습니다.
          </p>
        </Section>

        <Section title="6. 안전성 확보 조치">
          <p>
            서비스는 전송 구간 암호화(HTTPS), 서명된 httpOnly 세션 쿠키, 인증 시도 횟수 제한, 접근 권한 분리
            (과제 첨부 파일은 제출자 본인과 운영자만 열람)를 적용해 개인정보를 보호합니다. 다만 인터넷 환경의 특성상 모든 위험을 완전히 제거할 수는
            없습니다.
          </p>
        </Section>

        <Section title="7. 방침의 변경 및 문의">
          <p>
            이 방침은 서비스 기능 또는 관련 법령의 변경에 따라 수정될 수 있으며, 변경 시 이 페이지의 시행일을
            갱신합니다. 개인정보 관련 문의나 권리 행사는 스터디 운영자에게 요청해 주십시오.
          </p>
        </Section>
      </div>
    </article>
  );
}
