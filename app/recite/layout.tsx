import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quran Recite",
  description:
    "Read and recite the full surah with beautiful Arabic text. Customize text size and color for optimal reading experience.",
};

export default function ReciteLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
