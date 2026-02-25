"use client";

import { BookOpen, ChevronDown, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { FullSurahText } from "@/components/quran/FullSurahText";
import { SurahLoadingSkeleton } from "@/components/quran/SurahLoadingSkeleton";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { useChapters } from "@/lib/hooks/useChapters";
import { useCoachBundle } from "@/lib/hooks/useCoachBundle";
import type { CoachBundleParams } from "@/lib/hooks/useCoachBundle";
import { readReciteProgress } from "@/lib/storage/reciteProgress";

const SAHIH_INTERNATIONAL_ID = 20;
const TAMIL_LEGACY_ID = 50;
const TAMIL_EDITION = "ta.tamil";
const SINHALA_EDITION = "si.naseemismail";

type TranslationChoice = "none" | "english" | "tamil" | "sinhala";

const isAlquranProvider = (): boolean =>
  process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER === "alquran";

export default function RecitePage() {
  const { chapters } = useChapters();
  const [params, setParams] = useState<CoachBundleParams>({
    chapterId: undefined,
    fromVerse: 1,
    toVerse: 1,
    translationId: undefined,
    translationEdition: undefined,
  });

  const effectiveChapterId = params.chapterId ?? chapters[0]?.id;

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === effectiveChapterId),
    [chapters, effectiveChapterId],
  );

  // Fetch all verses for the selected chapter
  const fetchParams = useMemo(() => {
    if (!effectiveChapterId || !selectedChapter) {
      return null;
    }
    return {
      ...params,
      chapterId: effectiveChapterId,
      fromVerse: 1,
      toVerse: selectedChapter.versesCount,
      perPage: 286, // Max verses in any surah
    };
  }, [effectiveChapterId, params, selectedChapter]);

  const { verses, isLoading, isError, error } = useCoachBundle(
    fetchParams ?? { chapterId: undefined },
  );

  const [guideOpen, setGuideOpen] = useState(false);

  const restoredPage = useMemo(() => {
    const progress = readReciteProgress();
    if (!progress || progress.chapterId !== effectiveChapterId) {
      return 0;
    }
    return progress.pageIndex;
  }, [effectiveChapterId]);

  const chapterOptions = useMemo(
    () =>
      chapters.map((chapter) => ({
        value: chapter.id,
        label: `${chapter.id}. ${chapter.nameSimple}`,
        subtitle: `${chapter.versesCount} ayat`,
        searchText: chapter.nameArabic,
      })),
    [chapters],
  );

  const alquranEnabled = isAlquranProvider();

  const translationOptions = useMemo(() => {
    return [
      { value: "none" as const, label: "None" },
      { value: "english" as const, label: "English", subtitle: "(Sahih International)" },
      { value: "tamil" as const, label: "Tamil", subtitle: "(Jan Trust)" },
      ...(alquranEnabled
        ? [{ value: "sinhala" as const, label: "Sinhala", subtitle: "Coming Soon(Naseem Ismail)" }]
        : []),
    ];
  }, [alquranEnabled]);

  const currentTranslationChoice = useMemo((): TranslationChoice => {
    if (params.translationId === SAHIH_INTERNATIONAL_ID) return "english";
    if (params.translationId === TAMIL_LEGACY_ID) return "tamil";
    if (params.translationEdition === TAMIL_EDITION) return "tamil";
    if (params.translationEdition === SINHALA_EDITION) return "sinhala";
    return "none";
  }, [params.translationId, params.translationEdition]);

  const handleTranslationChange = (choice: TranslationChoice | undefined) => {
    if (!choice || choice === "none") {
      setParams((prev) => ({
        ...prev,
        translationId: undefined,
        translationEdition: undefined,
      }));
      return;
    }

    if (choice === "english") {
      setParams((prev) => ({
        ...prev,
        translationId: SAHIH_INTERNATIONAL_ID,
        translationEdition: undefined,
      }));
      return;
    }

    if (choice === "tamil") {
      if (isAlquranProvider()) {
        setParams((prev) => ({
          ...prev,
          translationId: undefined,
          translationEdition: TAMIL_EDITION,
        }));
      } else {
        setParams((prev) => ({
          ...prev,
          translationId: TAMIL_LEGACY_ID,
          translationEdition: undefined,
        }));
      }
      return;
    }

    if (choice === "sinhala") {
      setParams((prev) => ({
        ...prev,
        translationId: undefined,
        translationEdition: SINHALA_EDITION,
      }));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-2 pb-12 pt-4 sm:px-6 lg:px-20 xl:px-24">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <BookOpen className="h-6 w-6" />
        </div>
        <Section
          title="Quran Recite"
          subtitle="Read and recite the full surah with customizable text size and color"
        >
          <div />
        </Section>
      </div>

      <div className="space-y-6">
        <Card variant="raised" className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect
                id="recite-surah"
                label="Surah"
                placeholder="Select a chapter"
                searchable
                searchPlaceholder="Search by name or number…"
                options={chapterOptions}
                value={effectiveChapterId}
                onChange={(chapterId) => {
                  const chapter = chapters.find((c) => c.id === chapterId);
                  if (chapter) {
                    setParams((prev) => ({
                      ...prev,
                      chapterId: chapterId ?? undefined,
                      fromVerse: 1,
                      toVerse: chapter.versesCount,
                    }));
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect<TranslationChoice>
                id="recite-translation"
                label="Translation"
                placeholder="Select translation"
                options={translationOptions}
                value={currentTranslationChoice}
                onChange={handleTranslationChange}
              />
            </div>
          </div>
        </Card>

        {isLoading && <SurahLoadingSkeleton />}

        {isError && (
          <Card variant="muted" className="border-red-500/20 bg-red-500/10 p-6">
            <p className="font-semibold text-red-400">Error loading surah</p>
            <p className="mt-2 text-sm text-red-300">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </Card>
        )}

        {!isLoading && !isError && verses.length > 0 && (
          <>
            <div className="overflow-hidden rounded-2xl border border-foreground/10 border-l-4 border-l-brand bg-surface-muted/50 shadow-sm">
              <button
                type="button"
                onClick={() => setGuideOpen((open) => !open)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-brand/5 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-inset"
                aria-expanded={guideOpen}
                aria-controls="recite-guide-content"
                id="recite-guide-toggle"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Volume2 className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground">
                    How to use this page? ✨
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-foreground-muted transition-transform duration-200 ${guideOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              <div
                id="recite-guide-content"
                role="region"
                aria-labelledby="recite-guide-toggle"
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: guideOpen ? "1fr" : "0fr" }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="border-t border-foreground/10 px-4 pb-4 pt-3">
                    <ul className="list-none space-y-2.5 text-sm text-foreground-muted">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        <span>
                          <strong className="text-foreground">Click a word to hear it.</strong> Tap any
                          word in the Arabic text to play its pronunciation.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        <span>
                          <strong className="text-foreground">Text size</strong> — use the + and −
                          buttons above the surah to make the text larger or smaller.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        <span>
                          <strong className="text-foreground">Text color</strong> — pick a color
                          from the option above to change how the Arabic text looks.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        <span>
                          <strong className="text-foreground">Sections</strong> — use Previous and Next
                          to move through the surah; progress is saved automatically.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        <span>
                          <strong className="text-foreground">Bookmarks</strong> — save your place and
                          jump back to saved sections from the bookmark list.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <Card variant="raised" className="px-1.5 py-2 sm:px-3 sm:py-4 md:px-6 md:py-6">
              <FullSurahText
                verses={verses}
                wordsPerPage={50}
                chapterId={effectiveChapterId}
                chapterName={selectedChapter?.nameSimple}
                initialPage={restoredPage}
              />
            </Card>
          </>
        )}

        {!isLoading && !isError && !effectiveChapterId && (
          <Card variant="muted" className="p-8 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-foreground-muted" />
            <p className="text-lg font-medium text-foreground">
              Select a Surah to begin reciting
            </p>
            <p className="mt-2 text-sm text-foreground-muted">
              Choose a chapter from the dropdown above
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
