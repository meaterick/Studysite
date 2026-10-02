import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/dal";
import { getSettings } from "@/lib/settingsStore";
import { WEEKS } from "@/content/weeks";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "운영 설정" };

export default async function OperatorSettingsPage() {
  await requireAdmin("/operator/settings");
  const settings = getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader tone="operator" eyebrow="운영자" title="운영 설정" description="스터디원 전체에 바로 적용됩니다." />
      <SettingsForm
        mode={settings.progressionMode}
        weeks={WEEKS.map((w) => ({ slug: w.slug, number: w.number, title: w.title }))}
        dueDates={settings.dueDates}
      />
    </div>
  );
}
