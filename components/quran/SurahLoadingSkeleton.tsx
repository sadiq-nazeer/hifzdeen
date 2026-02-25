"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Skeleton loading state that mirrors the surah content layout:
 * toolbar row, verse-style text block, and pagination.
 */
export function SurahLoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading surah">
      <span className="sr-only">Loading surah…</span>
      <Card variant="raised" className="px-1.5 py-2 sm:px-3 sm:py-4 md:px-6 md:py-6">
      <div className="space-y-4">
        {/* Toolbar: ayats label + controls */}
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[7rem] rounded-lg" />
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>

        {/* Main content: verse-like lines (RTL-style block) */}
        <div className="rounded-xl border border-white/10 bg-surface-muted/30 p-4">
          <div className="space-y-4 text-center" dir="rtl">
            <Skeleton className="mx-auto h-6 w-full max-w-2xl" />
            <Skeleton className="mx-auto h-6 w-[85%] max-w-xl" />
            <Skeleton className="mx-auto h-6 w-[90%] max-w-2xl" />
            <Skeleton className="mx-auto h-6 w-[70%] max-w-lg" />
            <Skeleton className="mx-auto h-6 w-full max-w-2xl" />
            <Skeleton className="mx-auto h-6 w-[80%] max-w-xl" />
            <Skeleton className="mx-auto h-6 w-[75%] max-w-lg" />
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-14 rounded-lg" />
        </div>
      </div>
      </Card>
    </div>
  );
}
