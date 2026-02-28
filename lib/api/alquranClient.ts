import "server-only";

import { appConfig } from "@/lib/config";
import type { TranslationSnippet } from "@/lib/types/quran";

type AlquranSurahResponse = {
  code: number;
  status: string;
  data?: {
    number: number;
    ayahs: Array<{
      number: number;
      numberInSurah: number;
      text: string;
    }>;
    edition?: {
      identifier: string;
      language: string;
      englishName: string;
      name?: string;
    };
  };
};

/** Stable numeric id for TranslationSnippet from edition identifier. */
const editionToId = (edition: string): number => {
  const map: Record<string, number> = {
    "ta.tamil": 1001,
    "si.naseemismail": 1002,
    "fr.hamidullah": 1003,
    "es.cortes": 1004,
    "ur.jalandhry": 1005,
    "id.indonesian": 1006,
    "hi.hindi": 1007,
  };
  return map[edition] ?? Math.abs(edition.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
};

/** Map language code to display name. */
const languageCodeToName = (code: string): string => {
  const names: Record<string, string> = {
    ta: "Tamil",
    si: "Sinhala",
    en: "English",
    fr: "French",
    es: "Spanish",
    ur: "Urdu",
    id: "Indonesian",
    hi: "Hindi",
  };
  return names[code] ?? code;
};

/**
 * Fetch a surah translation from alquran.cloud by edition.
 * Returns a map of verseKey -> TranslationSnippet for merging into coach bundle.
 */
export async function fetchSurahTranslation(
  chapterId: number,
  edition: string,
): Promise<Map<string, TranslationSnippet>> {
  const baseUrl = appConfig.alquranApiBaseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/surah/${chapterId}/${edition}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: {
      revalidate: 3600,
      tags: [`alquran-${chapterId}-${edition}`],
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `alquran.cloud request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  const payload = (await response.json()) as AlquranSurahResponse;

  if (!payload.data?.ayahs?.length) {
    return new Map();
  }

  const { ayahs, edition: editionMeta } = payload.data;
  const resourceName = editionMeta?.englishName ?? editionMeta?.name ?? edition;
  const languageName = languageCodeToName(editionMeta?.language ?? "en");
  const id = editionToId(edition);

  const map = new Map<string, TranslationSnippet>();

  for (const ayah of ayahs) {
    const verseKey = `${chapterId}:${ayah.numberInSurah}`;
    map.set(verseKey, {
      id,
      verseKey,
      text: ayah.text?.trim() ?? "",
      languageName,
      resourceName,
    });
  }

  return map;
}
