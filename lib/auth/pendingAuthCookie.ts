import "server-only";
import { createHmac } from "crypto";

const COOKIE_NAME = "qf_pending_auth";
const MAX_AGE_SECONDS = 600; // 10 minutes

export type PendingAuthPayload = {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
};

function getSecret(): string {
  const secret = process.env.QF_OAUTH_COOKIE_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing QF_OAUTH_COOKIE_SECRET. Set it in .env.local for user OAuth (e.g. openssl rand -hex 32).",
    );
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("base64url");
}

function verify(payload: string, signature: string, secret: string): boolean {
  const expected = sign(payload, secret);
  return expected.length === signature.length && timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function buildPendingAuthCookieHeader(payload: PendingAuthPayload): string {
  const secret = getSecret();
  const payloadStr = JSON.stringify(payload);
  const encoded = Buffer.from(payloadStr, "utf8").toString("base64url");
  const signature = sign(encoded, secret);
  const value = `${encoded}.${signature}`;
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildClearPendingAuthCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getAndClearPendingAuthFromCookie(cookieHeader: string | null): PendingAuthPayload | null {
  if (!cookieHeader) return null;
  const secret = getSecret();
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const raw = match?.[1]?.trim();
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot === -1) return null;
  const encoded = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!verify(encoded, signature, secret)) return null;
  try {
    const payloadStr = Buffer.from(encoded, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as PendingAuthPayload;
    if (
      typeof payload.state !== "string" ||
      typeof payload.nonce !== "string" ||
      typeof payload.codeVerifier !== "string" ||
      typeof payload.redirectUri !== "string"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
