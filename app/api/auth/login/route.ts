import { NextResponse } from "next/server";
import { buildPendingAuthCookieHeader } from "@/lib/auth/pendingAuthCookie";
import { generatePkcePair } from "@/lib/auth/pkce";
import { getQfOAuthConfig } from "@/lib/auth/qfOAuthConfig";

// Request only scopes this client is allowed (QF config may restrict openid/user/collection)
const DEFAULT_SCOPE = "offline_access user collection openid";

export async function GET() {
  try {
    const config = getQfOAuthConfig();
    const { codeVerifier, codeChallenge, state, nonce } = generatePkcePair();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: DEFAULT_SCOPE,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${config.authBaseUrl}/oauth2/auth?${params.toString()}`;
    const cookieHeader = buildPendingAuthCookieHeader({
      state,
      nonce,
      codeVerifier,
      redirectUri: config.redirectUri,
    });

    const response = NextResponse.redirect(authUrl, { status: 302 });
    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
