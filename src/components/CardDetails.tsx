import { ScoreRadar } from "@/components/ScoreRadar";
import { CARD_STATUS_LABELS, CRITERION_LABELS, INNOVATION_TYPE_LABELS, SECTOR_LABELS } from "@/lib/constants";
import { getRecommendedPath, getTotalScore, READINESS_RING_LABELS, getReadinessRing } from "@/lib/rules";
import type { Card, CardContent } from "@/lib/types";

const PROFILE_FIELDS: { key: keyof CardContent; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Rozwiązanie" },
  { key: "effect", label: "Efekt" },
  { key: "creators", label: "Twórcy" },
  { key: "institution", label: "Instytucja" },
  { key: "resources", label: "Potrzeby" },
];

export const PANEL_CLASS = "flex min-w-0 flex-col gap-4 rounded-3xl border border-line p-6";

export function CardHeader({ card }: { card: Card }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] text-ink-soft">
        {card.sourceLabel}
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
        {card.status !== "opublikowana" && (
          <span className={`rounded-full px-3 py-1 ${card.status === "niepotwierdzona" ? "bg-warn-soft text-warn" : "bg-paper text-ink"}`}>
            {CARD_STATUS_LABELS[card.status]}
          </span>
        )}
      </div>
    </div>
  );
}

export function CardProfile({ card }: { card: Card }) {
  return (
    <section className={`${PANEL_CLASS} flex-[3_1_380px]`}>
      <dl className="flex flex-col gap-4 text-[15px] leading-relaxed">
        {PROFILE_FIELDS.map((field) => {
          const value = card[field.key];
          if (typeof value !== "string" || !value) {
            return null;
          }
          const quote = card.quotes[field.key];
          return (
            <div key={field.key} className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{field.label}</dt>
              <dd title={quote ? `Źródło: „${quote}”` : undefined}>{value}</dd>
            </div>
          );
        })}
      </dl>
      {card.missing.length > 0 && <p className="text-sm text-warn">Brakuje: {card.missing.join(", ")}</p>}
    </section>
  );
}

export function CardScore({ card }: { card: Card }) {
  return (
    <section className={`${PANEL_CLASS} flex-[2_1_320px]`}>
      <p className="font-display text-3xl font-extrabold text-teal">
        {getTotalScore(card.scores).toFixed(1)}
        <span className="text-sm font-medium text-ink-soft"> / 5</span>
      </p>
      <ScoreRadar scores={card.scores} />
      <ul className="flex flex-col divide-y divide-line-soft text-sm">
        {card.scores.map((score) => (
          <li key={score.criterion}>
            <details className="py-1.5">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3">
                <span>{CRITERION_LABELS[score.criterion]}</span>
                <span className="flex gap-0.5" aria-label={`${score.score} z 5`}>
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <span key={dot} className={`size-2 rounded-full ${dot <= score.score ? "bg-teal" : "bg-line"}`} />
                  ))}
                </span>
              </summary>
              <p className="mt-1 leading-normal text-ink-soft">{score.reason}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CardPath({ card }: { card: Card }) {
  const path = getRecommendedPath(card);
  return (
    <section className={`${PANEL_CLASS} flex-[3_1_380px]`}>
      <h2 className="font-display text-xl font-semibold">{path.name}</h2>
      <ol className="flex flex-col gap-3 text-[15px]">
        {path.steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3.5">
            <span className="flex size-7 flex-none items-center justify-center rounded-full bg-mint text-sm font-bold text-teal-dark">{index + 1}</span>
            <span className="leading-normal">
              {step.title} <span className="text-ink-soft">· {step.owner}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-ink-soft">Cel: {path.kpi}</p>
    </section>
  );
}
