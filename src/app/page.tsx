import { Suspense } from "react";
import { CrawlButton } from "@/components/CrawlButton";
import { RadarExplorer, type ExplorerCard } from "@/components/RadarExplorer";
import { getCards } from "@/lib/repository";
import { getRecommendedPath, getTotalScore } from "@/lib/rules";
import type { Card } from "@/lib/types";

const WEEK_MS = 7 * 86_400_000;

function getExplorerCard(card: Card): ExplorerCard {
  return {
    id: card.id,
    title: card.title,
    sector: card.sector,
    readiness: card.readiness,
    readinessScale: card.readinessScale,
    type: card.type,
    status: card.status,
    creators: card.creators,
    sourceLabel: card.sourceLabel,
    confidence: card.confidence,
    source: card.source,
    isClaimed: card.isClaimed,
    quote: card.quotes.solution ?? card.quotes.problem ?? "",
    path: getRecommendedPath(card).name,
    totalScore: getTotalScore(card.scores),
  };
}

function StatTile({ value, label, isHighlighted }: { value: number; label: string; isHighlighted?: boolean }) {
  return (
    <div className={`flex min-w-30 flex-col rounded-[18px] px-4.5 py-3 ${isHighlighted ? "bg-mint text-teal-dark" : "border border-line"}`}>
      <span className="font-display text-3xl font-extrabold">{value}</span>
      <span className="text-[13px] text-ink-soft">{label}</span>
    </div>
  );
}

function getRadarStats(cards: Card[]) {
  const now = Date.now();
  return {
    newThisWeek: cards.filter((card) => now - new Date(card.createdAt).getTime() < WEEK_MS).length,
    inContact: cards.filter((card) => card.status === "w-kontakcie" || card.status === "wdrozona").length,
    unconfirmed: cards.filter((card) => card.status === "niepotwierdzona").length,
  };
}

async function RadarContent() {
  const cards = await getCards();
  const { newThisWeek, inContact, unconfirmed } = getRadarStats(cards);

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <StatTile value={newThisWeek} label="nowe w tym tyg." />
        <StatTile value={unconfirmed} label="niepotwierdzone" />
        <StatTile value={inContact} label="w kontakcie / wdrożone" isHighlighted />
      </div>
      <RadarExplorer cards={cards.map(getExplorerCard)} />
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex max-w-180 flex-col gap-2.5">
          <h1 className="font-display text-[clamp(34px,4.5vw,54px)] leading-none font-extrabold tracking-tight">
            Co nowego <span className="text-teal">na radarze?</span>
          </h1>
          <p className="text-[17px] leading-normal text-ink-soft">
            Innowacje wyłapane automatycznie ze stron szkół, BIP-ów, baz patentowych i wyników konkursów — oraz zgłoszone przez twórców.
            Każdą sprawdza i ocenia AI według jawnych kryteriów.
          </p>
        </div>
        <CrawlButton />
      </div>
      <Suspense fallback={<p className="text-ink-soft">Ładuję radar…</p>}>
        <RadarContent />
      </Suspense>
    </>
  );
}
