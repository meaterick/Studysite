import "server-only";
import { pruneSecurityCases } from "./securityCases";
import { startHostTelemetryMonitor } from "./hostTelemetry";
import { validateSecurityConfig } from "./securityConfig";
import { pruneSecurityEvents } from "./securityEvents";
import { pruneIpDefense } from "./ipRules";
import { startSecurityEdgeMonitor } from "./securityEdgeMonitor";
import { ensureDb } from "./db";
import { hasLegacyFiles, importLegacyJson, startLegacyCatchUp } from "./legacyImport";
import { startBackupSchedule } from "./backup";

// 서버가 요청을 받기 전에 한 번 실행한다(src/instrumentation.ts): DB를 열어 마이그레이션을 끝내고,
// 예전 JSON 저장소가 남아 있으면 가져온 뒤, 정기 백업을 예약한다.
// 여기서 실패하면 서버가 시작되지 않아 배포 스크립트의 상태 확인이 실패하고 이전 버전이 계속 서비스한다.
export function startDataServices(): void {
  const g = globalThis as unknown as { __aegisDataServices?: boolean };
  if (g.__aegisDataServices) return;

  validateSecurityConfig();
  ensureDb();
  pruneSecurityEvents();
  pruneIpDefense();
  pruneSecurityCases();
  startHostTelemetryMonitor();
  startSecurityEdgeMonitor();
  const pruneTimer = setInterval(() => {
    try { pruneSecurityEvents(); pruneIpDefense(); pruneSecurityCases(); } catch { console.error("[security] retention cleanup unavailable"); }
  }, 60 * 60_000);
  pruneTimer.unref();
  if (hasLegacyFiles()) {
    const report = importLegacyJson();
    console.log("[legacy-import] imported legacy JSON data into the database", report);
    startLegacyCatchUp();
  }
  startBackupSchedule();
  g.__aegisDataServices = true;
}
