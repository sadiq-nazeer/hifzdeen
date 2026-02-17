import "server-only";
import { getQfOAuthConfig } from "@/lib/auth/qfOAuthConfig";
import type { SessionTokens } from "@/lib/auth/session";

type RefreshResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

export async function refreshAccessToken(session: SessionTokens): Promise<SessionTokens | null> {
  if (!session.refreshToken) return null;
  try {
    const config = getQfOAuthConfig();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
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
    const res = await fetch(`${config.authBaseUrl}/oauth2/token`, {
      method: "POST",
      headers,
      body: body.toString(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RefreshResponse;
    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? session.refreshToken,
      idToken: data.id_token ?? session.idToken,
      expiresAt,
      scope: data.scope,
    };
  } catch {
    return null;
  }
}
