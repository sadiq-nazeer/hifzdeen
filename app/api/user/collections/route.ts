import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie, buildSessionCookieHeader } from "@/lib/auth/session";
import { getCollections } from "@/lib/api/qfUserClient";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const session = getSessionFromCookie(cookieHeader);
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to view collections." },
      { status: 401 },
    );
  }
  const result = await getCollections(session);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Unable to load collections." },
      { status: result.status },
    );
  }
  const response = NextResponse.json(result.data);
  if (result.session !== session && result.session.accessToken !== session.accessToken) {
    response.headers.set("Set-Cookie", buildSessionCookieHeader(result.session));
  }
  return response;
}
