import { NextResponse } from "next/server";
import { OPERATOR_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const url = new URL("/", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.delete(OPERATOR_COOKIE);
  return res;
}
