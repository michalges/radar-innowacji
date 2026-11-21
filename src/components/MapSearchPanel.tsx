"use client";

import Link from "next/link";
import { useState } from "react";
import type { MapSearch } from "@/app/actions";
import type { PlacedHit } from "@/lib/mapSearch";

const GLASS = "glass";

export function MapSearchForm({ initialQuery, isSearching, onSearch }: { initialQuery: string; isSearching: boolean; onSearch: (query: string) => void }) {
  const [query, setQuery] = useState(initialQuery);
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(query.trim());
      }}
      className="flex items-center gap-1.5 rounded-full border border-line bg-white/80 py-1 pr-1 pl-4 transition-shadow focus-within:border-teal focus-within:shadow-[0_0_0_3px_rgb(10_97_120/0.15)]"
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        required
        minLength={3}
        maxLength={300}
        autoComplete="off"
        aria-label="Opisz problem, a pokażemy, gdzie leży na mapie"
        placeholder="Gdzie leży Twój problem?"
        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        disabled={isSearching}
        aria-label="Szukaj na mapie"
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-teal text-white transition-colors hover:bg-teal-dark disabled:cursor-wait disabled:bg-ink-soft"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-5 ${isSearching ? "animate-spin" : ""}`}>
          {isSearching ? (
            <path d="M12 3a9 9 0 1 0 9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>
    </form>
  );
}

type ResultsProps = {
  search: MapSearch;
  visibleHits: PlacedHit[];
  hiddenCount: number;
  minRelevance: number;
  isGap: boolean;
  selectedId: string | null;
  getColor: (clusterIndex: number) => string;
  onMinRelevanceChange: (minRelevance: number) => void;
  onHover: (id: string | null) => void;
  onSelect: (hit: PlacedHit) => void;
  onClear: () => void;
};

export function MapSearchResults({
  search,
  visibleHits,
  hiddenCount,
  minRelevance,
  isGap,
  selectedId,
  getColor,
  onMinRelevanceChange,
  onHover,
  onSelect,
  onClear,
}: ResultsProps) {
  return (
    <section aria-label="Wyniki na mapie" className={`pointer-events-auto flex min-h-0 flex-col gap-2.5 rounded-3xl p-3 sm:gap-3 sm:p-4 ${GLASS}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">
          {search.isAi ? "Dopasowane przez AI" : "Dopasowane po słowach"} · {visibleHits.length}
        </p>
        <button type="button" onClick={onClear} className="-mt-1 -mr-1 cursor-pointer rounded-full px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-white">
          Wyczyść ✕
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
        <span className="flex justify-between">
          <span>Wąsko</span>
          <span className="font-semibold text-ink">Zasięg radaru</span>
          <span>Szeroko</span>
        </span>
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.05}
          value={0.9 - minRelevance}
          onChange={(event) => onMinRelevanceChange(0.9 - Number(event.target.value))}
          className="w-full cursor-pointer accent-teal"
        />
      </label>

      {isGap && (
        <div className="flex flex-col gap-2 rounded-2xl bg-warn-soft p-3.5 text-sm text-warn">
          <b className="font-display text-base">Nikt jeszcze tego nie rozwiązał</b>
          <span>Twój problem leży w pustym obszarze mapy. To szansa na nową innowację.</span>
          <Link href="/zglos" className="self-start rounded-full bg-teal px-3.5 py-1.5 text-xs font-semibold text-white no-underline hover:bg-teal-dark">
            Zgłoś pomysł →
          </Link>
        </div>
      )}

      {visibleHits.length > 0 && (
        <ul className="-mx-1 flex max-h-[20vh] min-h-0 flex-col gap-1 overflow-y-auto px-1 sm:max-h-[30vh] lg:max-h-none">
          {visibleHits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                aria-pressed={selectedId === hit.id}
                onMouseEnter={() => onHover(hit.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(hit.id)}
                onBlur={() => onHover(null)}
                onClick={() => onSelect(hit)}
                className="flex w-full cursor-pointer gap-2.5 rounded-2xl px-2.5 py-1.5 text-left sm:py-2 transition-colors hover:bg-white aria-pressed:bg-white"
              >
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: getColor(hit.node.clusterIndex) }} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{hit.node.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-teal tabular-nums">{Math.round(hit.relevance * 100)}%</span>
                  </span>
                  <span className="hidden text-xs text-ink-soft sm:line-clamp-2">{hit.reason}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <button type="button" onClick={() => onMinRelevanceChange(0)} className="cursor-pointer self-start text-xs font-semibold text-teal-dark hover:underline">
          + {hiddenCount} luźniej powiązanych (poszerz zasięg)
        </button>
      )}
    </section>
  );
}

export function MapSearchSkeleton() {
  return (
    <div aria-label="Radar skanuje mapę" className={`pointer-events-auto flex flex-col gap-2 rounded-3xl p-4 ${GLASS}`}>
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Radar skanuje mapę…</p>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/70" />
      ))}
    </div>
  );
}
