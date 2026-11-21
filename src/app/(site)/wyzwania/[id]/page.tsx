import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SectorRadar } from "@/components/SectorRadar";
import { INNOVATION_TYPE_LABELS, SECTOR_LABELS } from "@/lib/constants";
import { getCards, getChallenge } from "@/lib/repository";
import { getRecommendedPath, getTotalScore } from "@/lib/rules";
import { getCardsForChallenge } from "@/lib/similarity";

async function ChallengeContent({ params }: PageProps<"/wyzwania/[id]">) {
  const { id } = await params;
  const challenge = await getChallenge(id);
  if (!challenge) {
    notFound();
  }
  const matches = getCardsForChallenge(challenge, await getCards(), 5);

  return (
    <>
      <div className="flex flex-col gap-3">
        <span className="text-[13px] text-ink-soft">
          <Link href="/wyzwania">Wyzwania</Link> · {challenge.organization}
        </span>
        <h1 className="font-display text-[clamp(30px,4vw,46px)] leading-tight font-extrabold tracking-tight">{challenge.title}</h1>
        <p className="max-w-190 text-[17px] leading-normal text-ink-soft">{challenge.description}</p>
        {challenge.sector && (
          <span className="self-start rounded-full bg-green-soft px-3 py-1 text-[13px] font-semibold text-green">{SECTOR_LABELS[challenge.sector]}</span>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-7">
        <section className="flex min-w-0 flex-[3_1_420px] flex-col gap-3.5">
          <h2 className="font-display text-[22px] font-semibold">Pasujące pomysły ({matches.length})</h2>
          {matches.length === 0 && (
            <p className="text-ink-soft">Brak dopasowań.</p>
          )}
          {matches.map((match) => (
            <Link
              key={match.item.id}
              href={`/pomysl/${match.item.id}`}
              className="flex flex-col gap-1.5 rounded-2xl border border-line-soft p-4.5 text-ink no-underline hover:border-line frosted"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-lg font-semibold">{match.item.title}</span>
                <span className="text-sm font-semibold text-primary">ocena {getTotalScore(match.item.scores).toFixed(1)}/5</span>
              </span>
              <span className="text-sm text-ink-soft">{match.item.solution}</span>
              <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
                <span className="rounded-full bg-lime-soft px-2.5 py-1 text-olive">{INNOVATION_TYPE_LABELS[match.item.type]}</span>
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary-dark">dlaczego: {match.reasons.join(" · ")}</span>
                <span className="rounded-full bg-paper px-2.5 py-1">ścieżka: {getRecommendedPath(match.item).name}</span>
              </span>
            </Link>
          ))}
        </section>
        <section aria-label="Dopasowania na radarze" className="flex min-w-0 flex-[2_1_340px] justify-center rounded-3xl border border-line p-5 frosted">
          <SectorRadar cards={matches.map((match) => match.item)} selectedId={matches[0]?.item.id} />
        </section>
      </div>
    </>
  );
}

export default function ChallengePage(props: PageProps<"/wyzwania/[id]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Ładuję wyzwanie…</p>}>
      <ChallengeContent {...props} />
    </Suspense>
  );
}
