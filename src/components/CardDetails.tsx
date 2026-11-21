import Link from "next/link";
import { ScoreRadar } from "@/components/ScoreRadar";
import {
  CARD_STATUS_LABELS,
  CRITERION_LABELS,
  INNOVATION_TYPE_LABELS,
  SECTOR_LABELS,
} from "@/lib/constants";
import { getRecommendedPath, getTotalScore, READINESS_RING_LABELS, getReadinessRing } from "@/lib/rules";
import type { Card, CardContent } from "@/lib/types";

const PROFILE_FIELDS: { key: keyof CardContent; label: string; isWide?: boolean }[] = [
  { key: "problem", label: "Problem", isWide: true },
  { key: "solution", label: "Rozwiązanie", isWide: true },
  { key: "effect", label: "Efekt", isWide: true },
  { key: "creators", label: "Twórcy" },
  { key: "institution", label: "Instytucja" },
  { key: "region", label: "Region" },
  { key: "resources", label: "Potrzebne zasoby" },
];

export const PANEL_CLASS = "flex min-w-0 flex-col gap-4 rounded-3xl border border-line p-6";

export function CardHeader({ card }: { card: Card }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] text-ink-soft">
        {card.source === "crawler" ? "Wykryte automatycznie" : "Zgłoszenie"} · {card.sourceLabel}
        {card.sourceUrl && (
          <>
            {" · "}
            <a href={card.sourceUrl} rel="noreferrer" target="_blank">
              źródło
            </a>
          </>
        )}
      </span>
      <h1 className="font-display text-[clamp(30px,4vw,46px)] leading-tight font-extrabold tracking-tight">{card.title}</h1>
      <div className="flex flex-wrap gap-1.5 text-[13px] font-semibold">
        <span className="rounded-full bg-lime-soft px-3 py-1 text-olive">{INNOVATION_TYPE_LABELS[card.type]}</span>
        <span className="rounded-full bg-mint px-3 py-1 text-teal-dark">
          {card.readinessScale} {card.readiness} · {READINESS_RING_LABELS[getReadinessRing(card.readiness)]}
        </span>
        <span className="rounded-full bg-green-soft px-3 py-1 text-green">{SECTOR_LABELS[card.sector]}</span>
        <span className={`rounded-full px-3 py-1 ${card.status === "niepotwierdzona" ? "bg-warn-soft text-warn" : "bg-paper text-ink"}`}>
          {CARD_STATUS_LABELS[card.status]}
        </span>
        <span className="rounded-full bg-paper px-3 py-1 text-ink">pewność AI {Math.round(card.confidence * 100)}%</span>
        {card.isYoungCreator && <span className="rounded-full bg-paper px-3 py-1 text-ink">Twórcy 16–30</span>}
      </div>
    </div>
  );
}

export function CardProfile({ card }: { card: Card }) {
  return (
    <section className={`${PANEL_CLASS} flex-[3_1_380px]`}>
      <h2 className="font-display text-xl font-semibold">Profil innowacji</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-[15px] leading-relaxed sm:grid-cols-2">
        {PROFILE_FIELDS.map((field) => {
          const value = card[field.key];
          if (typeof value !== "string" || !value) {
            return null;
          }
          const quote = card.quotes[field.key];
          return (
            <div key={field.key} className={`flex flex-col gap-1 ${field.isWide ? "sm:col-span-2" : ""}`}>
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{field.label}</dt>
              <dd>{value}</dd>
              {quote && <dd className="border-l-0 text-[13px] text-ink-soft italic">źródło: „{quote}”</dd>}
            </div>
          );
        })}
      </dl>
      {card.missing.length > 0 && (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          <b>Brakuje:</b> {card.missing.join(" · ")}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {card.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-paper px-3 py-1 text-[13px] text-ink-soft">
            #{tag}
          </span>
        ))}
      </div>
    </section>
  );
}

export function CardScore({ card }: { card: Card }) {
  return (
    <section className={`${PANEL_CLASS} flex-[2_1_320px]`}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold">Ocena</h2>
        <span className="font-display text-3xl font-extrabold text-teal">
          {getTotalScore(card.scores).toFixed(1)}
          <span className="text-sm font-medium text-ink-soft"> / 5</span>
        </span>
      </div>
      <ScoreRadar scores={card.scores} />
      <ul className="flex flex-col divide-y divide-line-soft text-sm">
        {card.scores.map((score) => (
          <li key={score.criterion}>
            <details className="group py-2">
              <summary className="flex min-h-8 cursor-pointer items-center justify-between gap-3 list-none">
                <span>{CRITERION_LABELS[score.criterion]}</span>
                <span className="flex items-center gap-2">
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <span key={dot} className={`size-2 rounded-full ${dot <= score.score ? "bg-teal" : "bg-line"}`} />
                    ))}
                  </span>
                  <b className="w-3 text-right">{score.score}</b>
                </span>
              </summary>
              <p className="mt-1.5 leading-normal text-ink-soft">{score.reason}</p>
              {score.evidence && <p className="mt-1 text-[13px] text-muted italic">„{score.evidence}”</p>}
            </details>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Ocena: model {card.model}. <Link href="/kryteria">Jak oceniamy?</Link>
      </p>
    </section>
  );
}

export function CardPath({ card }: { card: Card }) {
  const path = getRecommendedPath(card);
  return (
    <section className={`${PANEL_CLASS} flex-[3_1_380px]`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">Ścieżka: {path.name}</h2>
        <span className="text-xs text-muted">reguła: {path.rule}</span>
      </div>
      <ol className="flex flex-col gap-3 text-[15px]">
        {path.steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3.5">
            <span className="flex size-7 flex-none items-center justify-center rounded-full bg-mint text-sm font-bold text-teal-dark">{index + 1}</span>
            <span className="leading-normal">
              <b>{step.title}</b> <span className="text-ink-soft">· {step.owner}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="rounded-xl bg-paper px-4 py-3 text-sm">
        <b>Miernik sukcesu:</b> {path.kpi}
      </p>
    </section>
  );
}
