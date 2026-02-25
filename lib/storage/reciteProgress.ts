export type ReciteProgress = {
  chapterId: number;
  pageIndex: number;
};

export type ReciteBookmark = {
  id: string;
  chapterId: number;
  pageIndex: number;
  chapterName?: string;
  createdAt: number;
};

const PROGRESS_STORAGE_KEY = "recite-progress";
const BOOKMARKS_STORAGE_KEY = "recite-bookmarks";
const BOOKMARKS_MAX = 20;

const isBrowser = () => typeof window !== "undefined";

export const readReciteProgress = (): ReciteProgress | null => {
  if (!isBrowser()) {
    return null;
  }
  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ReciteProgress;
    if (
      typeof parsed?.chapterId !== "number" ||
      typeof parsed?.pageIndex !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const writeReciteProgress = (payload: ReciteProgress): void => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(
    PROGRESS_STORAGE_KEY,
    JSON.stringify({ chapterId: payload.chapterId, pageIndex: payload.pageIndex }),
  );
};

export const readReciteBookmarks = (): ReciteBookmark[] => {
  if (!isBrowser()) {
    return [];
  }
  const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as ReciteBookmark[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (b) =>
        b &&
        typeof b.id === "string" &&
        typeof b.chapterId === "number" &&
        typeof b.pageIndex === "number" &&
        typeof b.createdAt === "number",
    );
  } catch {
    return [];
  }
};

export const writeReciteBookmarks = (entries: ReciteBookmark[]): void => {
  if (!isBrowser()) {
    return;
  }
  const capped = entries
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, BOOKMARKS_MAX);
  window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(capped));
};

export const addReciteBookmark = (bookmark: Omit<ReciteBookmark, "id" | "createdAt">): void => {
  const existing = readReciteBookmarks();
  const withoutThisChapter = existing.filter((b) => b.chapterId !== bookmark.chapterId);
  const entry: ReciteBookmark = {
    ...bookmark,
    id: `recite-bm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  writeReciteBookmarks([entry, ...withoutThisChapter]);
};

export const removeReciteBookmark = (id: string): void => {
  const existing = readReciteBookmarks().filter((b) => b.id !== id);
  writeReciteBookmarks(existing);
};
