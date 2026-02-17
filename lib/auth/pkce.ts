import { randomBytes, createHash } from "crypto";

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

export function computeCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier, "utf8").digest();
  return base64UrlEncode(hash);
}

export function generateRandomState(): string {
  return randomBytes(16).toString("hex");
}

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

export function generatePkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  nonce: string;
} {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = computeCodeChallenge(codeVerifier);
  const state = generateRandomState();
  const nonce = generateNonce();
  return { codeVerifier, codeChallenge, state, nonce };
}
