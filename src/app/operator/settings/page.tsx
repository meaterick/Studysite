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
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title="운영 설정" />
      <SettingsForm
        mode={settings.progressionMode}
        weeks={WEEKS.map((w) => ({ slug: w.slug, number: w.number, title: w.title }))}
        dueDates={settings.dueDates}
      />
    </div>
  );
}
