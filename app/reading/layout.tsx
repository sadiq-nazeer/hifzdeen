import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quran Reading",
  description:
    "Read the full surah with beautiful Arabic text. Quran reading with customizable display.",
};

export default function ReadingLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
