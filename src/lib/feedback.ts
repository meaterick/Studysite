import "server-only";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import { readSectionState, readWorksheetState, type LearningRecord } from "./learningStore";
import { listUserSubmissions } from "./submissionStore";
import { findConversation, unreadCount } from "./chatStore";

// 스터디원 한 명에게 온 피드백을 한곳에 모은다(피드백함·진도 대시보드·헤더 배지가 같이 쓴다).
// - 운영자 피드백: 채점 결과, 재제출 요청, 과제별 코멘트, 운영자 채팅
// - 복습 거리: 틀린 적 있는 확인 문제, "보완 필요"로 표시한 서술형·백지공부
// "새 피드백"은 피드백함을 마지막으로 연 시각(record.feedbackSeenAt) 이후의 채점과 읽지 않은 채팅이다.

export type FeedbackKind = "grade" | "revision" | "chat";

export interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  weekNumber?: number;
  title: string;
  detail?: string;
  /** 과제별 코멘트 수(채점 결과) */
  comments?: number;
  href: string;
  at: string;
  isNew: boolean;
}

export interface ReviewItem {
  weekNumber: number;
  weekSlug: string;
  sectionNumber: number;
  sectionTitle: string;
  wrongChecks: number;
  /** 틀린 적 있지만 지금은 맞힌 문제 수 */
  recovered: number;
  weakAnswers: number;
  href: string;
}

export interface MemberFeedback {
  items: FeedbackItem[];
  /** 새 채점·재제출 요청 수 + 읽지 않은 채팅 메시지 수 */
  newCount: number;
  chatUnread: number;
  review: ReviewItem[];
  weakWorksheet: { weekNumber: number; weekSlug: string; count: number }[];
  /** 받은 채점 중 확인한(피드백함을 연 뒤의) 비율 계산용 */
  gradesTotal: number;
  gradesSeen: number;
}

export function memberFeedback(userId: string, record: LearningRecord): MemberFeedback {
  const seenAt = record.feedbackSeenAt ?? "";
  const items: FeedbackItem[] = [];
  const weekBySlug = new Map(WEEKS.map((w) => [w.slug, w]));

  let gradesTotal = 0;
  let gradesSeen = 0;
  for (const sub of listUserSubmissions(userId)) {
    const week = weekBySlug.get(sub.weekSlug);
    if (!week) continue;
    for (const g of sub.grades) {
      gradesTotal++;
      const isNew = g.gradedAt > seenAt;
      if (!isNew) gradesSeen++;
      const comments = Object.keys(g.taskComments ?? {}).length;
      items.push({
        id: `grade:${sub.id}:${g.gradedAt}`,
        kind: g.decision === "revision" ? "revision" : "grade",
        weekNumber: week.number,
        title:
          g.decision === "revision"
            ? `${week.number}주차 과제 재제출 요청 (제출본 v${g.version})`
            : `${week.number}주차 과제 채점 결과 ${g.score ?? "-"}/${g.maxScore}점 (제출본 v${g.version})`,
        detail: g.feedback ? g.feedback.slice(0, 240) : undefined,
        comments: comments || undefined,
        href: `/weeks/${week.slug}/assignment`,
        at: g.gradedAt,
        isNew,
      });
    }
  }

  const conv = findConversation(userId);
  const chatUnread = unreadCount(conv, "member");
  const lastAdmin = conv ? [...conv.messages].reverse().find((m) => m.role === "admin") : undefined;
  if (lastAdmin) {
    items.push({
      id: `chat:${lastAdmin.id}`,
      kind: "chat",
      title: chatUnread > 0 ? `운영자의 새 메시지 ${chatUnread}개` : "운영자 채팅",
      detail: lastAdmin.text.slice(0, 200),
      href: "/chat",
      at: lastAdmin.createdAt,
      isNew: chatUnread > 0,
    });
  }
  items.sort((a, b) => b.at.localeCompare(a.at));

  const review: ReviewItem[] = [];
  const weakWorksheet: MemberFeedback["weakWorksheet"] = [];
  for (const week of WEEKS) {
    for (const section of getWeekOutline(week).sections) {
      const state = readSectionState(record, week.slug, section.id);
      let wrongChecks = 0;
      let recovered = 0;
      for (const c of section.meta.checks) {
        const s = state.checks[c.id];
        if (s && s.wrong.length > 0) {
          wrongChecks++;
          if (s.correct) recovered++;
        }
      }
      const weakAnswers = section.meta.quizIds.filter((id) => state.answers[id]?.review === "incorrect").length;
      if (wrongChecks > 0 || weakAnswers > 0) {
        review.push({
          weekNumber: week.number,
          weekSlug: week.slug,
          sectionNumber: section.number,
          sectionTitle: section.title,
          wrongChecks,
          recovered,
          weakAnswers,
          href: `/weeks/${week.slug}/quiz`,
        });
      }
    }
    const marks = readWorksheetState(record, week.slug).marks ?? {};
    const weak = Object.values(marks).filter((m) => m === "weak").length;
    if (weak > 0) weakWorksheet.push({ weekNumber: week.number, weekSlug: week.slug, count: weak });
  }
  // 아직 맞히지 못한 문제·보완 필요 서술형이 많은 단계부터
  review.sort((a, b) => b.wrongChecks - b.recovered + b.weakAnswers - (a.wrongChecks - a.recovered + a.weakAnswers));

  const newGrades = items.filter((i) => i.kind !== "chat" && i.isNew).length;
  return { items, newCount: newGrades + chatUnread, chatUnread, review, weakWorksheet, gradesTotal, gradesSeen };
}
