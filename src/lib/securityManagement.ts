import "server-only";
import { findUserById } from "./userStore";
import { reviewSecurityCase, CASE_STATUS, type CaseStatus } from "./securityCases";
import { tx } from "./db";
import { BAN_MINUTES, removeIpRule, saveIpRule, setAutoBanEnabled } from "./ipRules";
import { isBannableIp, normalizeIp } from "./ipAddress";
import { recordSecurityEvent } from "./securityEvents";

const ERRORS: Record<string, string> = {
  CASE_NOTE_REQUIRED: "처리 완료·정상·오탐으로 분류할 때는 판단 사유를 입력해 주십시오.",
  INVALID_IP: "공인 IPv4 또는 IPv6 주소 하나를 입력해 주십시오. 내부·루프백·IP 대역은 등록하지 않습니다.",
  INVALID_DURATION: "차단·허용 기간을 선택해 주십시오.", REASON_REQUIRED: "사유를 입력해 주십시오.",
  SELF_BAN: "현재 접속한 본인 IP는 차단할 수 없습니다.",
  IP_UNAVAILABLE: "신뢰할 수 있는 본인 IP를 확인할 수 없어 차단을 저장하지 않았습니다. 프록시 설정을 확인해 주십시오.",
  RULE_LIMIT: "IP 규칙 500개 한도에 도달했습니다. 불필요한 규칙을 해제해 주십시오.",
};
export type SecurityChangeResult = { ok: boolean; message: string };

/** This boundary re-reads the actor from the DB; no role, actor or source is accepted from form fields. */
export function applySecurityChange(actorId: string, ownIp: string, data: FormData): SecurityChangeResult {
  if (findUserById(actorId)?.role !== "admin") throw new Error("FORBIDDEN");
  const value = (key: string) => typeof data.get(key) === "string" ? data.get(key) as string : "";
  const op = value("operation");
  try {
    return tx(() => {
      if (op === "case") {
        const id = value("caseId"), status = value("status");
        if (!/^[a-f0-9]{24}$/.test(id) || !Object.hasOwn(CASE_STATUS, status)) return { ok: false, message: "올바른 탐지 건과 상태를 선택해 주십시오." };
        if (!reviewSecurityCase(id, status, value("note"), actorId)) return { ok: false, message: "탐지 건을 찾지 못했습니다. 새로고침해 주십시오." };
        recordSecurityEvent("case_reviewed", { userId: actorId, detail: `탐지 ${id} · ${CASE_STATUS[status as CaseStatus]} · ${value("note").slice(0, 300)}` });
        return { ok: true, message: "대응 상태를 저장했습니다. 새 집계창에서 재발하면 다시 미확인으로 표시합니다." };
      }
      if (op === "policy") {
        const enabled = value("enabled");
        if (enabled !== "1" && enabled !== "0") return { ok: false, message: "올바른 정책을 선택해 주십시오." };
        setAutoBanEnabled(enabled === "1");
        recordSecurityEvent("security_policy_changed", { userId: actorId, detail: enabled === "1" ? "새 자동 차단 사용" : "새 자동 차단 중지" });
        return { ok: true, message: "자동 차단 설정을 저장했습니다. 기존 차단의 만료 시각은 유지됩니다." };
      }
      const ip = normalizeIp(value("ip"));
      if (!isBannableIp(ip)) throw new Error("INVALID_IP");
      if (op === "remove") {
        const removed = removeIpRule(ip, actorId);
        if (removed) recordSecurityEvent("ip_rule_removed", { ip, userId: actorId, detail: "운영자가 IP 규칙을 해제했습니다." });
        return { ok: true, message: removed ? "IP 규칙을 해제했습니다." : "이미 해제되었거나 만료된 규칙입니다." };
      }
      if (op !== "allow" && op !== "deny") return { ok: false, message: "올바른 작업을 선택해 주십시오." };
      if (op === "deny") {
        const own = normalizeIp(ownIp);
        if (process.env.TRUST_PROXY !== "1" || !isBannableIp(own)) throw new Error("IP_UNAVAILABLE");
        if (ip === own) throw new Error("SELF_BAN");
      }
      const minutes = Number(value("minutes"));
      if (!BAN_MINUTES.some((m) => m === minutes)) throw new Error("INVALID_DURATION");
      const rule = saveIpRule({ ip, mode: op, source: "manual", reason: value("reason"), actorId, minutes });
      recordSecurityEvent(op === "deny" ? "ip_banned" : "ip_allowed", { ip, userId: actorId,
        detail: `수동 ${op === "deny" ? "차단" : "허용"} · ${rule.reason} · 만료 ${rule.expires_at}` });
      return { ok: true, message: `IP ${op === "deny" ? "차단" : "허용"} 규칙을 저장했습니다.` };
    });
  } catch (err) {
    return { ok: false, message: err instanceof Error ? ERRORS[err.message] ?? "저장하지 못했습니다. 잠시 후 다시 시도해 주십시오." : "저장하지 못했습니다." };
  }
}
