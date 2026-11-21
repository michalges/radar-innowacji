import { Suspense } from "react";
import { PANEL_CLASS } from "@/components/CardDetails";
import { getFundingCalls, getFundingForCard } from "@/lib/funding";
import type { Card } from "@/lib/types";

async function FundingList({ card }: { card: Card }) {
  const matches = getFundingForCard(card, await getFundingCalls());
  if (matches.length === 0) {
    return <p className="text-sm text-ink-soft">Brak naborów.</p>;
  }
  return matches.map(({ call, reason }) => (
    <a
      key={call.id}
      href={call.url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-0.5 rounded-xl border border-line p-3 text-ink no-underline hover:bg-paper"
    >
      <span className="line-clamp-2 text-sm font-semibold">{call.title} ↗</span>
      <span className="text-xs text-ink-soft">
        {call.source}
        {call.deadline && ` · do ${call.deadline}`}
      </span>
      <span className="text-xs text-teal">{reason}</span>
    </a>
  ));
}

export function FundingPanel({ card }: { card: Card }) {
  return (
    <section className={`${PANEL_CLASS} flex-[2_1_320px]`}>
      <h2 className="font-display text-xl font-semibold">Finansowanie</h2>
      <Suspense fallback={<p className="text-sm text-ink-soft">Szukam naborów…</p>}>
        <FundingList card={card} />
      </Suspense>
    </section>
  );
}
