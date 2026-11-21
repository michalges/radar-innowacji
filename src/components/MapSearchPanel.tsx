"use client";

import Link from "next/link";
import type { MapSearch } from "@/app/actions";
import { LogoMark } from "@/components/LogoMark";
import type { PlacedHit } from "@/lib/mapSearch";

const GLASS = "glass";

type SearchFormProps = {
  query: string;
  isHero: boolean;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
};

function SearchIcon({ isSearching, className }: { isSearching: boolean; className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} ${isSearching ? "animate-spin" : ""}`}>
      {isSearching ? (
        <path d="M12 3a9 9 0 1 0 9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function MapSearchForm({ query, isHero, isSearching, onQueryChange, onSearch }: SearchFormProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(query.trim());
      }}
      className={`pointer-events-auto flex w-full items-center rounded-full bg-white transition-shadow ${
        isHero
          ? "gap-2 border border-primary/30 py-1 pr-1 pl-3.5 shadow-[0_0_0_5px_rgb(30_64_175/0.06),0_12px_32px_rgb(30_64_175/0.16)] focus-within:border-primary focus-within:shadow-[0_0_0_5px_rgb(30_64_175/0.12),0_12px_32px_rgb(30_64_175/0.2)]"
          : "gap-1.5 border border-line p-0.5 pl-3.5 shadow-[0_6px_20px_rgb(27_21_48/0.1)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgb(30_64_175/0.15),0_6px_20px_rgb(27_21_48/0.1)]"
      }`}
    >
      {isHero && <LogoMark className="size-5 shrink-0" />}
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        required
        minLength={3}
        maxLength={300}
        autoComplete="off"
        aria-label="Opisz problem, a pokażemy, gdzie leży na mapie"
        placeholder={isHero ? "Opisz problem, np. smog przy szkołach" : "Gdzie leży Twój problem?"}
        className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden ${isHero ? "h-11 text-base" : "h-9 text-sm"}`}
      />
      <button
        type="submit"
        disabled={isSearching}
        aria-label="Szukaj na mapie"
        className={`flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:bg-ink-soft ${
          isHero ? "size-10 text-sm sm:h-10 sm:w-auto sm:px-5" : "size-8"
        }`}
      >
        <SearchIcon isSearching={isSearching} className={isHero ? "size-4.5" : "size-4"} />
        {isHero && <span className="hidden sm:inline">Szukaj</span>}
      </button>
    </form>
  );
}

export function MapSearchIntro() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="font-display text-[28px] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-4xl">
        Gdzie leży Twój <span className="text-primary">problem</span>?
      </h1>
      <p className="hidden max-w-lg text-[15px] text-balance text-ink-soft sm:block">
        Opisz go własnymi słowami — radar wskaże podobne pomysły ze szkół, uczelni i urzędów albo pustą lukę do zagospodarowania.
      </p>
    </div>
  );
}

export function MapSearchSuggestions({ suggestions, onPick }: { suggestions: string[]; onPick: (suggestion: string) => void }) {
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <ul aria-label="Przykładowe problemy" className="pointer-events-auto flex flex-wrap justify-center gap-2 max-sm:[&>li:nth-child(n+3)]:hidden">
      {suggestions.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            onClick={() => onPick(suggestion)}
            className={`max-w-64 cursor-pointer truncate rounded-full px-3 py-1 text-[13px] font-medium text-ink transition-colors hover:bg-primary-soft hover:text-primary-dark ${GLASS}`}
          >
            {suggestion}
          </button>
        </li>
      ))}
    </ul>
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
    <section aria-label="Wyniki na mapie" className={`pointer-events-auto flex min-h-0 flex-col gap-2.5 rounded-2xl p-3 ${GLASS}`}>
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
          className="w-full cursor-pointer accent-primary"
        />
      </label>

      {isGap && (
        <div className="flex flex-col gap-2 rounded-2xl bg-warn-soft p-3.5 text-sm text-warn">
          <b className="font-display text-base">Nikt jeszcze tego nie rozwiązał</b>
          <span>Twój problem leży w pustym obszarze mapy. To szansa na nową innowację.</span>
          <Link href="/zglos" className="self-start rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white no-underline hover:bg-primary-dark">
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
                    <span className="shrink-0 text-xs font-semibold text-primary tabular-nums">{Math.round(hit.relevance * 100)}%</span>
                  </span>
                  <span className="hidden text-xs text-ink-soft sm:line-clamp-2">{hit.reason}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <button type="button" onClick={() => onMinRelevanceChange(0)} className="cursor-pointer self-start text-xs font-semibold text-primary-dark hover:underline">
          + {hiddenCount} luźniej powiązanych (poszerz zasięg)
        </button>
      )}
    </section>
  );
}

export function MapSearchSkeleton() {
  return (
    <div aria-label="Radar skanuje mapę" className={`pointer-events-auto flex flex-col gap-2 rounded-2xl p-3 ${GLASS}`}>
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Radar skanuje mapę…</p>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/70" />
      ))}
    </div>
  );
}
