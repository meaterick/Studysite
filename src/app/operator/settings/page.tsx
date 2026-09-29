import Link from "next/link";
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
      <Link href="/operator" className="text-sm font-bold text-[var(--series-orange)] hover:underline">
        ← 운영자 대시보드
      </Link>
      <h1 className="mt-5 mb-2 text-3xl font-black text-ink">운영 설정</h1>
      <p className="mb-8 text-sm text-ink-secondary">스터디원 전체에 바로 적용됩니다.</p>
      <SettingsForm
        mode={settings.progressionMode}
        weeks={WEEKS.map((w) => ({ slug: w.slug, number: w.number, title: w.title }))}
        dueDates={settings.dueDates}
      />
    </div>
  );
}
