# User authentication (Quran Foundation OAuth2)

User sign-in uses Quran Foundation’s OAuth2 **Authorization Code** flow with **PKCE**. Content APIs continue to use **Client Credentials** (see `lib/api/qfClient.ts`).

## Flow

1. User clicks **Sign in** → `GET /api/auth/login` builds PKCE challenge, stores `state`, `nonce`, `code_verifier` in a signed cookie, redirects to `{authBaseUrl}/oauth2/auth`.
2. User signs in at Quran Foundation and is redirected back to `QF_OAUTH_REDIRECT_URI` with `code` and `state`.
3. `GET /api/auth/callback` validates `state`, exchanges `code` + `code_verifier` at `/oauth2/token`, stores tokens in an encrypted session cookie, redirects to `/`.
4. Authenticated User API calls use `lib/api/qfUserClient.ts` with `x-auth-token` and `x-client-id`. On 401, one refresh (if `refresh_token` exists) and one retry; refresh is locked per session to avoid stampede.

## Config

- **User OAuth** (optional): `QF_OAUTH_REDIRECT_URI`, `QF_OAUTH_COOKIE_SECRET`, and optionally `QF_ENV` (`prelive` | `production`). See `.env.example` and [Quran Foundation OAuth2 docs](https://api-docs.quran.foundation/docs/tutorials/oidc/getting-started-with-oauth2).
- Tokens are stored in an encrypted httpOnly cookie; `QF_OAUTH_COOKIE_SECRET` is used for signing (pending auth) and encryption (session). Never log tokens or the secret.

## Key modules

- `lib/auth/qfOAuthConfig.ts` – env and base URLs.
- `lib/auth/pkce.ts` – code verifier/challenge, state, nonce.
- `lib/auth/pendingAuthCookie.ts` – signed cookie for OAuth redirect state.
- `lib/auth/session.ts` – encrypted session cookie, ID token claims for display.
- `lib/auth/refreshToken.ts` – refresh at `/oauth2/token`.
- `lib/api/qfUserClient.ts` – User API client with refresh-once and retry-once.

## Local testing (prelive)

1. Set `QF_ENV=prelive`, `QF_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback`, and `QF_OAUTH_COOKIE_SECRET`.
2. Ensure your Quran Foundation app has `http://localhost:3000/api/auth/callback` registered as a redirect URI.
3. Run `npm run dev`, open `/`, click **Sign in**, complete the flow, then try **Collections**.
