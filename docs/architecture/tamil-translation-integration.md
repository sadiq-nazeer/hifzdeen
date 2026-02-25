# Tamil and Sinhala Translation Integration – API Provider Switching

## Summary

**Implemented.** Tamil and Sinhala translations are integrated with an env-configurable switch between `QF_CONTENT_API` (Quran Foundation) + api.quran.com legacy and `https://api.alquran.cloud/v1`. QF remains primary for verses, words, and audio; translations are sourced by provider:

- **qf_with_legacy:** Sahih (EN) and Tamil via QF/legacy; Sinhala not supported.
- **alquran:** Tamil (`ta.tamil`) and Sinhala (`si.naseemismail`) from alquran.cloud; Sahih still via QF/legacy.

---

## alquran.cloud: Text and Audio Editions

The [editions API](https://api.alquran.cloud/v1/edition) returns **both text and audio** editions:

| Format | Type | Examples |
|--------|------|----------|
| **text** | `translation`, `tafsir`, `quran` | `ta.tamil`, `en.sahih`, `quran-uthmani` |
| **audio** | `versebyverse`, `translation` | `ar.alafasy`, `ar.husary`, `ar.abdurrahmaansudais`, `ar.mahermuaiqly` |

So alquran.cloud also provides **recitation audio** from many reciters (e.g. Alafasy, Husary, Sudais, Minshawi, Abdul Basit). Audio is requested by **edition identifier** (e.g. `ar.alafasy` for Mishary Alafasy), not by a separate “reciter list” like QF. Endpoints like `/surah/{surah}/{edition}` and `/ayah/{reference}/{edition}` return audio URLs when the edition is an audio edition.

---

## Current Architecture

| Component | Source | Notes |
|-----------|--------|------|
| Chapters, verses (Arabic), words, audio | `QF_CONTENT_API_BASE_URL` | OAuth client credentials required |
| Translations | QF primary → **api.quran.com** fallback | Uses numeric `translationId` (e.g. 20 = Sahih International) |
| Reciters | QF | |

---

## Tamil and Sinhala Availability

| API | Tamil | Sinhala | Edition/ID |
|-----|-------|---------|------------|
| **Quran Foundation** | Unknown | No | Numeric `translationId` |
| **api.quran.com** (legacy fallback) | ✅ Yes | No | `50` (Jan Trust) |
| **api.alquran.cloud** | ✅ Yes | ✅ Yes | `ta.tamil`, `si.naseemismail` (Naseem Ismail) |

---

## API Response Comparison

### QF / Quran.com (current)

```json
{
  "translations": [{
    "resource_id": 50,
    "verse_key": "1:1",
    "text": "அளவற்ற அருளாளன்...",
    "language_name": "tamil",
    "resource_name": "Jan Trust Foundation"
  }]
}
```

### alquran.cloud

```json
{
  "data": [{
    "number": 1,
    "ayahs": [{
      "number": 1,
      "numberInSurah": 1,
      "text": "அளவற்ற அருளாளன்..."
    }],
    "edition": {
      "identifier": "ta.tamil",
      "language": "ta",
      "englishName": "Jan Turst Foundation"
    }
  }]
}
```

---

## Implementation Options

### Option A: Use Quran.com Legacy for Tamil (minimal change)

The existing `fetchTranslationsByVerseKeys` in `qfClient.ts` already falls back to `api.quran.com` when QF fails. Quran.com has Tamil (id 50).

**Changes:**
1. Add Tamil (id 50) as a selectable translation in `CoachConfigurator`.
2. Ensure the legacy response is mapped correctly (Quran.com returns `meta` separately; may need to merge into each translation for `resource_name` / `language_name`).

**Pros:** No new API, no env switching.  
**Cons:** Depends on Quran.com; no env-based provider choice.

---

### Option B: Env-Based Translation Provider Switching (recommended)

Add env vars to switch translation source:

| Env | Purpose | Default |
|-----|---------|---------|
| `TRANSLATION_PROVIDER` | `qf` \| `alquran` \| `qf_with_legacy` | `qf_with_legacy` |
| `ALQURAN_API_BASE_URL` | alquran.cloud base | `https://api.alquran.cloud/v1` |

**Flow:**
- `qf`: Use QF + Quran.com legacy only (current behavior).
- `alquran`: Use alquran.cloud for all translations (by edition).
- `qf_with_legacy`: Use QF first, then Quran.com legacy (current).

**Implementation:**

1. **`lib/config.ts`** – Add optional env vars:

```ts
translationProvider: (process.env.TRANSLATION_PROVIDER ?? "qf_with_legacy") as "qf" | "alquran" | "qf_with_legacy",
alquranApiBaseUrl: process.env.ALQURAN_API_BASE_URL ?? "https://api.alquran.cloud/v1",
```

2. **`lib/api/alquranClient.ts`** (new) – Fetch surah by edition:

```ts
// GET /surah/{chapterId}/{edition}` or `/surah/{chapterId}/editions/quran-uthmani,{edition}`
// Map to TranslationSnippet[] keyed by verse_key (chapter:numberInSurah)
```

3. **`lib/api/translationService.ts`** (new) – Provider abstraction:

```ts
export async function fetchTranslations(
  verseKeys: string[],
  translationId?: number,
  translationEdition?: string
): Promise<Map<string, TranslationSnippet>> {
  if (translationEdition && config.translationProvider === "alquran") {
    return alquranFetchTranslations(verseKeys, translationEdition);
  }
  if (translationId) {
    return qfFetchTranslationsByVerseKeys(verseKeys, translationId);
  }
  return new Map();
}
```

4. **Extend `CoachBundleParams`** – Support edition-based selection:

```ts
translationId?: number;   // QF/Quran.com
translationEdition?: string;  // alquran: "ta.tamil", "en.asad"
```

5. **UI** – Translation selector with:
   - Sahih International (EN) – `translationId: 20`
   - Tamil (Jan Trust) – `translationEdition: "ta.tamil"` when provider is alquran, or `translationId: 50` when using legacy.

---

### Option C: Full or Partial Content API Switching

alquran.cloud provides:

- **Text:** translations, tafsir, Quran text (by edition).
- **Audio:** many reciters via **audio editions** (e.g. `ar.alafasy`, `ar.husary`, `ar.abdurrahmaansudais`). Same [editions list](https://api.alquran.cloud/v1/edition); filter by `format=audio` and `type=versebyverse` (or `translation`).

So you *can* use alquran.cloud for **verse/surah audio** (by edition) as well as translations. Limitations vs QF:

- **No word-by-word audio** in alquran.cloud.
- **No chapter-level audio with verse timestamps** in the same format as QF (coach flow relies on this).
- Reciters are **edition identifiers** (e.g. `ar.alafasy`), not a separate reciter list with IDs.

A **full** switch would require reworking reciter selection (edition-based) and coach chapter-audio (if alquran exposes timestamps elsewhere). A **hybrid** is still the safest: QF for chapters, verses, words, and coach audio; alquran for translations and optionally for an alternate audio source (e.g. by edition).

---

## Implementation (Option B)

Implemented as described in Option B. Config:

```env
TRANSLATION_PROVIDER=qf_with_legacy
NEXT_PUBLIC_TRANSLATION_PROVIDER=qf_with_legacy
ALQURAN_API_BASE_URL=https://api.alquran.cloud/v1
```

Set `TRANSLATION_PROVIDER=alquran` and `NEXT_PUBLIC_TRANSLATION_PROVIDER=alquran` to enable Tamil and Sinhala via alquran.cloud.

---

## File Changes Summary

| File | Change |
|------|--------|
| `lib/config.ts` | Add `translationProvider`, `alquranApiBaseUrl` |
| `lib/api/alquranClient.ts` | New – fetch surah by edition, map to `TranslationSnippet` |
| `lib/api/qfClient.ts` | Branch on provider + `translationEdition`; call alquran client when applicable |
| `lib/hooks/useCoachBundle.ts` | Add `translationEdition?: string` |
| `app/api/coach/bundle/route.ts` | Accept `translationEdition` query param |
| `components/coach/CoachConfigurator.tsx` | Translation selector: None, Sahih (EN), Tamil, Sinhala (when alquran) |
| `.env.example` | Document `TRANSLATION_PROVIDER`, `NEXT_PUBLIC_TRANSLATION_PROVIDER`, `ALQURAN_API_BASE_URL` |
