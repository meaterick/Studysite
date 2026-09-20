import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST(req: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/", req.url));
}
