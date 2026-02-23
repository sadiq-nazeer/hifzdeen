import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Your saved Quran collections and bookmarks. Organize verses and surahs for memorization and study.",
};

export default function CollectionsLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
