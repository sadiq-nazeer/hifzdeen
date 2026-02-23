import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Coach",
  description:
    "Guided memorization coach with listen, whisper, recite drills and reflection. Adaptive Quran memorization journeys.",
};

export default function CoachLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
