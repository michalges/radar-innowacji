"use client";

import { useState, useTransition } from "react";
import { runCrawl } from "@/app/actions";
import type { CrawlSummary } from "@/lib/crawler";

function getSummaryText(summary: CrawlSummary): string {
  if (summary.error) {
    return `Błąd: ${summary.error}`;
  }
  return `+${summary.published + summary.unconfirmed} nowe · ${summary.rejected} odrzucone`;
}

export function CrawlButton() {
  const [summary, setSummary] = useState<CrawlSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span role="status" className="text-sm text-ink-soft">
        {summary && getSummaryText(summary)}
      </span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => setSummary(await runCrawl()))}
        className="min-h-11 cursor-pointer rounded-full bg-paper px-4 text-sm font-semibold text-ink hover:bg-line-soft disabled:cursor-wait disabled:text-ink-soft"
      >
        {isPending ? "Skanuję…" : "Skanuj źródła"}
      </button>
    </div>
  );
}
