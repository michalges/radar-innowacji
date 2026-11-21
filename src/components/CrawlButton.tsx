"use client";

import { useState, useTransition } from "react";
import { runCrawl } from "@/app/actions";
import type { CrawlSummary } from "@/lib/crawler";

function getSummaryText(summary: CrawlSummary): string {
  if (summary.error) {
    return `Błąd skanu: ${summary.error}`;
  }
  return `Opublikowane: ${summary.published} · niepotwierdzone: ${summary.unconfirmed} · odrzucone: ${summary.rejected} · już znane: ${summary.skipped}`;
}

export function CrawlButton() {
  const [summary, setSummary] = useState<CrawlSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => setSummary(await runCrawl()))}
        className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-paper disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Skanuję źródła…" : "Uruchom skan źródeł (demo)"}
      </button>
      <span role="status" className="text-sm text-ink-soft">
        {summary && getSummaryText(summary)}
      </span>
    </div>
  );
}
