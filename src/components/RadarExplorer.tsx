"use client";

import Link from "next/link";
import { useState } from "react";
import { SectorRadar } from "@/components/SectorRadar";
import { CARD_STATUS_LABELS, INNOVATION_TYPE_LABELS, SECTOR_LABELS } from "@/lib/constants";
import type { Card, RecommendedPath } from "@/lib/types";

export type ExplorerCard = Pick<
  Card,
  | "id"
  | "title"
  | "sector"
  | "readiness"
  | "readinessScale"
  | "type"
  | "status"
  | "creators"
  | "sourceLabel"
  | "confidence"
  | "source"
  | "isClaimed"
> & { quote: string; path: RecommendedPath["name"]; totalScore: number };

function getConfidenceLabel(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function RadarExplorer({ cards }: { cards: ExplorerCard[] }) {
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? null);
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];

  if (!selected) {
    return <p className="text-ink-soft">Radar jest pusty. Zgłoś pierwszą innowację.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap items-stretch gap-7">
        <section aria-label="Radar sektorów" className="flex min-w-0 flex-[3_1_560px] flex-col gap-4 rounded-[32px] border border-line p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-[22px] font-semibold">Sektory PCI</h2>
            <div className="flex flex-wrap gap-4 text-[13px]">
              <span className="flex items-center gap-1.5">
                <span className="size-3.5 rounded-full border border-line bg-teal" />
                technologiczna
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3.5 rounded-full border border-line bg-lime" />
                organizacyjna / społeczna / edukacyjna
              </span>
            </div>
          </div>
          <div className="flex justify-center">
            <SectorRadar cards={cards} selectedId={selected.id} onSelect={setSelectedId} />
          </div>
        </section>

        <aside aria-label="Wybrana innowacja" className="flex min-w-0 flex-[2_1_360px] flex-col gap-4 rounded-[32px] bg-mint p-7">
          <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-dark uppercase">
            {selected.source === "crawler" ? "Wykryte automatycznie" : "Zgłoszone"} · pewność AI {getConfidenceLabel(selected.confidence)}
          </span>
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
          <dl className="flex flex-col gap-3 text-[15px] leading-relaxed">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Twórcy</dt>
              <dd>{selected.creators}</dd>
            </div>
            {selected.quote && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Fragment źródła · {selected.sourceLabel}</dt>
                <dd className="rounded-2xl bg-white px-4 py-3.5 text-sm text-ink-soft">„{selected.quote}”</dd>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Sugerowana ścieżka · ocena {selected.totalScore.toFixed(1)}/5</dt>
              <dd className="font-semibold">{selected.path}</dd>
            </div>
          </dl>
          <div className="mt-auto flex flex-wrap gap-2.5">
            <Link
              href={`/karta/${selected.id}`}
              className="flex min-h-13 flex-[1_1_150px] items-center justify-center rounded-full bg-teal font-display text-[17px] font-semibold text-white no-underline hover:bg-teal-dark"
            >
              Zobacz kartę →
            </Link>
            {!selected.isClaimed && (
              <Link
                href={`/karta/${selected.id}#przejmij`}
                className="flex min-h-13 flex-[1_1_120px] items-center justify-center rounded-full border border-line bg-white text-[15px] font-semibold text-ink no-underline hover:bg-paper"
              >
                To moje
              </Link>
            )}
          </div>
        </aside>
      </div>

      <section aria-label="Lista innowacji" className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-[22px] font-semibold">Najnowsze na radarze</h2>
          <span className="text-[13px] text-ink-soft">kliknij, aby zobaczyć na radarze</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
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
                <span className="flex w-full items-center justify-between">
                  <span className={`size-3.5 rounded-full ${card.type === "technologiczna" ? "bg-teal" : "bg-lime"} ${isSelected ? "ring-3 ring-white" : ""}`} />
                  <span className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${isSelected ? "bg-white text-ink" : "bg-paper text-ink"}`}>
                    {getConfidenceLabel(card.confidence)}
                  </span>
                </span>
                <span className="text-[15px] leading-snug font-semibold">{card.title}</span>
                <span className={`mt-auto text-[13px] ${isSelected ? "text-[#D6D2E3]" : "text-ink-soft"}`}>{card.sourceLabel}</span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
