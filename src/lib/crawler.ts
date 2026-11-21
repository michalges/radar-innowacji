import "server-only";
import { hasApiKey } from "@/lib/openrouter";
import { runPipeline } from "@/lib/pipeline";
import { hasCrawledSource, insertCard, markCrawledSource } from "@/lib/repository";
import { CRAWL_FIXTURES } from "@/lib/seed";

export type CrawlSummary = { published: number; unconfirmed: number; rejected: number; skipped: number; failed: number; source: string; titles: string[]; error?: string };

type CrawlItem = { url: string; label: string; text: string; title: string };

const FEED_SOURCES = [{ url: "https://www.p.lodz.pl/pl/rss.xml", label: "Politechnika Łódzka — aktualności" }];

const MAX_NEW_ITEMS = 5;
const MAX_TEXT_LENGTH = 4000;
const FETCH_TIMEOUT_MS = 10_000;

const HTML_ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&apos;": "'", "&nbsp;": " ", "&amp;": "&" };

function getDecodedEntities(text: string): string {
  return text.replace(/&(lt|gt|quot|#039|apos|nbsp|amp);/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

function getPlainText(html: string): string {
  return getDecodedEntities(getDecodedEntities(html).replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function getTagContent(xml: string, tag: string): string {
  return xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] ?? "";
}

function getFeedItems(xml: string, label: string): CrawlItem[] {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/(item|entry)>/g) ?? [];
  return blocks.flatMap((block) => {
    const title = getPlainText(getTagContent(block, "title"));
    const url = getPlainText(getTagContent(block, "link")) || (block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "");
    const description = getPlainText(getTagContent(block, "description") || getTagContent(block, "summary") || getTagContent(block, "content"));
    if (!title || !url.startsWith("http")) {
      return [];
    }
    return [{ url, label, title, text: `${title}\n\n${description}`.slice(0, MAX_TEXT_LENGTH) }];
  });
}

async function getLiveItems(): Promise<CrawlItem[]> {
  const results = await Promise.allSettled(
    FEED_SOURCES.map(async (feed) => {
      const response = await fetch(feed.url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return getFeedItems(await response.text(), feed.label);
    }),
  );
  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

function getFixtureItems(): CrawlItem[] {
  return CRAWL_FIXTURES.map((fixture) => ({ ...fixture, title: fixture.label }));
}

/** Fetches configured RSS/Atom feeds (fixtures when offline) and runs up to MAX_NEW_ITEMS unseen items through the AI pipeline. */
export async function runCrawler(): Promise<CrawlSummary> {
  const liveItems = await getLiveItems();
  const isLive = liveItems.length > 0;
  const summary: CrawlSummary = { published: 0, unconfirmed: 0, rejected: 0, skipped: 0, failed: 0, source: isLive ? "rss" : "fixtures", titles: [] };
  if (!hasApiKey()) {
    return { ...summary, error: "Brak OPENROUTER_API_KEY" };
  }
  const items = isLive ? liveItems : getFixtureItems();
  let processedCount = 0;
  for (const item of items) {
    if (processedCount >= MAX_NEW_ITEMS || hasCrawledSource(item.url)) {
      summary.skipped++;
      continue;
    }
    processedCount++;
    try {
      const result = await runPipeline(item.text, { source: "crawler", sourceUrl: item.url, sourceLabel: item.label });
      if (result.outcome === "odrzucone") {
        summary.rejected++;
      } else {
        insertCard({ ...result.card, isClaimed: false }, null);
        summary[result.outcome === "opublikowana" ? "published" : "unconfirmed"]++;
        summary.titles.push(result.card.title);
      }
      markCrawledSource(item.url, result.outcome);
    } catch {
      summary.failed++;
    }
  }
  return summary;
}
