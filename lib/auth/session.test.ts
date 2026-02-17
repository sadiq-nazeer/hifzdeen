import { describe, it, expect } from "vitest";
import { decodeIdTokenClaims } from "./session";

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("decodeIdTokenClaims", () => {
  it("returns null for null or empty", () => {
    expect(decodeIdTokenClaims(null)).toBeNull();
    expect(decodeIdTokenClaims("")).toBeNull();
  });

  it("returns null for invalid JWT shape", () => {
    expect(decodeIdTokenClaims("a")).toBeNull();
    expect(decodeIdTokenClaims("a.b")).toBeNull();
  });

  it("returns name and email from valid JWT payload", () => {
    const payload = JSON.stringify({
      sub: "user-123",
      name: "Test User",
      email: "test@example.com",
    });
    const header = base64UrlEncode('{"alg":"HS256"}');
    const sig = base64UrlEncode("sig");
    const idToken = `${header}.${base64UrlEncode(payload)}.${sig}`;
    const claims = decodeIdTokenClaims(idToken);
    expect(claims).toEqual({ name: "Test User", email: "test@example.com" });
  });

  it("returns null when payload has no name or email", () => {
    const payload = JSON.stringify({ sub: "user-123" });
    const header = base64UrlEncode("{}");
    const idToken = `${header}.${base64UrlEncode(payload)}.x`;
    expect(decodeIdTokenClaims(idToken)).toBeNull();
  });
});
