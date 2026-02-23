import { ArrowRight } from "lucide-react";
import Link from "next/link";

type StatItem = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  href?: string;
};

type HeroProps = {
  title: string;
  description: string;
  stats?: StatItem[];
  className?: string;
  /** Small text shown on clickable cards, e.g. "Explore" or "Try it" */
  cardActionLabel?: string;
};

const statCardClassName =
  "flex flex-col items-start rounded-xl border border-foreground/10 bg-background/50 p-4 backdrop-blur-sm transition hover:border-brand/30 hover:bg-background/70";

export function Hero({
  title,
  description,
  stats,
  className = "",
  cardActionLabel = "Explore",
}: HeroProps) {
  return (
    <header
      className={`islamic-hero header-glow rounded-3xl border border-foreground/10 bg-surface-raised/80 px-8 py-10 backdrop-blur ${className}`}
    >
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground-muted">
        {description}
      </p>

      {stats && stats.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, index) =>
            stat.href ? (
              <Link
                key={index}
                href={stat.href}
                className={`${statCardClassName} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand group`}
              >
                {stat.icon && (
                  <div className="mb-2 text-foreground-muted">{stat.icon}</div>
                )}
                <div className="text-2xl font-bold text-foreground sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-foreground-muted sm:text-sm">
                  {stat.label}
                </div>
                <span className="mt-3 flex items-center gap-1 text-xs font-medium text-brand opacity-80 transition group-hover:opacity-100">
                  {cardActionLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ) : (
              <div key={index} className={statCardClassName}>
                {stat.icon && (
                  <div className="mb-2 text-foreground-muted">{stat.icon}</div>
                )}
                <div className="text-2xl font-bold text-foreground sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-foreground-muted sm:text-sm">
                  {stat.label}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </header>
  );
}
