import "server-only";
import { getQfOAuthConfig } from "@/lib/auth/qfOAuthConfig";
import { refreshAccessToken } from "@/lib/auth/refreshToken";
import type { SessionTokens } from "@/lib/auth/session";

const refreshLocks = new Map<string, Promise<SessionTokens | null>>();

async function refreshWithLock(session: SessionTokens): Promise<SessionTokens | null> {
  const key = session.refreshToken ?? session.accessToken;
  const existing = refreshLocks.get(key);
  if (existing) return existing;
  const promise = refreshAccessToken(session).finally(() => {
    refreshLocks.delete(key);
  });
  refreshLocks.set(key, promise);
  return promise;
}

export type UserApiResult<T> =
  | { ok: true; data: T; session: SessionTokens }
  | { ok: false; status: number; session: SessionTokens };

async function fetchUserApi<T>(
  session: SessionTokens,
  path: string,
  init?: RequestInit,
): Promise<UserApiResult<T>> {
  const config = getQfOAuthConfig();
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${base}/${cleanPath}`;
  const headers: Record<string, string> = {
    "x-auth-token": session.accessToken,
    "x-client-id": config.clientId,
    Accept: "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  if (res.status === 401 && session.refreshToken) {
    const newSession = await refreshWithLock(session);
    if (newSession) {
      const retryHeaders: Record<string, string> = {
        "x-auth-token": newSession.accessToken,
        "x-client-id": config.clientId,
        Accept: "application/json",
        ...((init?.headers as Record<string, string>) ?? {}),
      };
      const retryRes = await fetch(url, { ...init, headers: retryHeaders, cache: "no-store" });
      if (retryRes.ok) {
        const data = (await retryRes.json()) as T;
        return { ok: true, data, session: newSession };
      }
      return { ok: false, status: retryRes.status, session: newSession };
    }
  }
  if (res.ok) {
    const data = (await res.json()) as T;
    return { ok: true, data, session };
  }
  return { ok: false, status: res.status, session };
}

export type CollectionItem = {
  id: string;
  name?: string;
  [key: string]: unknown;
};

export type CollectionsResponse = {
  collections?: CollectionItem[];
  [key: string]: unknown;
};

export async function getCollections(
  session: SessionTokens,
  first = 10,
): Promise<UserApiResult<CollectionsResponse>> {
  return fetchUserApi<CollectionsResponse>(
    session,
    `auth/v1/collections?first=${Number(first)}`,
    { method: "GET" },
  );
}
