import "server-only";

export type QfEnv = "prelive" | "production";

const ENV_URLS: Record<QfEnv, { authBaseUrl: string; apiBaseUrl: string }> = {
  prelive: {
    authBaseUrl: "https://prelive-oauth2.quran.foundation",
    apiBaseUrl: "https://apis-prelive.quran.foundation",
  },
  production: {
    authBaseUrl: "https://oauth2.quran.foundation",
    apiBaseUrl: "https://apis.quran.foundation",
  },
};

function parseEnv(raw: string | undefined): QfEnv {
  const v = (raw ?? "prelive").toLowerCase();
  if (v === "production") return "production";
  return "prelive";
}

export type QfOAuthConfig = {
  env: QfEnv;
  clientId: string;
  clientSecret: string | undefined;
  authBaseUrl: string;
  apiBaseUrl: string;
  redirectUri: string;
};

export function getQfOAuthConfig(): QfOAuthConfig {
  const clientId = process.env.QF_CLIENT_ID;
  if (!clientId || clientId.trim() === "") {
    throw new Error(
      "Missing Quran Foundation API credentials. Request access: https://api-docs.quran.foundation/request-access",
    );
  }
  const env = parseEnv(process.env.QF_ENV);
  const { authBaseUrl, apiBaseUrl } = ENV_URLS[env];
  const redirectUri = process.env.QF_OAUTH_REDIRECT_URI?.trim();
  if (!redirectUri) {
    throw new Error(
      "Missing QF_OAUTH_REDIRECT_URI. Set it in .env.local (e.g. http://localhost:3000/api/auth/callback).",
    );
  }
  const clientSecret = process.env.QF_CLIENT_SECRET?.trim();
  return {
    env,
    clientId,
    clientSecret: clientSecret === "" ? undefined : clientSecret,
    authBaseUrl,
    apiBaseUrl,
    redirectUri,
  };
}
