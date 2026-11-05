import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { courseProgress } from "@/lib/study";
import { lessonHref } from "@/lib/routes";
import { CORE_PATH } from "@/content/course";
import { loginHref } from "@/lib/returnPath";

/** 커리큘럼의 "지금 할 수 있는 일": 로그인 전에는 시작하기, 로그인 후에는 필수 경로의 다음 레슨으로 이어 가기 */
export default async function HomeCta() {
  const user = await getCurrentUser();
  const first = CORE_PATH[0];
  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link href={loginHref(lessonHref(first.module, first.id))} className="btn btn-primary">
          Google 계정으로 시작하기
        </Link>
        <Link href="/#fields" className="btn btn-secondary">
          분야별로 둘러보기
        </Link>
      </div>
    );
  }
  const next = courseProgress(getLearningRecord(user.id)).next;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={next ? lessonHref(next.module, next.id) : "/progress"} className="btn btn-primary">
        {next ? "이어서 학습하기" : "내 진도 보기"}
      </Link>
      <Link href="/#fields" className="btn btn-secondary">
        분야별로 둘러보기
      </Link>
    </div>
  );
}
