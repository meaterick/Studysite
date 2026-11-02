import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/dal";
import { getSettings } from "@/lib/settingsStore";
import { MODULES } from "@/content/course";
import { SCHEDULE } from "@/content/curriculum/schedule";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "운영 설정" };

export default async function OperatorSettingsPage() {
  await requireAdmin("/operator/settings");
  const settings = getSettings();
  // 기본 일정표에서 과제를 내는 주 차(마감일을 정할 때 참고)
  const dueWeek = new Map(SCHEDULE.flatMap((w) => w.due.map((key) => [key, w.week] as const)));
  const assignments = MODULES.flatMap((m) =>
    m.assignment ? [{ key: m.assignment.key, code: m.code, title: m.assignment.title, week: dueWeek.get(m.assignment.key) }] : []
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="운영 설정" />
      <SettingsForm mode={settings.progressionMode} cohortStart={settings.cohortStart} assignments={assignments} dueDates={settings.dueDates} />
    </div>
  );
}
