import { DUPLICATE_SIMILARITY, MATCH_SIMILARITY, SECTOR_LABELS } from "@/lib/constants";
import type { Card, Challenge, Match } from "@/lib/types";

const STOPWORDS = new Set(
  "a aby ale albo bez by być czy dla do go i ich im jak jest jego jej już lub ma mi na nad nie o od oraz po pod przez przy się są ta tak te to tu w we z za ze że który która które jako tym tej tego co oraz także można".split(
    " ",
  ),
);

const STEM_LENGTH = 6;

function getTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
    .map((token) => token.slice(0, STEM_LENGTH));
}

function getCardText(card: Card): string {
  return [card.title, card.problem, card.solution, card.tags.join(" "), card.tags.join(" ")].join(" ");
}

function getChallengeText(challenge: Challenge): string {
  return [challenge.title, challenge.title, challenge.description].join(" ");
}

type Vector = Map<string, number>;

function getVectors(texts: string[]): Vector[] {
  const tokenLists = texts.map(getTokens);
  const documentFrequency = new Map<string, number>();
  for (const tokens of tokenLists) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  return tokenLists.map((tokens) => {
    const vector: Vector = new Map();
    for (const token of tokens) {
      vector.set(token, (vector.get(token) ?? 0) + 1);
    }
    for (const [token, count] of vector) {
      const inverseFrequency = Math.log((texts.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1;
      vector.set(token, count * inverseFrequency);
    }
    return vector;
  });
}

function getCosine(first: Vector, second: Vector): number {
  let dot = 0;
  let firstNorm = 0;
  let secondNorm = 0;
  for (const [token, weight] of first) {
    firstNorm += weight * weight;
    dot += weight * (second.get(token) ?? 0);
  }
  for (const weight of second.values()) {
    secondNorm += weight * weight;
  }
  return firstNorm && secondNorm ? dot / Math.sqrt(firstNorm * secondNorm) : 0;
}

function getSharedWords(firstText: string, secondText: string): string[] {
  const secondTokens = new Set(getTokens(secondText));
  const shared = new Set<string>();
  for (const word of firstText.toLowerCase().split(/[^\p{L}0-9.]+/u)) {
    const [stem] = getTokens(word);
    if (stem && secondTokens.has(stem) && word.length > 3) {
      shared.add(word);
    }
  }
  return [...shared].slice(0, 3);
}

function getMatchReasons(card: Card, otherText: string, otherSector: Card["sector"] | null): string[] {
  const reasons: string[] = [];
  const sharedWords = getSharedWords(otherText, getCardText(card));
  if (sharedWords.length > 0) {
    reasons.push(`wspólne: ${sharedWords.join(", ")}`);
  }
  if (otherSector && otherSector === card.sector) {
    reasons.push(SECTOR_LABELS[card.sector]);
  }
  reasons.push(`${card.readinessScale} ${card.readiness}`);
  return reasons;
}

export function getSimilarCards(target: Card, cards: Card[], limit = 3): Match<Card>[] {
  const others = cards.filter((card) => card.id !== target.id);
  const vectors = getVectors([getCardText(target), ...others.map(getCardText)]);
  return others
    .map((card, index) => ({
      item: card,
      similarity: getCosine(vectors[0], vectors[index + 1]),
      reasons: getMatchReasons(card, getCardText(target), target.sector),
    }))
    .filter((match) => match.similarity >= MATCH_SIMILARITY)
    .sort((first, second) => second.similarity - first.similarity)
    .slice(0, limit);
}

export function getDuplicate(target: Card, cards: Card[]): Match<Card> | null {
  const [best] = getSimilarCards(target, cards, 1);
  return best && best.similarity >= DUPLICATE_SIMILARITY ? best : null;
}

export function getCardsForChallenge(challenge: Challenge, cards: Card[], limit = 3): Match<Card>[] {
  const vectors = getVectors([getChallengeText(challenge), ...cards.map(getCardText)]);
  return cards
    .map((card, index) => ({
      item: card,
      similarity: getCosine(vectors[0], vectors[index + 1]) + (challenge.sector === card.sector ? 0.05 : 0),
      reasons: getMatchReasons(card, getChallengeText(challenge), challenge.sector),
    }))
    .filter((match) => match.similarity >= MATCH_SIMILARITY)
    .sort((first, second) => second.similarity - first.similarity)
    .slice(0, limit);
}

export function getChallengesForCard(card: Card, challenges: Challenge[], limit = 3): Match<Challenge>[] {
  const vectors = getVectors([getCardText(card), ...challenges.map(getChallengeText)]);
  return challenges
    .map((challenge, index) => ({
      item: challenge,
      similarity: getCosine(vectors[0], vectors[index + 1]) + (challenge.sector === card.sector ? 0.05 : 0),
      reasons: getMatchReasons(card, getChallengeText(challenge), challenge.sector).slice(0, 2),
    }))
    .filter((match) => match.similarity >= MATCH_SIMILARITY)
    .sort((first, second) => second.similarity - first.similarity)
    .slice(0, limit);
}
