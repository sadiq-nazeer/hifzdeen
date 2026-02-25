import useSWR from "swr";
import { jsonFetcher } from "@/lib/http/fetcher";
import type { CoachSessionVerse } from "@/lib/types/quran";

export type CoachBundleParams = {
  chapterId?: number;
  fromVerse?: number;
  toVerse?: number;
  perPage?: number;
  translationId?: number;
  translationEdition?: string;
  tafsirId?: number;
  reciterId?: number;
};

type CoachBundleResponse = {
  verses: CoachSessionVerse[];
};

const buildQueryString = (params: CoachBundleParams) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    search.set(key, String(value));
  });
  return search.toString();
};

export const useCoachBundle = (params: CoachBundleParams) => {
  const shouldFetch = Boolean(params.chapterId);
  const queryString = buildQueryString(params);
  const key = shouldFetch ? `/api/coach/bundle?${queryString}` : null;

  const { data, error, isLoading, mutate } = useSWR<CoachBundleResponse>(
    key,
    (url) =>
      jsonFetcher<CoachBundleResponse>(url, {
        // Large surahs (e.g. 286 verses) can take a long time to build; avoid abort timeout.
        timeoutMs: 90_000,
      }),
    {
      revalidateOnFocus: false,
    },
  );

  return {
    verses: data?.verses ?? [],
    isLoading: shouldFetch ? isLoading : false,
    isIdle: !shouldFetch,
    isError: Boolean(error),
    error,
    mutate,
  };
};

