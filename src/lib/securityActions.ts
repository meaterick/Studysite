"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { requireAdmin } from "./dal";
import { securityRequest } from "./securityEvents";
import { applySecurityChange, type SecurityChangeResult } from "./securityManagement";

export async function manageSecurity(_previous: SecurityChangeResult, formData: FormData): Promise<SecurityChangeResult> {
  const admin = await requireAdmin("/operator/security");
  const own = securityRequest({ headers: await headers() }).ip ?? "";
  const result = applySecurityChange(admin.id, own, formData);
  if (result.ok) refresh();
  return result;
}
