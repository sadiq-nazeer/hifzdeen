import useSWR from "swr";
import { jsonFetcher } from "@/lib/http/fetcher";
import type { ChapterAudioTimestamp } from "@/lib/types/quran";

export type ChapterAudioEntry = {
  verseKey: string;
  orderInChapter: number;
  text: string;
  audioUrl: string;
  durationSeconds: number;
};

export type FullSurahAudio = {
  audioUrl: string;
  timestamps: ChapterAudioTimestamp[];
};

type ChapterAudioResponse = {
  chapter: {
    id: number;
    nameSimple: string;
    versesCount: number;
  };
  playlist: ChapterAudioEntry[];
  fullSurah?: FullSurahAudio;
};

type Params = {
  chapterId?: number;
  reciterId?: number;
  /** When true, API returns full-surah single audio URL + timestamps for continuous playback */
  fullSurah?: boolean;
  enabled?: boolean;
};

export const useChapterAudioPlaylist = ({
  chapterId,
  reciterId,
  fullSurah = false,
  enabled = true,
}: Params) => {
  const shouldFetch = Boolean(chapterId) && enabled;

  const search = new URLSearchParams();
  if (chapterId) {
    search.set("chapterId", String(chapterId));
  }
  if (reciterId) {
    search.set("reciterId", String(reciterId));
  }
  if (fullSurah) {
    search.set("fullSurah", "true");
  }

  const key = shouldFetch ? `/api/coach/chapter-audio?${search.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR<ChapterAudioResponse>(
    key,
    (url) => jsonFetcher<ChapterAudioResponse>(url),
    { revalidateOnFocus: false },
  );

  return {
    playlist: data?.playlist ?? [],
    fullSurahAudio: data?.fullSurah,
    chapterMeta: data?.chapter,
    isLoading: shouldFetch ? isLoading : false,
    isError: Boolean(error),
    error,
    mutate,
  };
};


