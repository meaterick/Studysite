import type { Metadata } from "next";
import LessonScreen from "@/components/lesson/LessonScreen";
import { MODULES, getModuleLesson } from "@/content/course";

export function generateStaticParams() {
  return MODULES.flatMap((m) => m.lessons.map((l) => ({ module: m.slug, lesson: l.id })));
}

export async function generateMetadata({ params }: PageProps<"/modules/[module]/practice/[lesson]">): Promise<Metadata> {
  const { module, lesson } = await params;
  const found = getModuleLesson(module, lesson);
  return found ? { title: `실습 · ${found.lesson.title} · ${found.module.code} ${found.module.title}` } : {};
}

export default async function PracticePage({ params }: PageProps<"/modules/[module]/practice/[lesson]">) {
  const { module, lesson } = await params;
  return <LessonScreen slug={module} lessonId={lesson} practice />;
}
