import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PANEL_CLASS } from "@/components/CardDetails";
import { ChallengeForm } from "@/components/ChallengeForm";
import { SECTOR_LABELS } from "@/lib/constants";
import { getCards, getChallenges } from "@/lib/repository";
import { getCardsForChallenge } from "@/lib/similarity";

export const metadata: Metadata = { title: "Wyzwania · Radar Innowacji" };

async function ChallengeList() {
  const [challenges, cards] = await Promise.all([getChallenges(), getCards()]);
  return (
    <ul className="flex flex-col gap-3">
      {challenges.map((challenge) => (
        <li key={challenge.id}>
          <Link
            href={`/wyzwania/${challenge.id}`}
            className="flex flex-col gap-1 rounded-2xl border border-line-soft p-4.5 text-ink no-underline hover:border-line"
          >
            <span className="font-display text-lg font-semibold">{challenge.title}</span>
            <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
              <span className="rounded-full bg-paper px-2.5 py-1">{challenge.organization}</span>
              {challenge.sector && <span className="rounded-full bg-green-soft px-2.5 py-1 text-green">{SECTOR_LABELS[challenge.sector]}</span>}
              <span className="rounded-full bg-mint px-2.5 py-1 text-teal-dark">{getCardsForChallenge(challenge, cards).length} pasujące</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ChallengesPage() {
  return (
    <>
      <h1 className="font-display text-[clamp(34px,4.5vw,54px)] leading-none font-extrabold tracking-tight">
        Szukasz rozwiązania? <span className="text-teal">Opisz problem.</span>
      </h1>
      <div className="flex flex-wrap items-start gap-7">
        <section className="flex min-w-0 flex-[3_1_420px] flex-col gap-4">
          <Suspense fallback={<p className="text-ink-soft">Ładuję…</p>}>
            <ChallengeList />
          </Suspense>
        </section>
        <section className={`${PANEL_CLASS} flex-[2_1_360px] bg-mint`}>
          <h2 className="font-display text-[22px] font-semibold">Nowe wyzwanie</h2>
          <ChallengeForm />
        </section>
      </div>
    </>
  );
}
