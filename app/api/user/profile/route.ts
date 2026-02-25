import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/api/qfUserClient";
import { getSessionFromCookie, buildSessionCookieHeader } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const session = getSessionFromCookie(cookieHeader);
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to view profile." },
      { status: 401 },
    );
  }
  const result = await getProfile(session);
  if (!result.ok) {
    const status = result.status;
    const message =
      status === 403
        ? "Profile access was denied. Your app may need the “user” or “user.profile.read” scope enabled for this client by Quran Foundation."
        : "Unable to load profile.";
    return NextResponse.json(
      { error: message, status },
      { status },
    );
  }
  const response = NextResponse.json(result.data);
  if (result.session !== session && result.session.accessToken !== session.accessToken) {
    response.headers.set("Set-Cookie", buildSessionCookieHeader(result.session));
  }
  return response;
}
