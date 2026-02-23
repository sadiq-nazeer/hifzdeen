import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quran Listening",
  description:
    "Listen to beautiful Quran recitations from renowned reciters. Play full surahs or specific verses with advanced audio controls.",
};

export default function ListeningLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
