import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  computeCodeChallenge,
  generateRandomState,
  generateNonce,
  generatePkcePair,
} from "./pkce";

describe("pkce", () => {
  it("generateCodeVerifier returns base64url string of length 43", () => {
    const v = generateCodeVerifier();
    expect(typeof v).toBe("string");
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(v.length).toBe(43);
  });

  it("computeCodeChallenge is deterministic for same verifier", () => {
    const verifier = "a".repeat(43);
    const c1 = computeCodeChallenge(verifier);
    const c2 = computeCodeChallenge(verifier);
    expect(c1).toBe(c2);
    expect(c1).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generatePkcePair returns verifier, challenge, state, nonce", () => {
    const pair = generatePkcePair();
    expect(pair.codeVerifier).toBeDefined();
    expect(pair.codeChallenge).toBeDefined();
    expect(pair.state).toBeDefined();
    expect(pair.nonce).toBeDefined();
    expect(computeCodeChallenge(pair.codeVerifier)).toBe(pair.codeChallenge);
  });

  it("generateRandomState returns 32 hex characters", () => {
    const state = generateRandomState();
    expect(state).toMatch(/^[0-9a-f]{32}$/);
  });

  it("generateNonce returns 32 hex characters", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
  });
});
