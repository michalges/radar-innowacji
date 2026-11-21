import "server-only";
import { z } from "zod";
import { getChatCompletion, getJsonFromText, getModels, hasApiKey } from "@/lib/openrouter";
import { logAiCall } from "@/lib/repository";
import { getCardsForQuery } from "@/lib/similarity";
import type { Card } from "@/lib/types";

const PROMPT_VERSION = "search-v2";
const MAX_RESULTS = 8;
const SNIPPET_LENGTH = 180;

export type SearchResult = { card: Card; reason: string; relevance: number };
export type SearchOutcome = { results: SearchResult[]; isAi: boolean };

const searchResponseSchema = z.object({
  matches: z.array(z.object({ id: z.string(), reason: z.string(), relevance: z.number().min(0).max(1) })),
});

const SYSTEM_PROMPT = `Jesteś wyszukiwarką pomysłów innowacyjnych ze szkół, uczelni i urzędów.
Użytkownik opisuje problem lub czego szuka. Z listy pomysłów wybierz maksymalnie ${MAX_RESULTS}, które realnie pomagają, od najlepiej pasującego.
Pomiń pomysły, które łączy z zapytaniem tylko przypadkowe słowo. Jeśli nic nie pasuje, zwróć pustą listę.
reason: jedno zdanie po polsku (do 140 znaków), jak ten pomysł odpowiada na zapytanie.
relevance: 0–1, jak bardzo pomysł rozwiązuje problem (0.9+ wprost, 0.6 częściowo, poniżej 0.4 luźny związek).
Format: {"matches":[{"id":"","reason":"","relevance":0.8}]}`;

function getSnippet(text: string): string {
  return text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}…` : text;
}

function getCardListing(cards: Card[]): string {
  return cards
    .map((card) => `id=${card.id} | ${card.title} | problem: ${getSnippet(card.problem)} | rozwiązanie: ${getSnippet(card.solution)} | tagi: ${card.tags.join(", ")}`)
    .join("\n");
}

function getKeywordOutcome(query: string, cards: Card[]): SearchOutcome {
  const matches = getCardsForQuery(query, cards, MAX_RESULTS);
  const topSimilarity = matches[0]?.similarity ?? 1;
  const results = matches.map((match) => ({
    card: match.item,
    reason: match.reasons.join(" · "),
    relevance: Math.min(0.9, (match.similarity / topSimilarity) * Math.min(1, topSimilarity * 4)),
  }));
  return { results, isAi: false };
}

async function getAiOutcome(query: string, cards: Card[]): Promise<SearchOutcome> {
  const { primary } = getModels();
  const content = await getChatCompletion(primary, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Zapytanie:\n"""\n${query}\n"""\n\nPomysły:\n${getCardListing(cards)}` },
  ]);
  logAiCall(primary, PROMPT_VERSION, query, content);
  const { matches } = searchResponseSchema.parse(getJsonFromText(content));
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const results = matches.flatMap((match) => {
    const card = cardsById.get(match.id);
    return card ? [{ card, reason: match.reason, relevance: match.relevance }] : [];
  });
  return { results: results.toSorted((first, second) => second.relevance - first.relevance).slice(0, MAX_RESULTS), isAi: true };
}

/** Ranks ideas against a free-text query with the model; falls back to keyword matching without an API key or on failure. */
export async function getSearchOutcome(query: string, cards: Card[]): Promise<SearchOutcome> {
  if (!hasApiKey()) {
    return getKeywordOutcome(query, cards);
  }
  try {
    return await getAiOutcome(query, cards);
  } catch {
    return getKeywordOutcome(query, cards);
  }
}
