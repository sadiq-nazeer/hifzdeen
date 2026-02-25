import { BookOpen, Calculator, Headphones, GraduationCap, Sparkles, Book, Mic } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Hero } from "@/components/ui/Hero";
import { Section } from "@/components/ui/Section";

const features = [
  {
    title: "Hifz - Quran Memorization",
    description:
      "Adaptive listen → whisper → recite loops with audio tooling and feedback for effective memorization.",
    href: "/hifz",
    icon: <GraduationCap className="h-6 w-6" />,
    cta: "Start Hifz",
  },
  {
    title: "Quran Recite",
    description:
      "Read and recite the full surah with beautiful Arabic text. Customize text size and color for optimal reading experience.",
    href: "/recite",
    icon: <BookOpen className="h-6 w-6" />,
    cta: "Start Reciting",
  },
  {
    title: "Quran Listening",
    description:
      "Listen to beautiful recitations from renowned reciters. Play full surahs or specific verses with advanced audio controls.",
    href: "/listening",
    icon: <Headphones className="h-6 w-6" />,
    cta: "Start Listening",
  },
  {
    title: "Zakat Calculator",
    description:
      "Calculate your zakat based on nisab (gold or silver) and your zakatable wealth. A simple guide to fulfill this pillar of Islam.",
    href: "/zakat",
    icon: <Calculator className="h-6 w-6" />,
    cta: "Calculate Zakat",
  },
];

const upcomingFeatures = [
  {
    title: "Hadith Collections (Coming Soon)",
    description:
      "Browse and study authentic Hadith collections with clear translations and references. This feature will be available soon, in shaa Allah.",
    href: "#",
    cta: "Coming Soon",
  },
  {
    title: "Islamic Stories (Coming Soon)",
    description:
      "Discover inspiring stories from the lives of the Prophets, companions, and righteous people. This feature will be available soon, in shaa Allah.",
    href: "#",
    cta: "Coming Soon",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ signin?: string }>;
}) {
  const params = await searchParams;
  const signinFailed = params?.signin === "failed";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 pb-16 pt-6 lg:px-12">
      {signinFailed && (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
          role="alert"
        >
          Sign-in didn’t complete. Please try again or use the same browser where you started sign-in.
          {" "}
          <a href="/api/auth/login" className="font-medium underline underline-offset-2">
            Sign in again
          </a>
        </div>
      )}
      <Hero
        title="HifzDeen"
        description="A simple, modern platform for Quran, Hadith, stories, and other Islamic content, with clear translations and helpful tools for everyday use."
        stats={[
          {
            label: "Surahs with Translations",
            value: "114",
            icon: <Book className="h-5 w-5" />,
            href: "/recite",
          },
          {
            label: "Memorization made easy",
            value: "Simple",
            icon: <Sparkles className="h-5 w-5" />,
            href: "/hifz",
          },
          {
            label: "Reciters",
            value: "Multiple",
            icon: <Mic className="h-5 w-5" />,
            href: "/listening",
          },
          {
            label: "Calculator",
            value: "Zakat",
            icon: <Calculator className="h-5 w-5" />,
            href: "/zakat",
          },
        ]}
      />

      <Section
        id="explore-features"
        title="Explore Features"
        subtitle="Choose how you want to engage with the Quran"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section
        title="Hadiths & Islamic Stories"
        subtitle="Authentic Hadith collections and inspiring Islamic stories (coming soon)"
        className="border-t border-foreground/10 pt-12"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {upcomingFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              icon={<Sparkles className="h-6 w-6" />}
            />
          ))}
        </div>
      </Section>

      <footer className="mt-4 border-t border-foreground/10 pt-4 text-xs text-foreground-muted">
        <p className="text-center">
          Developed with love ❤️ for the Quran by{" "}
          <Link
            href="https://www.sadiqn.com"
            className="font-medium text-foreground underline-offset-4 hover:text-brand hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Sadiq Nazeer
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
