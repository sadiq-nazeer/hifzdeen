import { NextRequest, NextResponse } from "next/server";
import { buildClearSessionCookieHeader } from "@/lib/auth/session";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 302 });
  response.headers.set("Set-Cookie", buildClearSessionCookieHeader());
  return response;
}
