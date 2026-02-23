import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hifz - Quran Memorization",
  description:
    "Adaptive listen → whisper → recite loops with audio tooling and feedback for effective Quran memorization.",
};

export default function HifzLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
