import { type ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  /** Optional: use a custom element instead of div */
  as?: "div" | "span";
};

/**
 * Animated placeholder for loading states. Use with a fixed or percentage width/height
 * so the skeleton has a visible shape.
 */
export function Skeleton({
  className = "",
  as: Component = "div",
}: SkeletonProps): ReactNode {
  return (
    <Component
      className={`animate-pulse rounded-md bg-foreground/10 ${className}`}
      aria-hidden
    />
  );
}
