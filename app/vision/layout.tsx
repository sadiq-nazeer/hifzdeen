import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vision & Roadmap",
  description:
    "HifzDeen product vision: Interactive Coach, Deep Study Companion, and Narrative Journey modes for Quran learning.",
};

export default function VisionLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
