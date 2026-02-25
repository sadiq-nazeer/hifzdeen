"use client";

import { Bookmark, BookmarkCheck, Minus, Palette, Plus, Type, Maximize2, X } from "lucide-react";
import { Fragment, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSurahTextColorOption,
  SURAH_TEXT_COLOR_OPTIONS,
  type SurahTextColorId,
} from "@/components/quran/surahTextColors";
import { buildPronounceableVerseWords } from "@/lib/quranWords";
import {
  addReciteBookmark,
  readReciteBookmarks,
  removeReciteBookmark,
  writeReciteProgress,
} from "@/lib/storage/reciteProgress";
import type { CoachSessionVerse } from "@/lib/types/quran";

/** Split Uthmani Arabic verse into words (space-separated). */
function splitVerseIntoWords(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  return text.trim().split(/\s+/).filter(Boolean);
}

const ARABIC_NUMERALS = "٠١٢٣٤٥٦٧٨٩";

const toArabicNumerals = (n: number): string =>
  String(n)
    .split("")
    .map((d) => ARABIC_NUMERALS[Number.parseInt(d, 10)] ?? d)
    .join("");

/** Full surah paragraph text size: index → Tailwind text/leading classes. */
const FULL_SURAH_TEXT_SIZES = [
  "text-base leading-relaxed md:text-lg md:leading-loose lg:text-xl",
  "text-xl leading-relaxed md:text-2xl md:leading-loose lg:text-3xl",
  "text-2xl leading-relaxed md:text-3xl md:leading-loose lg:text-4xl",
  "text-3xl leading-relaxed md:text-4xl md:leading-loose lg:text-5xl",
] as const;
const FULL_SURAH_TEXT_SIZE_MIN = 0;
const FULL_SURAH_TEXT_SIZE_MAX = FULL_SURAH_TEXT_SIZES.length - 1;

/** In full-screen mode, each section has exactly this many words (may break mid-verse). */
const FULL_SCREEN_SECTION_SIZE = 50;

/** Single word entry when assembling text from verses only (no full-text Quran). */
type VerseWordEntry = {
  word: string;
  verseKey: string;
  orderInChapter: number;
  audioUrl?: string;
  wordId?: number;
};

type FullSurahTextProps = {
  verses: CoachSessionVerse[];
  /** Currently highlighted verse key (optional, for audio sync) */
  highlightedVerseKey?: string;
  /** Number of verses per page (used when wordsPerPage is not set) */
  versesPerPage?: number;
  /** Optional: number of words per page; when set, pagination is by word count instead of verse count */
  wordsPerPage?: number;
  /** Default text size index (0-3) */
  defaultTextSize?: number;
  /** Default text color */
  defaultTextColor?: SurahTextColorId;
  /** Default highlight (current ayah) text color */
  defaultHighlightColor?: SurahTextColorId;
  /** Optional: chapter id for progress and bookmarks persistence */
  chapterId?: number;
  /** Optional: chapter name for bookmark labels */
  chapterName?: string;
  /** Optional: initial page index (e.g. from restored progress) */
  initialPage?: number;
  className?: string;
};

export function FullSurahText(props: FullSurahTextProps) {
  const {
    verses,
    highlightedVerseKey,
    versesPerPage = 10,
    wordsPerPage: wordsPerPageProp,
    defaultTextSize = 1,
    defaultTextColor = "foreground",
    defaultHighlightColor = "brand",
    chapterId,
    chapterName,
    className = "",
  } = props;

  const initialPageFromProps = props.initialPage;
  const wordsPerPage = wordsPerPageProp ?? 0;
  const useWordsPerPage = wordsPerPage > 0;
  const [textSizeIndex, setTextSizeIndex] = useState(defaultTextSize);
  const [textColor, setTextColor] = useState<SurahTextColorId>(defaultTextColor);
  const [highlightColor, setHighlightColor] = useState<SurahTextColorId>(defaultHighlightColor);
  const [currentPage, setCurrentPage] = useState(initialPageFromProps ?? 0);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [fullScreenCurrentSection, setFullScreenCurrentSection] = useState(0);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const fullScreenScrollRef = useRef<HTMLDivElement>(null);
  const fullScreenSectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevInitialPageRef = useRef<number>(-1);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);

  const playWordAudio = (wordAudioUrl?: string, wordKey?: string) => {
    if (!wordAudioUrl || !wordKey) return;
    const previousWordAudio = wordAudioRef.current;
    if (previousWordAudio) {
      previousWordAudio.pause();
      previousWordAudio.currentTime = 0;
    }
    const player = new Audio(wordAudioUrl);
    wordAudioRef.current = player;
    setPlayingWordKey(wordKey);
    player.onended = () => setPlayingWordKey(null);
    player.onerror = () => setPlayingWordKey(null);
    player.play().catch(() => setPlayingWordKey(null));
  };

  useEffect(() => {
    return () => {
      const wordAudio = wordAudioRef.current;
      if (wordAudio) {
        wordAudio.pause();
      }
      wordAudioRef.current = null;
    };
  }, []);

  // Sort verses by orderInChapter to ensure correct display order
  const sortedVerses = useMemo(
    () => [...verses].sort((a, b) => a.orderInChapter - b.orderInChapter),
    [verses],
  );

  const verseByKey = useMemo(() => {
    const map = new Map<string, CoachSessionVerse>();
    for (const v of sortedVerses) {
      map.set(v.verse.verseKey, v);
    }
    return map;
  }, [sortedVerses]);

  // Assemble full text from each verse only (no full-text Quran): flatten into word entries
  const allWordEntries = useMemo((): VerseWordEntry[] => {
    const entries: VerseWordEntry[] = [];
    for (const cv of sortedVerses) {
      const v = cv.verse;
      const apiWords = buildPronounceableVerseWords(v.words);
      const wordTexts =
        apiWords.length > 0
          ? apiWords.map((w) => w.textUthmani)
          : splitVerseIntoWords(v.textUthmani);
      for (let i = 0; i < wordTexts.length; i++) {
        entries.push({
          word: wordTexts[i],
          verseKey: v.verseKey,
          orderInChapter: cv.orderInChapter,
          audioUrl: apiWords[i]?.audioUrl,
          wordId: apiWords[i]?.id,
        });
      }
    }
    return entries;
  }, [sortedVerses]);

  /** Fixed 50-word section starts (used for both inline and full-screen; may break mid-verse). */
  const fixedSectionStarts = useMemo((): number[] => {
    if (allWordEntries.length === 0) return [0];
    const starts: number[] = [];
    for (let i = 0; i < allWordEntries.length; i += FULL_SCREEN_SECTION_SIZE) {
      starts.push(i);
    }
    return starts;
  }, [allWordEntries.length]);

  const totalSections = fixedSectionStarts.length;

  const totalPages = useMemo(() => {
    if (useWordsPerPage) {
      return Math.max(1, totalSections);
    }
    return Math.max(1, Math.ceil(sortedVerses.length / versesPerPage));
  }, [useWordsPerPage, totalSections, sortedVerses.length, versesPerPage]);

  const fullScreenSectionStarts = fixedSectionStarts;
  const fullScreenTotalSections = totalSections;

  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));

  const pageVerses = useMemo(
    () =>
      sortedVerses.slice(
        safePage * versesPerPage,
        (safePage + 1) * versesPerPage,
      ),
    [sortedVerses, safePage, versesPerPage],
  );

  const pageWordEntries = useMemo(
    () => {
      if (!useWordsPerPage) return [];
      const start = fixedSectionStarts[safePage] ?? 0;
      const end =
        safePage + 1 < fixedSectionStarts.length
          ? fixedSectionStarts[safePage + 1]!
          : allWordEntries.length;
      return allWordEntries.slice(start, end);
    },
    [useWordsPerPage, allWordEntries, safePage, fixedSectionStarts],
  );

  const visibleVersesForTranslation = useMemo((): CoachSessionVerse[] => {
    if (!useWordsPerPage) {
      return pageVerses;
    }
    if (pageWordEntries.length === 0) return [];
    const orderedKeys: string[] = [];
    const seen = new Set<string>();
    for (const entry of pageWordEntries) {
      if (seen.has(entry.verseKey)) continue;
      seen.add(entry.verseKey);
      orderedKeys.push(entry.verseKey);
    }
    return orderedKeys
      .map((k) => verseByKey.get(k))
      .filter((v): v is CoachSessionVerse => v !== undefined);
  }, [useWordsPerPage, pageVerses, pageWordEntries, verseByKey]);

  const hasAnyVisibleTranslation = useMemo((): boolean => {
    return visibleVersesForTranslation.some((v) => Boolean(v.translation?.text));
  }, [visibleVersesForTranslation]);

  const translationMeta = useMemo(() => {
    const first = visibleVersesForTranslation.find((v) => v.translation != null)?.translation;
    if (!first) return null;
    return {
      languageName: first.languageName,
      resourceName: first.resourceName,
    };
  }, [visibleVersesForTranslation]);

  /** Inline: show verse number at end of section only when verse is finished in this section. */
  const inlineVerseFinishedInSection = useMemo(() => {
    if (!useWordsPerPage || pageWordEntries.length === 0) return true;
    const sectionEnd =
      safePage + 1 < fixedSectionStarts.length
        ? fixedSectionStarts[safePage + 1]!
        : allWordEntries.length;
    const lastEntry = pageWordEntries[pageWordEntries.length - 1];
    const nextWord = allWordEntries[sectionEnd];
    return (
      lastEntry != null &&
      (nextWord == null || nextWord.verseKey !== lastEntry.verseKey)
    );
  }, [useWordsPerPage, pageWordEntries, safePage, fixedSectionStarts, allWordEntries]);

  const [bookmarkListVersion, setBookmarkListVersion] = useState(0);
  const bookmarksForChapter = useMemo(() => {
    void bookmarkListVersion;
    if (chapterId == null) return [];
    return readReciteBookmarks().filter((b) => b.chapterId === chapterId);
  }, [chapterId, bookmarkListVersion]);

  /** At most one bookmark per chapter; used for "Go to bookmark" button. */
  const bookmarkForCurrentChapter = bookmarksForChapter[0] ?? null;

  const handleSaveBookmark = useCallback(() => {
    if (chapterId == null) return;
    const firstEntry = pageWordEntries[0];
    addReciteBookmark({
      chapterId,
      pageIndex: safePage,
      chapterName,
      verseKey: firstEntry?.verseKey,
      verseNumber: firstEntry?.orderInChapter,
    });
    setBookmarkListVersion((v) => v + 1);
  }, [chapterId, safePage, chapterName, pageWordEntries]);

  const handleGoToBookmark = useCallback(() => {
    if (bookmarkForCurrentChapter == null || bookmarkForCurrentChapter.chapterId !== chapterId) return;
    if (safePage === bookmarkForCurrentChapter.pageIndex) {
      removeReciteBookmark(bookmarkForCurrentChapter.id);
      setBookmarkListVersion((v) => v + 1);
      return;
    }
    setCurrentPage(bookmarkForCurrentChapter.pageIndex);
  }, [chapterId, bookmarkForCurrentChapter, safePage]);

  const handleGoToBookmarkFullScreen = useCallback(() => {
    if (bookmarkForCurrentChapter == null || bookmarkForCurrentChapter.chapterId !== chapterId) return;
    if (fullScreenCurrentSection === bookmarkForCurrentChapter.pageIndex) {
      removeReciteBookmark(bookmarkForCurrentChapter.id);
      setBookmarkListVersion((v) => v + 1);
      return;
    }
    setFullScreenCurrentSection(bookmarkForCurrentChapter.pageIndex);
    const scrollContainer = fullScreenScrollRef.current;
    const sectionRefs = fullScreenSectionRefs.current;
    const el = sectionRefs[bookmarkForCurrentChapter.pageIndex];
    if (scrollContainer && el) {
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [chapterId, bookmarkForCurrentChapter, fullScreenCurrentSection]);

  /** Bookmark current section in full-screen (uses fullScreenCurrentSection). */
  const handleSaveBookmarkFullScreen = useCallback(() => {
    if (chapterId == null) return;
    const startIdx = fullScreenSectionStarts[fullScreenCurrentSection] ?? 0;
    const firstEntry = allWordEntries[startIdx];
    addReciteBookmark({
      chapterId,
      pageIndex: fullScreenCurrentSection,
      chapterName,
      verseKey: firstEntry?.verseKey,
      verseNumber: firstEntry?.orderInChapter,
    });
    setBookmarkListVersion((v) => v + 1);
  }, [chapterId, fullScreenCurrentSection, chapterName, fullScreenSectionStarts, allWordEntries]);

  /** Bookmark at a specific verse (e.g. when clicking a verse number). sectionIndex required in full-screen. */
  const handleBookmarkAtVerse = useCallback(
    (verseKey: string, verseNumber: number, sectionIndex?: number) => {
      if (chapterId == null) return;
      const page = sectionIndex ?? safePage;
      addReciteBookmark({
        chapterId,
        pageIndex: page,
        chapterName,
        verseKey,
        verseNumber,
      });
      setBookmarkListVersion((v) => v + 1);
    },
    [chapterId, safePage, chapterName],
  );

  // Reset page when verses change - derive initial page from verses or word index
  const versesKey = sortedVerses.map((v) => v.verse.verseKey).join(",");
  const initialPage = useMemo(() => {
    if (initialPageFromProps != null && initialPageFromProps >= 0) {
      return Math.min(initialPageFromProps, Math.max(0, totalPages - 1));
    }
    if (!highlightedVerseKey || sortedVerses.length === 0) return 0;
    if (useWordsPerPage) {
      const wordIndex = allWordEntries.findIndex(
        (e) => e.verseKey === highlightedVerseKey,
      );
      if (wordIndex < 0) return 0;
      return Math.min(totalSections - 1, Math.floor(wordIndex / FULL_SCREEN_SECTION_SIZE));
    }
    const verseIndex = sortedVerses.findIndex(
      (v) => v.verse.verseKey === highlightedVerseKey,
    );
    return verseIndex >= 0 ? Math.floor(verseIndex / versesPerPage) : 0;
  }, [
    sortedVerses,
    highlightedVerseKey,
    versesPerPage,
    useWordsPerPage,
    allWordEntries,
    initialPageFromProps,
    totalPages,
    totalSections,
  ]);

  // Update page when highlighted verse changes
  useEffect(() => {
    if (initialPage !== prevInitialPageRef.current && initialPage >= 0) {
      // Intentional: sync pagination with highlighted verse
      prevInitialPageRef.current = initialPage;
      startTransition(() => {
        setCurrentPage(initialPage);
      });
    }
  }, [initialPage]);

  // Reset to first page when verses change (different surah); use initialPage from parent when provided
  useEffect(() => {
    startTransition(() => {
      setCurrentPage(initialPageFromProps ?? 0);
    });
  }, [versesKey, initialPageFromProps]);

  // Close color dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorDropdownRef.current &&
        !colorDropdownRef.current.contains(event.target as Node)
      ) {
        setColorDropdownOpen(false);
      }
    };
    if (colorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colorDropdownOpen]);

  // Close full screen on Escape and lock body scroll when open
  useEffect(() => {
    if (!fullScreenOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullScreenOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullScreenOpen]);

  // Persist progress when chapter and page change
  useEffect(() => {
    if (chapterId != null && chapterId > 0) {
      writeReciteProgress({ chapterId, pageIndex: safePage });
    }
  }, [chapterId, safePage]);

  // Full-screen: when opening, set current section from restored progress (or inline page) and scroll to it
  useEffect(() => {
    if (!fullScreenOpen || fullScreenTotalSections === 0) return;
    const sectionIndex = Math.min(
      fullScreenTotalSections - 1,
      Math.max(0, initialPageFromProps ?? safePage ?? 0),
    );
    const scrollContainer = fullScreenScrollRef.current;
    const sectionRefs = fullScreenSectionRefs.current;
    const scrollToSection = () => {
      const el = sectionRefs[sectionIndex];
      if (scrollContainer && el) {
        el.scrollIntoView({ block: "start", behavior: "auto" });
      }
    };
    const id = setTimeout(() => {
      setFullScreenCurrentSection(sectionIndex);
      setTimeout(scrollToSection, 50);
    }, 0);
    return () => clearTimeout(id);
  }, [
    fullScreenOpen,
    fullScreenTotalSections,
    initialPageFromProps,
    safePage,
  ]);

  // Full-screen: scroll spy – update current section and persist progress
  useEffect(() => {
    if (!fullScreenOpen || fullScreenTotalSections === 0) return;
    const scrollContainer = fullScreenScrollRef.current;
    if (!scrollContainer) return;

    const onScroll = () => {
      const refs = fullScreenSectionRefs.current;
      const scrollTop = scrollContainer.scrollTop;
      const viewportMid = scrollTop + scrollContainer.clientHeight / 2;
      let sectionIndex = 0;
      for (let i = 0; i < fullScreenTotalSections; i++) {
        const el = refs[i];
        if (el && el.offsetTop + el.offsetHeight > viewportMid) {
          sectionIndex = i;
          break;
        }
        sectionIndex = i;
      }
      setFullScreenCurrentSection((prev) => (prev !== sectionIndex ? sectionIndex : prev));
    };

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [fullScreenOpen, fullScreenTotalSections]);

  // Full-screen: persist progress when visible section changes
  useEffect(() => {
    if (fullScreenOpen && chapterId != null && chapterId > 0) {
      writeReciteProgress({ chapterId, pageIndex: fullScreenCurrentSection });
    }
  }, [fullScreenOpen, chapterId, fullScreenCurrentSection]);

  if (sortedVerses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-surface-muted/30 p-8 text-center">
        <p className="text-sm text-foreground-muted">No verses to display</p>
      </div>
    );
  }

  const selectedTextOption = getSurahTextColorOption(textColor);
  const selectedHighlightOption = getSurahTextColorOption(highlightColor);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Surah info and controls on one row: info left, text size + color picker right */}
      <div className="flex flex-nowrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground-muted shrink-0">
          {sortedVerses.length} ayats
        </p>
        <div className="flex flex-nowrap items-center gap-2 shrink-0">
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5">
          <span
            className="flex items-center rounded-l-lg border-r border-white/10 p-1.5 text-foreground-muted"
            aria-hidden
          >
            <Type className="h-4 w-4 shrink-0" aria-label="Text size" />
          </span>
          <button
            type="button"
            disabled={textSizeIndex <= FULL_SURAH_TEXT_SIZE_MIN}
            className="p-1.5 text-foreground transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
            onClick={() =>
              setTextSizeIndex((i) =>
                Math.max(FULL_SURAH_TEXT_SIZE_MIN, i - 1)
              )
            }
            aria-label="Decrease text size"
          >
            <Minus className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={textSizeIndex >= FULL_SURAH_TEXT_SIZE_MAX}
            className="border-l border-white/10 rounded-r-lg p-1.5 text-foreground transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
            onClick={() =>
              setTextSizeIndex((i) =>
                Math.min(FULL_SURAH_TEXT_SIZE_MAX, i + 1)
              )
            }
            aria-label="Increase text size"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="relative" ref={colorDropdownRef}>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1.5 text-foreground transition hover:bg-white/10"
              onClick={() => setColorDropdownOpen((open) => !open)}
              aria-expanded={colorDropdownOpen}
              aria-haspopup="listbox"
              aria-label={`Text and highlight color: ${selectedTextOption.label} / ${selectedHighlightOption.label}`}
            >
              <Palette className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
              <span
                className={`h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20 ${selectedTextOption.swatchClass}`}
                aria-hidden
              />
              <span
                className={`h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20 ${selectedHighlightOption.swatchClass}`}
                aria-hidden
              />
            </button>
            {colorDropdownOpen && (
              <div
                className="absolute right-0 top-full z-10 mt-1 min-w-[16rem] grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-surface-raised py-2 px-2 shadow-lg"
                role="dialog"
                aria-label="Text and highlight color options"
              >
                <div>
                  <p className="mb-1 px-2 text-xs font-semibold text-foreground-muted">Text color</p>
                  <ul className="space-y-0.5" role="listbox" aria-label="Text color options">
                    {SURAH_TEXT_COLOR_OPTIONS.map((opt) => (
                      <li key={opt.id} role="option" aria-selected={textColor === opt.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-foreground transition hover:bg-white/10"
                          onClick={() => setTextColor(opt.id)}
                        >
                          <span className={`h-4 w-4 shrink-0 rounded border border-white/20 ${opt.swatchClass}`} aria-hidden />
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 px-2 text-xs font-semibold text-foreground-muted">Highlight color</p>
                  <ul className="space-y-0.5" role="listbox" aria-label="Highlight color options">
                    {SURAH_TEXT_COLOR_OPTIONS.map((opt) => (
                      <li key={opt.id} role="option" aria-selected={highlightColor === opt.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-foreground transition hover:bg-white/10"
                          onClick={() => setHighlightColor(opt.id)}
                        >
                          <span className={`h-4 w-4 shrink-0 rounded border border-white/20 ${opt.swatchClass}`} aria-hidden />
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1.5 text-foreground transition hover:bg-white/10"
            onClick={() => setFullScreenOpen(true)}
            aria-label="Preview full surah in full screen"
            title="Full screen preview"
          >
            <Maximize2 className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
          </button>
        </div>
      </div>

      {/* Text display: assembled from each verse only (no full-text Quran) */}
      <div className="rounded-xl border border-white/10 bg-surface-muted/30 p-2 sm:p-3 md:p-4">
        <div
          className={`surah-paragraph text-center ${FULL_SURAH_TEXT_SIZES[textSizeIndex]}`}
          dir="rtl"
        >
          {useWordsPerPage ? (
            // Word-based pages: render word entries with verse number markers at verse boundaries
            pageWordEntries.length > 0 ? (
              <>
                {pageWordEntries.map((entry, i) => {
                  const isHighlighted = entry.verseKey === highlightedVerseKey;
                  const prevEntry = pageWordEntries[i - 1];
                  const showVerseMarker =
                    !prevEntry || prevEntry.verseKey !== entry.verseKey;
                  const wordKey =
                    entry.wordId != null
                      ? `${entry.verseKey}-${entry.wordId}`
                      : `${entry.verseKey}-${i}`;
                  const baseClassName = isHighlighted
                    ? selectedHighlightOption.textClass
                    : selectedTextOption.textClass;
                  return (
                    <Fragment key={`${entry.verseKey}-${i}`}>
                      {showVerseMarker && prevEntry != null ? (
                        <button
                          type="button"
                          className={`verse-number-marker verse-number-marker--circle cursor-pointer transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-background ${
                            bookmarkForCurrentChapter?.verseNumber === prevEntry.orderInChapter ? "verse-number-marker--bookmarked" : ""
                          }`}
                          aria-label={`Ayah ${toArabicNumerals(prevEntry.orderInChapter)} – click to bookmark`}
                          title="Bookmark this verse"
                          onClick={() =>
                            chapterId != null &&
                            handleBookmarkAtVerse(prevEntry.verseKey, prevEntry.orderInChapter)
                          }
                        >
                          {toArabicNumerals(prevEntry.orderInChapter)}
                        </button>
                      ) : null}
                      {showVerseMarker && prevEntry != null ? " " : null}
                      <span className={baseClassName}>
                        {entry.audioUrl ? (
                          <button
                            type="button"
                            className={`m-0 inline border-0 bg-transparent p-0 font-inherit leading-inherit transition-colors hover:opacity-80 ${playingWordKey === wordKey ? "opacity-100 text-brand" : ""}`}
                            onClick={() =>
                              playWordAudio(entry.audioUrl, wordKey)
                            }
                            title="Play word audio"
                            aria-label={`Play word audio: ${entry.word}`}
                          >
                            {entry.word}
                          </button>
                        ) : (
                          <span>{entry.word}</span>
                        )}
                      </span>
                      {i < pageWordEntries.length - 1 ? "\u00A0" : null}
                    </Fragment>
                  );
                })}
                {pageWordEntries.length > 0 && inlineVerseFinishedInSection ? (
                  <>
                    <button
                      type="button"
                      className={`verse-number-marker verse-number-marker--circle cursor-pointer transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-background ${
                        bookmarkForCurrentChapter?.verseNumber === pageWordEntries[pageWordEntries.length - 1].orderInChapter ? "verse-number-marker--bookmarked" : ""
                      }`}
                      aria-label={`Ayah ${toArabicNumerals(pageWordEntries[pageWordEntries.length - 1].orderInChapter)} – click to bookmark`}
                      title="Bookmark this verse"
                      onClick={() => {
                        const last = pageWordEntries[pageWordEntries.length - 1];
                        if (chapterId != null) handleBookmarkAtVerse(last.verseKey, last.orderInChapter);
                      }}
                    >
                      {toArabicNumerals(
                        pageWordEntries[pageWordEntries.length - 1]
                          .orderInChapter,
                      )}
                    </button>
                  </>
                ) : null}
              </>
            ) : null
          ) : (
            // Verse-based pages: render verses assembled from each verse's words/text only
            pageVerses.map((verse) => {
              const isHighlighted = verse.verse.verseKey === highlightedVerseKey;
              const apiWords = buildPronounceableVerseWords(verse.verse.words);
              const verseWords =
                apiWords.length > 0
                  ? apiWords.map((w) => w.textUthmani)
                  : splitVerseIntoWords(verse.verse.textUthmani);
              const baseClassName = isHighlighted
                ? selectedHighlightOption.textClass
                : selectedTextOption.textClass;
              return (
                <Fragment key={verse.verse.verseKey}>
                  <span className={baseClassName}>
                    {verseWords.length > 0
                      ? verseWords.map((word, i) => (
                          <span key={i}>
                            {apiWords[i]?.audioUrl ? (
                              <button
                                type="button"
                                className={`m-0 inline border-0 bg-transparent p-0 font-inherit leading-inherit transition-colors hover:opacity-80 ${playingWordKey === `${verse.verse.verseKey}-${apiWords[i].id}` ? "opacity-100 text-brand" : ""}`}
                                onClick={() =>
                                  playWordAudio(
                                    apiWords[i].audioUrl,
                                    `${verse.verse.verseKey}-${apiWords[i].id}`,
                                  )
                                }
                                title="Play word audio"
                                aria-label={`Play word audio: ${word}`}
                              >
                                {word}
                              </button>
                            ) : (
                              <span>{word}</span>
                            )}
                            {i < verseWords.length - 1 ? "\u00A0" : null}
                          </span>
                        ))
                      : verse.verse.textUthmani}
                  </span>
                  <button
                    type="button"
                    className={`verse-number-marker verse-number-marker--circle cursor-pointer transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-background ${
                      bookmarkForCurrentChapter?.verseNumber === verse.orderInChapter ? "verse-number-marker--bookmarked" : ""
                    }`}
                    aria-label={`Ayah ${toArabicNumerals(verse.orderInChapter)} – click to bookmark`}
                    title="Bookmark this verse"
                    onClick={() =>
                      chapterId != null &&
                      handleBookmarkAtVerse(verse.verse.verseKey, verse.orderInChapter)
                    }
                  >
                    {toArabicNumerals(verse.orderInChapter)}
                  </button>
                  {" "}
                </Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* Translation display (below Arabic section) */}
      {hasAnyVisibleTranslation ? (
        <div className="rounded-xl border border-white/10 bg-surface-muted/20 p-4" dir="ltr">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Translation
            </p>
            {translationMeta ? (
              <p className="text-xs text-foreground-muted">
                {translationMeta.languageName} • {translationMeta.resourceName}
              </p>
            ) : null}
          </div>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground">
            {visibleVersesForTranslation.map((v) => {
              const t = v.translation;
              if (!t?.text) return null;
              return (
                <div key={v.verse.verseKey} className="flex items-start gap-2">
                  <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center align-middle verse-number-marker verse-number-marker--circle text-[11px] text-black">
                    {v.orderInChapter}
                  </span>
                  <p className="m-0 flex-1">{t.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 0}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span className="text-xs tabular-nums text-foreground-muted">
            Section {safePage + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
          >
            Next
          </button>
        </div>
        {chapterId != null && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === bookmarkForCurrentChapter?.pageIndex}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-foreground transition hover:border-white/20 hover:bg-white/10 disabled:cursor-default disabled:opacity-50 disabled:hover:border-white/10 disabled:hover:bg-white/5"
              onClick={handleSaveBookmark}
              aria-label="Save bookmark at current section"
              title="Bookmark current section"
            >
              <BookmarkCheck
                className={`h-3.5 w-3.5 ${safePage === bookmarkForCurrentChapter?.pageIndex ? "fill-current" : ""}`}
                aria-hidden
              />
              Bookmark
            </button>
            {bookmarkForCurrentChapter != null ? (
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition ${
                  safePage === bookmarkForCurrentChapter.pageIndex
                    ? "border-brand bg-brand/20 text-brand cursor-default"
                    : "border-white/10 bg-white/5 text-foreground hover:border-white/20 hover:bg-white/10"
                }`}
                onClick={handleGoToBookmark}
                aria-label={safePage === bookmarkForCurrentChapter.pageIndex ? "This section is bookmarked" : "Go to bookmarked section"}
                title={
                  safePage === bookmarkForCurrentChapter.pageIndex
                    ? bookmarkForCurrentChapter.verseNumber != null
                      ? `Bookmarked (${toArabicNumerals(bookmarkForCurrentChapter.verseNumber)})`
                      : "Bookmarked"
                    : bookmarkForCurrentChapter.verseNumber != null
                      ? `Go to Section ${bookmarkForCurrentChapter.pageIndex + 1} (${toArabicNumerals(
                          bookmarkForCurrentChapter.verseNumber,
                        )})`
                      : `Go to Section ${bookmarkForCurrentChapter.pageIndex + 1}`
                }
              >
                <Bookmark
                  className={`h-3.5 w-3.5 ${safePage === bookmarkForCurrentChapter.pageIndex ? "fill-current" : ""}`}
                  aria-hidden
                />
                {safePage === bookmarkForCurrentChapter.pageIndex
                  ? bookmarkForCurrentChapter.verseNumber != null
                    ? `Bookmarked (${toArabicNumerals(bookmarkForCurrentChapter.verseNumber)})`
                    : "Bookmarked"
                  : "Go to bookmark"}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Full-screen scrollable preview */}
      {fullScreenOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Full surah full screen preview"
        >
          <div className="flex shrink-0 flex-col gap-2 border-b border-white/10 bg-surface-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:min-w-0 sm:flex-1 sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-4">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {chapterName ?? "Surah"} • Section {fullScreenCurrentSection + 1} of {fullScreenTotalSections}
                </p>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-foreground transition hover:bg-white/10"
                  onClick={() => setFullScreenOpen(false)}
                  aria-label="Close full screen"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {chapterId != null && (
                <div className="flex w-full gap-2 sm:w-auto sm:justify-start">
                  <button
                    type="button"
                    disabled={fullScreenCurrentSection === bookmarkForCurrentChapter?.pageIndex}
                    className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-white/20 hover:bg-white/10 disabled:cursor-default disabled:opacity-50 disabled:hover:border-white/10 disabled:hover:bg-white/5 sm:flex-initial sm:justify-start"
                    onClick={handleSaveBookmarkFullScreen}
                    aria-label="Save bookmark at current section"
                  >
                    <BookmarkCheck
                      className={`h-4 w-4 ${fullScreenCurrentSection === bookmarkForCurrentChapter?.pageIndex ? "fill-current" : ""}`}
                      aria-hidden
                    />
                    Bookmark
                  </button>
                  {bookmarkForCurrentChapter != null ? (
                    <button
                      type="button"
                      className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition sm:flex-initial sm:justify-start ${
                        fullScreenCurrentSection === bookmarkForCurrentChapter.pageIndex
                          ? "border-brand bg-brand/20 text-brand cursor-default"
                          : "border-white/10 bg-white/5 text-foreground hover:border-white/20 hover:bg-white/10"
                      }`}
                      onClick={handleGoToBookmarkFullScreen}
                      aria-label={fullScreenCurrentSection === bookmarkForCurrentChapter.pageIndex ? "This section is bookmarked" : "Go to bookmarked section"}
                      title={
                        fullScreenCurrentSection === bookmarkForCurrentChapter.pageIndex
                          ? bookmarkForCurrentChapter.verseNumber != null
                            ? `Bookmarked (${toArabicNumerals(bookmarkForCurrentChapter.verseNumber)})`
                            : "Bookmarked"
                          : bookmarkForCurrentChapter.verseNumber != null
                            ? `Go to Section ${bookmarkForCurrentChapter.pageIndex + 1} (Verse ${toArabicNumerals(
                                bookmarkForCurrentChapter.verseNumber,
                              )})`
                            : `Go to Section ${bookmarkForCurrentChapter.pageIndex + 1}`
                      }
                    >
                      <Bookmark
                        className={`h-4 w-4 ${fullScreenCurrentSection === bookmarkForCurrentChapter.pageIndex ? "fill-current" : ""}`}
                        aria-hidden
                      />
                      {fullScreenCurrentSection === bookmarkForCurrentChapter.pageIndex
                        ? bookmarkForCurrentChapter.verseNumber != null
                          ? `Bookmarked (${toArabicNumerals(bookmarkForCurrentChapter.verseNumber)})`
                          : "Bookmarked"
                        : "Go to bookmark"}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div
            ref={fullScreenScrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div
              className={`mx-auto max-w-4xl px-4 py-6 pb-12 text-center ${FULL_SURAH_TEXT_SIZES[textSizeIndex]}`}
              dir="rtl"
              style={{ lineHeight: "2.5" }}
            >
              {fullScreenSectionStarts.map((sectionStart, sectionIndex) => {
                const sectionEnd =
                  sectionIndex + 1 < fullScreenSectionStarts.length
                    ? fullScreenSectionStarts[sectionIndex + 1]!
                    : allWordEntries.length;
                const sectionWords = allWordEntries.slice(sectionStart, sectionEnd);
                const sectionVerseKeys = Array.from(
                  new Set(sectionWords.map((w) => w.verseKey)),
                );
                const sectionVerses = sectionVerseKeys
                  .map((k) => verseByKey.get(k))
                  .filter((v): v is CoachSessionVerse => v !== undefined);
                const sectionHasTranslation = sectionVerses.some((v) =>
                  Boolean(v.translation?.text),
                );
                const sectionMeta = sectionVerses.find((v) => v.translation != null)?.translation;
                const lastEntry = sectionWords[sectionWords.length - 1];
                const nextWordAfterSection = allWordEntries[sectionEnd];
                const verseFinishedInSection =
                  lastEntry != null &&
                  (nextWordAfterSection == null ||
                    nextWordAfterSection.verseKey !== lastEntry.verseKey);

                return (
                  <div
                    key={sectionIndex}
                    ref={(el) => {
                      fullScreenSectionRefs.current[sectionIndex] = el;
                    }}
                    data-section-index={sectionIndex}
                    className="py-3"
                  >
                    <p className="mb-1 text-[10px] font-normal text-foreground-muted opacity-80">
                      Section {sectionIndex + 1}
                    </p>
                    <div className="surah-paragraph">
                      {sectionWords.map((entry, i) => {
                        const isHighlighted = entry.verseKey === highlightedVerseKey;
                        const prevEntry = sectionWords[i - 1];
                        const showVerseMarker =
                          !prevEntry || prevEntry.verseKey !== entry.verseKey;
                        const wordKey =
                          entry.wordId != null
                            ? `${entry.verseKey}-${entry.wordId}`
                            : `${entry.verseKey}-${sectionStart + i}`;
                        const baseClassName = isHighlighted
                          ? selectedHighlightOption.textClass
                          : selectedTextOption.textClass;
                        return (
                          <Fragment key={`${entry.verseKey}-${sectionIndex}-${i}`}>
                            {showVerseMarker && prevEntry != null ? (
                              <button
                                type="button"
                                className={`verse-number-marker verse-number-marker--circle cursor-pointer transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-background ${
                                  bookmarkForCurrentChapter?.verseNumber === prevEntry.orderInChapter ? "verse-number-marker--bookmarked" : ""
                                }`}
                                aria-label={`Ayah ${toArabicNumerals(prevEntry.orderInChapter)} – click to bookmark`}
                                title="Bookmark this verse"
                                onClick={() =>
                                  chapterId != null &&
                                  handleBookmarkAtVerse(prevEntry.verseKey, prevEntry.orderInChapter, sectionIndex)
                                }
                              >
                                {toArabicNumerals(prevEntry.orderInChapter)}
                              </button>
                            ) : null}
                            {showVerseMarker && prevEntry != null ? " " : null}
                            <span className={baseClassName}>
                              {entry.audioUrl ? (
                                <button
                                  type="button"
                                  className={`m-0 inline border-0 bg-transparent p-0 font-inherit leading-inherit transition-colors hover:opacity-80 ${playingWordKey === wordKey ? "opacity-100 text-brand" : ""}`}
                                  onClick={() =>
                                    playWordAudio(entry.audioUrl, wordKey)
                                  }
                                  title="Play word audio"
                                  aria-label={`Play word audio: ${entry.word}`}
                                >
                                  {entry.word}
                                </button>
                              ) : (
                                <span>{entry.word}</span>
                              )}
                            </span>
                            {i < sectionWords.length - 1 ? "\u00A0" : null}
                          </Fragment>
                        );
                      })}
                      {sectionWords.length > 0 && verseFinishedInSection ? (
                        <button
                          type="button"
                          className={`verse-number-marker verse-number-marker--circle cursor-pointer transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-background ${
                            bookmarkForCurrentChapter?.verseNumber === sectionWords[sectionWords.length - 1].orderInChapter ? "verse-number-marker--bookmarked" : ""
                          }`}
                          aria-label={`Ayah ${toArabicNumerals(sectionWords[sectionWords.length - 1].orderInChapter)} – click to bookmark`}
                          title="Bookmark this verse"
                          onClick={() => {
                            const last = sectionWords[sectionWords.length - 1];
                            if (chapterId != null) handleBookmarkAtVerse(last.verseKey, last.orderInChapter, sectionIndex);
                          }}
                        >
                          {toArabicNumerals(sectionWords[sectionWords.length - 1].orderInChapter)}
                        </button>
                      ) : null}
                    </div>
                    {sectionHasTranslation ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-surface-muted/20 p-4 text-left" dir="ltr">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                            Translation
                          </p>
                          {sectionMeta ? (
                            <p className="text-[10px] text-foreground-muted">
                              {sectionMeta.languageName} • {sectionMeta.resourceName}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground">
                          {sectionVerses.map((v) => {
                            const t = v.translation;
                            if (!t?.text) return null;
                            return (
                              <div
                                key={v.verse.verseKey}
                                className="flex items-start gap-2"
                              >
                                <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center align-middle verse-number-marker verse-number-marker--circle text-[11px] text-black">
                                  {v.orderInChapter}
                                </span>
                                <p className="m-0 flex-1">{t.text}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
