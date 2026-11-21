import { Suspense } from "react";
import { CrawlButton } from "@/components/CrawlButton";
import { RadarExplorer, type ExplorerCard } from "@/components/RadarExplorer";
import { getCards } from "@/lib/repository";
import { getRecommendedPath, getTotalScore } from "@/lib/rules";
import type { Card } from "@/lib/types";

function getExplorerCard(card: Card): ExplorerCard {
  return {
    id: card.id,
    title: card.title,
    sector: card.sector,
    readiness: card.readiness,
    readinessScale: card.readinessScale,
    type: card.type,
    status: card.status,
    sourceLabel: card.sourceLabel,
    confidence: card.confidence,
    isClaimed: card.isClaimed,
    quote: card.quotes.solution ?? card.quotes.problem ?? "",
    path: getRecommendedPath(card).name,
    totalScore: getTotalScore(card.scores),
  };
}

async function RadarContent() {
  const cards = await getCards();
  return <RadarExplorer cards={cards.map(getExplorerCard)} />;
}

export default function HomePage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[clamp(34px,4.5vw,54px)] leading-none font-extrabold tracking-tight">
            Co nowego <span className="text-teal">na radarze?</span>
          </h1>
          <p className="text-[17px] text-ink-soft">Pomysły ze szkół, uczelni i urzędów regionu.</p>
        </div>
        <CrawlButton />
      </div>
      <Suspense fallback={<p className="text-ink-soft">Ładuję…</p>}>
        <RadarContent />
      </Suspense>
    </>
  );
}
