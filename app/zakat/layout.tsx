import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zakat Calculator",
  description:
    "Calculate your zakat based on nisab (gold or silver) and your zakatable wealth. A simple guide to fulfill this pillar of Islam.",
};

export default function ZakatLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
