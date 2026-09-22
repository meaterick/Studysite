import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { publicOrigin } from "@/lib/publicOrigin";

export async function POST(req: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/", publicOrigin(req)));
}
