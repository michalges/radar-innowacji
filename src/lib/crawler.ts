import "server-only";
import { hasApiKey } from "@/lib/openrouter";
import { runPipeline } from "@/lib/pipeline";
import { hasCrawledSource, insertCard, markCrawledSource } from "@/lib/repository";
import { CRAWL_FIXTURES } from "@/lib/seed";

export type CrawlSummary = { published: number; unconfirmed: number; rejected: number; skipped: number; error?: string };

/** Demo crawler: runs the fixture news items through the AI pipeline, each source URL only once. */
export async function runCrawler(): Promise<CrawlSummary> {
  const summary: CrawlSummary = { published: 0, unconfirmed: 0, rejected: 0, skipped: 0 };
  if (!hasApiKey()) {
    return { ...summary, error: "Brak OPENROUTER_API_KEY" };
  }
  for (const fixture of CRAWL_FIXTURES) {
    if (hasCrawledSource(fixture.url)) {
      summary.skipped++;
      continue;
    }
    try {
      const result = await runPipeline(fixture.text, { source: "crawler", sourceUrl: fixture.url, sourceLabel: fixture.label });
      if (result.outcome === "odrzucone") {
        summary.rejected++;
      } else {
        insertCard({ ...result.card, isClaimed: false }, null);
        summary[result.outcome === "opublikowana" ? "published" : "unconfirmed"]++;
      }
      markCrawledSource(fixture.url, result.outcome);
    } catch (error) {
      return { ...summary, error: error instanceof Error ? error.message : "Nieznany błąd" };
    }
  }
  return summary;
}
