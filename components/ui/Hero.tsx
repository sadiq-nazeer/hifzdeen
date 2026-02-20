import { Button } from "./Button";

type StatItem = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
};

type HeroProps = {
  title: string;
  description: string;
  showHifzButton?: boolean;
  showZakatButton?: boolean;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  stats?: StatItem[];
  className?: string;
};

export function Hero({
  title,
  description,
  showHifzButton = true,
  showZakatButton = true,
  primaryAction,
  secondaryAction,
  stats,
  className = "",
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
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-start rounded-xl border border-foreground/10 bg-background/50 p-4 backdrop-blur-sm transition hover:border-brand/30 hover:bg-background/70"
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
            </div>
          ))}
        </div>
      )}

      {(showHifzButton || showZakatButton || primaryAction || secondaryAction) && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          {showHifzButton && (
            <Button
              href="/hifz"
              variant="outline"
              size="md"
              className="flex w-full items-center justify-center sm:w-auto"
            >
              Start Memorizing
            </Button>
          )}
          {showZakatButton && (
            <Button
              href="/zakat"
              variant="outline"
              size="md"
              className="flex w-full items-center justify-center sm:w-auto"
            >
              Calculate Zakat
            </Button>
          )}
          {primaryAction && (
            <Button
              href={primaryAction.href}
              variant="outline"
              size="md"
              className="flex w-full items-center justify-center sm:w-auto"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              href={secondaryAction.href}
              variant="outline"
              size="md"
              className="flex w-full items-center justify-center sm:w-auto"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
