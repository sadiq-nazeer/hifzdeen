import { SlidersHorizontal } from "lucide-react";
import { type ChangeEvent, useMemo } from "react";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { CoachBundleParams } from "@/lib/hooks/useCoachBundle";
import type { ChapterSummary, ReciterProfile } from "@/lib/types/quran";

const SAHIH_INTERNATIONAL_ID = 20;
const TAMIL_LEGACY_ID = 50;
const TAMIL_EDITION = "ta.tamil";
const SINHALA_EDITION = "si.naseemismail";
const FRENCH_EDITION = "fr.hamidullah";
const SPANISH_EDITION = "es.cortes";
const URDU_EDITION = "ur.jalandhry";
const INDONESIAN_EDITION = "id.indonesian";
const HINDI_EDITION = "hi.hindi";

type TranslationChoice =
  | "none"
  | "sahih"
  | "tamil"
  | "sinhala"
  | "french"
  | "spanish"
  | "urdu"
  | "indonesian"
  | "hindi";

const isAlquranProvider = (): boolean =>
  process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER === "alquran";

type Props = {
  chapters: ChapterSummary[];
  reciters: ReciterProfile[];
  value: CoachBundleParams;
  onChange: (value: CoachBundleParams) => void;
  isLoadingVerses: boolean;
  showHeader?: boolean;
  showContent?: boolean;
};

const numberField = (
  value: number | undefined,
  fallback: number,
): number => {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }
  return value;
};

export const CoachConfigurator = ({
  chapters,
  reciters,
  value,
  onChange,
  isLoadingVerses,
  showHeader = true,
  showContent = true,
}: Props) => {
  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === value.chapterId),
    [chapters, value.chapterId],
  );

  const maxVerse = selectedChapter?.versesCount ?? 7;

  const handleNumberChange = (
    key: keyof CoachBundleParams,
    fallback: number,
  ) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    onChange({
      ...value,
      [key]: Number.isFinite(parsed) ? parsed : fallback,
    });
  };

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

  const reciterOptions = useMemo(
    () =>
      reciters.map((reciter) => ({
        value: reciter.id,
        label: reciter.name,
        subtitle: reciter.style,
      })),
    [reciters],
  );

  const translationOptions = useMemo(() => {
    const base: Array<{
      value: TranslationChoice;
      label: string;
      subtitle?: string;
    }> = [
      { value: "none" as const, label: "None" },
      { value: "sahih" as const, label: "Sahih International", subtitle: "English" },
    ];

    base.push(
      { value: "tamil", label: "Tamil (Jan Trust)" },
      { value: "sinhala", label: "Sinhala (Naseem Ismail)" },
    );

    if (isAlquranProvider()) {
      base.push(
        { value: "french", label: "French (Hamidullah)", subtitle: "French" },
        { value: "spanish", label: "Spanish (Cortes)", subtitle: "Spanish" },
        { value: "urdu", label: "Urdu (Jalandhry)", subtitle: "Urdu" },
        {
          value: "indonesian",
          label: "Indonesian (Bahasa Indonesia)",
          subtitle: "Indonesian",
        },
      );
    }

    return base;
  }, []);

  const currentTranslationChoice = useMemo((): TranslationChoice => {
    if (value.translationId === SAHIH_INTERNATIONAL_ID) return "sahih";
    if (value.translationId === TAMIL_LEGACY_ID) return "tamil";
    if (value.translationEdition === TAMIL_EDITION) return "tamil";
    if (value.translationEdition === SINHALA_EDITION) return "sinhala";
    if (value.translationEdition === FRENCH_EDITION) return "french";
    if (value.translationEdition === SPANISH_EDITION) return "spanish";
    if (value.translationEdition === URDU_EDITION) return "urdu";
    if (value.translationEdition === INDONESIAN_EDITION) return "indonesian";
    if (value.translationEdition === HINDI_EDITION) return "hindi";
    return "none";
  }, [value.translationId, value.translationEdition]);

  const handleTranslationChange = (choice: TranslationChoice | undefined) => {
    if (!choice || choice === "none") {
      onChange({
        ...value,
        translationId: undefined,
        translationEdition: undefined,
      });
      return;
    }
    if (choice === "sahih") {
      onChange({
        ...value,
        translationId: SAHIH_INTERNATIONAL_ID,
        translationEdition: undefined,
      });
      return;
    }
    if (choice === "tamil") {
      if (isAlquranProvider()) {
        onChange({
          ...value,
          translationId: undefined,
          translationEdition: TAMIL_EDITION,
        });
      } else {
        onChange({
          ...value,
          translationId: TAMIL_LEGACY_ID,
          translationEdition: undefined,
        });
      }
      return;
    }
    if (choice === "sinhala") {
      onChange({
        ...value,
        translationId: undefined,
        translationEdition: SINHALA_EDITION,
      });
    }
    if (choice === "french") {
      onChange({
        ...value,
        translationId: undefined,
        translationEdition: FRENCH_EDITION,
      });
    }
    if (choice === "spanish") {
      onChange({
        ...value,
        translationId: undefined,
        translationEdition: SPANISH_EDITION,
      });
    }
    if (choice === "urdu") {
      onChange({
        ...value,
        translationId: undefined,
        translationEdition: URDU_EDITION,
      });
    }
    if (choice === "indonesian") {
      onChange({
        ...value,
        translationId: undefined,
        translationEdition: INDONESIAN_EDITION,
      });
    }
    if (choice === "hindi") {
      onChange({
        ...value,
        translationId: undefined,
        translationEdition: HINDI_EDITION,
      });
    }
  };

  const inputClasses =
    "rounded-2xl border border-white/10 bg-surface-muted/80 px-4 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <section className="overflow-hidden rounded-3xl border border-white/5 bg-surface-raised/60 shadow-xl shadow-brand/5">
      {/* Header with accent bar */}
      {showHeader && (
        <div className="border-b border-white/5 bg-surface-muted/30 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <SlidersHorizontal className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-foreground-muted">
                  Session Setup
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Choose surah, range, reciter, and content options
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium tabular-nums ${
                isLoadingVerses
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-brand/15 text-brand"
              }`}
            >
              {isLoadingVerses ? "Refreshing…" : "Ready"}
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Surah & range */}
        <div id="session-range" className="mb-6 scroll-mt-24">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Surah & range
          </h3>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <SearchableSelect
              id="session-surah"
              label="Surah"
              placeholder="Select a chapter"
              searchable
              searchPlaceholder="Search by name or number…"
              options={chapterOptions}
              value={value.chapterId}
              onChange={(chapterId) => {
                const chapter = chapters.find((c) => c.id === chapterId);
                const versesCount = chapter?.versesCount ?? 1;
                onChange({
                  ...value,
                  chapterId: chapterId ?? undefined,
                  fromVerse: 1,
                  toVerse: versesCount,
                });
              }}
            />
            <div className="flex gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground-muted">
                  From
                </span>
                <input
                  type="number"
                  min={1}
                  max={maxVerse}
                  className={`${inputClasses} w-20 min-w-0 sm:w-24`}
                  value={numberField(value.fromVerse, 1)}
                  onChange={handleNumberChange("fromVerse", 1)}
                  aria-label="From verse"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground-muted">
                  To
                </span>
                <input
                  type="number"
                  min={value.fromVerse ?? 1}
                  max={maxVerse}
                  className={`${inputClasses} w-20 min-w-0 sm:w-24`}
                  value={numberField(value.toVerse, maxVerse)}
                  onChange={handleNumberChange("toVerse", maxVerse)}
                  aria-label="To verse"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Audio */}
        <div className="mb-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Audio
          </h3>
          <SearchableSelect
            id="session-reciter"
            label="Reciter"
            placeholder="Default (Mishari Rashid Al-Afasy)"
            options={reciterOptions}
            value={value.reciterId}
            onChange={(reciterId) =>
              onChange({ ...value, reciterId: reciterId ?? undefined })
            }
          />
        </div>

        {/* Content */}
        {showContent && (
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Content
            </h3>
            <SearchableSelect<TranslationChoice>
              id="session-translation"
              label="Translation"
              placeholder="Select translation"
              options={translationOptions}
              value={currentTranslationChoice}
              onChange={handleTranslationChange}
            />
          </div>
        )}
      </div>
    </section>
  );
};

