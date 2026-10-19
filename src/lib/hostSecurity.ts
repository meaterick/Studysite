import "server-only";
import { readSecuritySnapshot } from "./securitySnapshots";
import path from "node:path";
import { DATA_DIR } from "./dataDir";

export interface HostSecurity {
  version: 1; checkedAt: string; os: Record<string, string>; kernel: string;
  packages: Record<string, string>;
  listeners: { protocol: "tcp" | "udp"; port: number; scope: "loopback" | "all" | "interface"; process: string }[];
  tcpChecked: boolean; udpChecked: boolean; ssh: Record<string, string>; sshChecked: boolean;
  runnerIsRoot: boolean; runnerPasswordlessSudoAll: boolean | null;
}
const dictionary = (v: unknown): v is Record<string, string> => !!v && typeof v === "object" && !Array.isArray(v)
  && Object.entries(v).length <= 12 && Object.values(v).every((s) => typeof s === "string" && s.length <= 160);

/** Fixed private path only. No shell command is triggered by an HTTP request. */
export function hostSecuritySnapshot(): HostSecurity | null {
  return readSecuritySnapshot(path.join(DATA_DIR, "host-security.json"), (value): value is HostSecurity => {
    const v = value as HostSecurity;
    if (!v) return false;
    if (v.version !== 1 || typeof v.checkedAt !== "string" || !Number.isFinite(Date.parse(v.checkedAt))
      || typeof v.kernel !== "string" || v.kernel.length > 100 || !dictionary(v.os) || !dictionary(v.packages) || !dictionary(v.ssh)
      || ![v.tcpChecked, v.udpChecked, v.sshChecked, v.runnerIsRoot].every((b) => typeof b === "boolean")
      || ![true, false, null].includes(v.runnerPasswordlessSudoAll)
      || !Array.isArray(v.listeners) || v.listeners.length > 1024 || !v.listeners.every((r) => r && ["tcp", "udp"].includes(r.protocol)
        && Number.isInteger(r.port) && r.port > 0 && r.port <= 65535 && ["loopback", "all", "interface"].includes(r.scope)
        && typeof r.process === "string" && r.process.length <= 240)) return false;
    return true;
  });
}
