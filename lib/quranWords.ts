import type { VerseWord } from "@/lib/types/quran";

// "end" markers (verse-number glyphs) are excluded from display — FullSurahText
// renders its own verse-number markers and VerseCard doesn't need them.
const EXCLUDE_CHAR_TYPES = new Set(["end"]);

// These token types are kept in the display array as non-clickable spans
// (audioUrl cleared) so their original position is preserved for segment
// index alignment.
const NON_PRONOUNCEABLE_CHAR_TYPES = new Set(["pause", "sajdah", "rub-el-hizb"]);

function isPronounceableWord(word: VerseWord): boolean {
  const text = word.textUthmani.trim();
  const hasAudio = Boolean(word.audioUrl?.trim());
  const charType = word.charTypeName?.trim().toLowerCase();

  if (!text) return false;
  if (!hasAudio) return false;
  if (!charType) return true;
  if (EXCLUDE_CHAR_TYPES.has(charType) || NON_PRONOUNCEABLE_CHAR_TYPES.has(charType))
    return false;
  return charType === "word";
}

/**
 * Prepare verse words for rendering with click-to-play pronunciation.
 *
 * - Verse-end markers (charType "end") are **excluded** entirely; FullSurahText
 *   already renders its own verse-number markers, and VerseCard doesn't need them.
 * - Pause marks, sajdah, and rub-el-hizb tokens are **kept** in the array at
 *   their original positions but with `audioUrl` cleared so they render as
 *   non-interactive spans.
 *
 * Keeping non-pronounceable tokens in position is critical: the audio-segment
 * array from the API may include timing entries for these tokens, so preserving
 * their indices lets `getActiveWordIndex` in VerseCard map segment positions
 * back to the correct word without any off-by-one drift.
 */
export function buildPronounceableVerseWords(words?: VerseWord[]): VerseWord[] {
  if (!words || words.length === 0) return [];

  return words
    .filter((word) => {
      if (!word.textUthmani.trim()) return false;
      const charType = word.charTypeName?.trim().toLowerCase();
      // Drop end markers entirely
      return !charType || !EXCLUDE_CHAR_TYPES.has(charType);
    })
    .map((word) =>
      isPronounceableWord(word) ? word : { ...word, audioUrl: undefined },
    );
}
