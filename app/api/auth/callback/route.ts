import { NextRequest, NextResponse } from "next/server";
import { getAndClearPendingAuthFromCookie, buildClearPendingAuthCookieHeader } from "@/lib/auth/pendingAuthCookie";
import { getQfOAuthConfig } from "@/lib/auth/qfOAuthConfig";
import { buildSessionCookieHeader } from "@/lib/auth/session";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

function redirectHome(request: NextRequest, extraCookies: string[] = []): NextResponse {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 302 });
  response.headers.append("Set-Cookie", buildClearPendingAuthCookieHeader());
  for (const c of extraCookies) {
    response.headers.append("Set-Cookie", c);
  }
  return response;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return redirectHome(request);
  }

  if (!code || !state) {
    return redirectHome(request);
  }

  const cookieHeader = request.headers.get("cookie");
  const pending = getAndClearPendingAuthFromCookie(cookieHeader);
  if (!pending) {
    return redirectHome(request);
  }
  if (pending.state !== state) {
    return redirectHome(request);
  }

  try {
    const config = getQfOAuthConfig();
    if (pending.redirectUri !== config.redirectUri) {
      return redirectHome(request);
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: pending.codeVerifier,
    });

    const tokenRes = await fetch(`${config.authBaseUrl}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      return redirectHome(request);
    }

    const data = (await tokenRes.json()) as TokenResponse;
    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);

    const sessionCookie = buildSessionCookieHeader({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      idToken: data.id_token ?? null,
      expiresAt,
      scope: data.scope,
    });

    return redirectHome(request, [sessionCookie]);
  } catch {
    return redirectHome(request);
  }
}
