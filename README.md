## HifzDeen

HifzDeen highlights sustainable engineering, creative UX, and thorough documentation. Iteration 1 focuses on an **Interactive Memorization & Recitation Coach**, with deliberate hooks for a deep-study companion and narrative journey modes.

### Features (Iteration 1 scope)
- OAuth2-authenticated access to Quran.Foundation Content APIs with typed data helpers.
- User auth via Quran Foundation OAuth2 (Authorization Code + PKCE): sign in, sign out, and optional User APIs (e.g. collections). Anonymous coach use remains fully supported.
- Guided listen → whisper → recite → review loop, optimized for memorization drills.
- Audio tooling (looping, playback speed, metronome cues) and reflective prompts seeded from translations/tafsir.
- Lightweight telemetry on bundle size and API usage to reinforce sustainability goals.

### Project Structure
- `app/` – App Router routes, layouts, and page-level UX.
- `components/` – Reusable UI + headless logic for coach, pickers, feedback, and prompts.
- `lib/` – Config, API client, domain types, caching utilities, browser storage helpers, and `lib/auth/` for user OAuth (PKCE, session, refresh).
- `docs/` – Product vision, architecture metrics, and project documentation.
- `tests/` – Unit/integration tests (Vitest + React Testing Library) and Playwright e2e flows.

### Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   - Duplicate `.env.example` to `.env.local`.
   - Fill in `QF_CLIENT_ID` and `QF_CLIENT_SECRET` from the [API Quick Start guide](https://api-docs.quran.foundation/docs/quickstart/).
   - For **user sign-in** and User APIs (e.g. collections): set `QF_OAUTH_REDIRECT_URI` and `QF_OAUTH_COOKIE_SECRET`, and register your callback URL with Quran Foundation. See **[User OAuth setup](docs/setup/user-oauth.md)** for step-by-step instructions.
3. **Run in development**
```bash
npm run dev
   ```
4. **Lint & test**
   ```bash
   npm run lint
   npm run typecheck
   npm run test          # Vitest unit tests (e.g. auth PKCE, session)
   npm run test:e2e      # Playwright smoke suites (when added)
   ```

### Sustainability & Tooling Notes
- Strict ESLint config (no `any`, hooks rules, import ordering) plus Prettier formatting.
- SWR-based data hooks with caching + request deduplication to minimize API load.
- Bundle analyzer script for periodic review of client payloads.

### Roadmap
- **Now**: deliver the Interactive Memorization Coach end-to-end.
- **Next**: integrate tafsir/translation overlays for a Deep Study Companion.
- **Later**: craft the Narrative Journey UX with thematic progress arcs.

For more context, see `docs/product/vision.md`.
