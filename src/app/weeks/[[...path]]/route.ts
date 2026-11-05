import { NextResponse, type NextRequest } from "next/server";
import { getLesson, getModule } from "@/content/course";
import { LEGACY_STAGE_LESSON, LEGACY_WEEK_ASSIGNMENT_MODULE } from "@/content/curriculum/legacy";
import { assignmentHref, lessonHref } from "@/lib/routes";
import { publicOrigin } from "@/lib/publicOrigin";

// 예전 8주 구성의 주소(/weeks/...)를 새 위치로 보낸다. 즐겨찾기나 예전 안내문의 링크가 끊기지 않게 하려는 것이다.
// - /weeks/<주차>/sections/<단계> → 그 단계를 이어받은 레슨
// - /weeks/<주차>/assignment → 그 주차 과제를 이어받은 모듈의 과제
// - 그 밖의 주소(주차 개요·실습·퀴즈·백지공부 등) → 커리큘럼

function legacyTarget(path: string[]): string {
  const [week, page, id] = path;
  if (page === "sections" && id) {
    const lesson = getLesson(LEGACY_STAGE_LESSON[id] ?? "");
    if (lesson) return lessonHref(lesson.module, lesson.id);
  }
  if (page === "assignment" && week) {
    const mod = getModule(LEGACY_WEEK_ASSIGNMENT_MODULE[week] ?? "");
    if (mod?.assignment) return assignmentHref(mod.slug);
  }
  return "/curriculum";
}

export async function GET(req: NextRequest, ctx: RouteContext<"/weeks/[[...path]]">) {
  const { path = [] } = await ctx.params;
  return NextResponse.redirect(new URL(legacyTarget(path), publicOrigin(req)), 308);
}
