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

function redirectHome(request: NextRequest, extraCookies: string[] = [], failed = false): NextResponse {
  const url = new URL("/", request.url);
  if (failed) url.searchParams.set("signin", "failed");
  const response = NextResponse.redirect(url, { status: 302 });
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
    return redirectHome(request, [], true);
  }

  if (!code || !state) {
    return redirectHome(request, [], true);
  }

  const cookieHeader = request.headers.get("cookie");
  const pending = getAndClearPendingAuthFromCookie(cookieHeader);
  if (!pending) {
    return redirectHome(request, [], true);
  }
  if (pending.state !== state) {
    return redirectHome(request, [], true);
  }

  try {
    const config = getQfOAuthConfig();
    if (pending.redirectUri !== config.redirectUri) {
      return redirectHome(request, [], true);
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      code_verifier: pending.codeVerifier,
    });
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (config.clientSecret) {
      const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
      headers.Authorization = `Basic ${auth}`;
    } else {
      body.set("client_id", config.clientId);
    }

    const tokenRes = await fetch(`${config.authBaseUrl}/oauth2/token`, {
      method: "POST",
      headers,
      body: body.toString(),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      return redirectHome(request, [], true);
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
    return redirectHome(request, [], true);
  }
}
