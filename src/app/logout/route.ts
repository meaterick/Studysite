import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { recordSecurityEvent, securityRequest } from "@/lib/securityEvents";
import { publicOrigin } from "@/lib/publicOrigin";

export async function POST(req: Request) {
  if (req.headers.get("origin") !== publicOrigin(req)) {
    recordSecurityEvent("csrf_rejected", { ...securityRequest(req), status: 403 });
    return new NextResponse(null, { status: 403 });
  }
  await deleteSession();
  return NextResponse.redirect(new URL("/", publicOrigin(req)), 303);
}
