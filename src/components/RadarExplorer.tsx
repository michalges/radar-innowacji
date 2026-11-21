"use client";

import Link from "next/link";
import { useState } from "react";
import { SectorRadar } from "@/components/SectorRadar";
import { TypeLegend } from "@/components/TypeLegend";
import { CARD_STATUS_LABELS, INNOVATION_TYPE_LABELS, SECTOR_LABELS } from "@/lib/constants";
import type { Card, RecommendedPath } from "@/lib/types";

export type ExplorerCard = Pick<
  Card,
  "id" | "title" | "sector" | "readiness" | "readinessScale" | "type" | "status" | "sourceLabel" | "confidence" | "isClaimed"
> & { quote: string; path: RecommendedPath["name"]; totalScore: number };

export function RadarExplorer({ cards }: { cards: ExplorerCard[] }) {
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? null);
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];

  if (!selected) {
    return <p className="text-ink-soft">Brak pomysłów. Zgłoś pierwszy.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap items-stretch gap-7">
        <section aria-label="Radar" className="flex min-w-0 flex-[3_1_560px] flex-col items-center gap-3 rounded-[32px] border border-line p-6">
          <SectorRadar cards={cards} selectedId={selected.id} onSelect={setSelectedId} />
          <TypeLegend />
        </section>

        <aside aria-label="Wybrany pomysł" className="flex min-w-0 flex-[2_1_340px] flex-col gap-4 rounded-[32px] bg-mint p-7">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight">{selected.title}</h2>
          <div className="flex flex-wrap gap-1.5 text-[13px] font-semibold">
            <span className="rounded-full bg-lime-soft px-3 py-1 text-olive">{INNOVATION_TYPE_LABELS[selected.type]}</span>
            <span className="rounded-full bg-white px-3 py-1 text-teal-dark">
              {selected.readinessScale} {selected.readiness}
            </span>
            <span className="rounded-full bg-green-soft px-3 py-1 text-green">{SECTOR_LABELS[selected.sector]}</span>
            {selected.status !== "opublikowana" && (
              <span className="rounded-full bg-warn-soft px-3 py-1 text-warn">{CARD_STATUS_LABELS[selected.status]}</span>
            )}
          </div>
          {selected.quote && <p className="rounded-2xl bg-white px-4 py-3.5 text-[15px] leading-relaxed text-ink-soft">„{selected.quote}”</p>}
          <p className="text-[15px]">
            <span className="font-display text-2xl font-extrabold text-teal">{selected.totalScore.toFixed(1)}</span>
            <span className="text-ink-soft"> /5 · </span>
            <b>{selected.path}</b>
          </p>
          <Link
            href={`/pomysl/${selected.id}`}
            className="mt-auto flex min-h-13 items-center justify-center rounded-full bg-teal font-display text-[17px] font-semibold text-white no-underline hover:bg-teal-dark"
          >
            Szczegóły →
          </Link>
        </aside>
      </div>

      <section aria-label="Lista pomysłów" className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
        {cards.map((card) => {
          const isSelected = card.id === selected.id;
          return (
            <button
              key={card.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedId(card.id)}
              className={`flex h-full cursor-pointer flex-col gap-2.5 rounded-[20px] border p-4.5 text-left ${isSelected ? "border-ink bg-ink text-white" : "border-line-soft bg-white text-ink hover:border-line"}`}
            >
              <span className={`size-3.5 rounded-full ${card.type === "technologiczna" ? "bg-teal" : "bg-lime"} ${isSelected ? "ring-3 ring-white" : ""}`} />
              <span className="text-[15px] leading-snug font-semibold">{card.title}</span>
              <span className={`mt-auto text-[13px] ${isSelected ? "text-white/80" : "text-ink-soft"}`}>{card.sourceLabel}</span>
            </button>
          );
        })}
      </section>
    </>
  );
}
