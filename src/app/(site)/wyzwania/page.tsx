import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchBox } from "@/components/SearchBox";
import { INNOVATION_TYPE_LABELS } from "@/lib/constants";
import { getCards, getChallenges } from "@/lib/repository";
import { getTotalScore } from "@/lib/rules";
import { getSearchOutcome } from "@/lib/search";

export const metadata: Metadata = { title: "Znajdź rozwiązanie · Radar Innowacji" };

const SUGGESTION_COUNT = 5;

function getQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

async function Suggestions() {
  const challenges = await getChallenges();
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {challenges.slice(0, SUGGESTION_COUNT).map((challenge) => (
        <li key={challenge.id}>
          <Link
            href={`/wyzwania?q=${encodeURIComponent(challenge.title)}`}
            className="block max-w-72 truncate rounded-full border border-line bg-white/60 px-4 py-2 text-sm font-medium text-ink no-underline transition-colors hover:border-teal hover:bg-mint"
          >
            {challenge.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function Results({ query }: { query: string }) {
  const { results, isAi } = await getSearchOutcome(query, await getCards());
  if (results.length === 0) {
    return <p className="text-center text-ink-soft">Nie znaleźliśmy pasujących pomysłów. Spróbuj opisać problem innymi słowami.</p>;
  }
  return (
    <section aria-label="Wyniki wyszukiwania" className="flex flex-col gap-3">
      <p className="px-2 text-xs font-semibold tracking-wider text-muted uppercase">
        {isAi ? "Dopasowane przez AI" : "Dopasowane po słowach kluczowych"} · {results.length}
      </p>
      <ul className="flex flex-col gap-3">
        {results.map(({ card, reason }) => (
          <li key={card.id}>
            <Link
              href={`/pomysl/${card.id}`}
              className="flex flex-col gap-2 rounded-3xl border border-line-soft bg-white p-5 text-ink no-underline transition-colors hover:border-teal"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-lg font-semibold">{card.title}</span>
                <span className="text-sm font-semibold text-teal">{getTotalScore(card.scores).toFixed(1)}/5</span>
              </span>
              <span className="text-[15px] text-ink-soft">{reason}</span>
              <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
                <span className="rounded-full bg-mint px-2.5 py-1 text-teal-dark">{INNOVATION_TYPE_LABELS[card.type]}</span>
                {card.institution && <span className="rounded-full bg-paper px-2.5 py-1">{card.institution}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-label="Szukam…" className="flex flex-col gap-3">
      <p className="px-2 text-xs font-semibold tracking-wider text-muted uppercase">AI przegląda pomysły…</p>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-28 animate-pulse rounded-3xl bg-paper" />
      ))}
    </div>
  );
}

async function SearchView({ searchParams }: PageProps<"/wyzwania">) {
  const query = getQuery((await searchParams).q);
  const hasQuery = query.length > 0;
  return (
    <div className={`mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 ${hasQuery ? "pt-4" : "justify-center pb-[12vh]"}`}>
      {!hasQuery && (
        <h1 className="text-center font-display text-[clamp(32px,5vw,52px)] leading-[1.05] font-extrabold tracking-tight text-balance">
          Jaki problem <span className="text-teal">chcesz rozwiązać?</span>
        </h1>
      )}
      <SearchBox query={query} />
      {hasQuery ? (
        <Suspense key={query} fallback={<ResultsSkeleton />}>
          <Results query={query} />
        </Suspense>
      ) : (
        <Suspense fallback={null}>
          <Suggestions />
        </Suspense>
      )}
    </div>
  );
}

export default function ChallengesPage(props: PageProps<"/wyzwania">) {
  return (
    <Suspense fallback={<SearchBox query="" />}>
      <SearchView {...props} />
    </Suspense>
  );
}
