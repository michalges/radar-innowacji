import "server-only";
import { cacheLife } from "next/cache";
import { INNOVATION_TYPE_LABELS, SECTOR_LABELS, type InnovationType, type Sector } from "@/lib/constants";
import { getCardTextSimilarities } from "@/lib/similarity";
import type { Card } from "@/lib/types";

export type FundingCall = {
  id: string;
  title: string;
  url: string;
  source: string;
  deadline: string | null;
  text: string;
  sectors: Sector[];
  types: InnovationType[];
  minReadiness: number;
  maxReadiness: number;
};

export type FundingMatch = {
  call: FundingCall;
  score: number;
  reason: string;
};

const EU_SEARCH_URL =
  "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***&pageSize=50&pageNumber=1";
const EU_TOPIC_URL = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/";
const EU_OPEN_STATUS = "31094501";
const FETCH_TIMEOUT_MS = 20000;

const SECTOR_PATTERNS: Record<Sector, RegExp> = {
  motoryzacja: /vehicle|automotive|mobility|battery|transport|road/i,
  "jakosc-zycia": /health|care|social|citizen|ageing|food|wellbeing|education|cities/i,
  ict: /digital|data|software|\bai\b|artificial intelligence|cyber|computing|semiconductor|cloud/i,
  lotnictwo: /aviation|aircraft|aeronaut|airport|drone/i,
  kosmos: /space|satellite|galileo|copernicus|earth observation/i,
};

const STATIC_CALLS: FundingCall[] = [
  {
    id: "feng-smart",
    title: "FENG – Ścieżka SMART (B+R i wdrożenie)",
    url: "https://www.nowoczesnagospodarka.gov.pl/",
    source: "FENG",
    deadline: null,
    text: "badania rozwój wdrożenie innowacji przedsiębiorstwo technologia produkt proces prototyp",
    sectors: ["motoryzacja", "ict", "lotnictwo", "kosmos", "jakosc-zycia"],
    types: ["technologiczna", "procesowa"],
    minReadiness: 4,
    maxReadiness: 9,
  },
  {
    id: "fep-podkarpackie",
    title: "Fundusze Europejskie dla Podkarpacia 2021–2027",
    url: "https://funduszeue.podkarpackie.pl/",
    source: "FEP Podkarpackie",
    deadline: null,
    text: "podkarpacie region innowacje przedsiębiorstwa badania cyfryzacja edukacja społeczne zdrowie transport",
    sectors: ["motoryzacja", "ict", "lotnictwo", "kosmos", "jakosc-zycia"],
    types: ["technologiczna", "organizacyjna", "edukacyjna", "spoleczna", "procesowa"],
    minReadiness: 1,
    maxReadiness: 9,
  },
  {
    id: "ncbr-lider",
    title: "NCBR – Program LIDER",
    url: "https://www.gov.pl/web/ncbr/lider",
    source: "NCBR",
    deadline: null,
    text: "młodzi naukowcy badania zespół projekt badawczy wdrożenie wyników nauka",
    sectors: ["motoryzacja", "ict", "lotnictwo", "kosmos", "jakosc-zycia"],
    types: ["technologiczna", "procesowa", "spoleczna"],
    minReadiness: 1,
    maxReadiness: 6,
  },
  {
    id: "parp-platformy-startowe",
    title: "PARP – Platformy startowe dla nowych pomysłów",
    url: "https://www.parp.gov.pl/component/grants/grants/platformy-startowe-dla-nowych-pomyslow",
    source: "PARP / FEPW",
    deadline: null,
    text: "startup nowy pomysł inkubacja biznes rozwój produktu młoda firma",
    sectors: ["motoryzacja", "ict", "lotnictwo", "kosmos", "jakosc-zycia"],
    types: ["technologiczna", "organizacyjna", "edukacyjna", "spoleczna", "procesowa"],
    minReadiness: 1,
    maxReadiness: 5,
  },
];

function getStrippedText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getFirstString(value: unknown): string {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : "";
}

function getEuCall(result: unknown): FundingCall | null {
  if (typeof result !== "object" || result === null || !("metadata" in result)) {
    return null;
  }
  const { metadata } = result;
  if (typeof metadata !== "object" || metadata === null) {
    return null;
  }
  const fields = new Map(Object.entries(metadata));
  const identifier = getFirstString(fields.get("identifier"));
  const title = getFirstString(fields.get("title"));
  if (!identifier || !title) {
    return null;
  }
  const description = getStrippedText(getFirstString(fields.get("descriptionByte"))).slice(0, 600);
  const text = `${title} ${getFirstString(fields.get("callTitle"))} ${description}`;
  const deadline = getFirstString(fields.get("deadlineDate")).slice(0, 10) || null;
  const sectors = Object.entries(SECTOR_PATTERNS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([sector]) => sector)
    .filter((sector): sector is Sector => sector in SECTOR_LABELS);
  return {
    id: identifier,
    title,
    url: `${EU_TOPIC_URL}${identifier}`,
    source: "EU Funding & Tenders",
    deadline,
    text,
    sectors,
    types: ["technologiczna", "procesowa", "spoleczna"],
    minReadiness: 3,
    maxReadiness: 8,
  };
}

async function getEuCalls(): Promise<FundingCall[]> {
  "use cache";
  cacheLife("hours");
  const body = new FormData();
  const query = { bool: { must: [{ terms: { type: ["1", "2"] } }, { terms: { status: [EU_OPEN_STATUS] } }] } };
  body.append("query", new Blob([JSON.stringify(query)], { type: "application/json" }));
  body.append("languages", new Blob([JSON.stringify(["en"])], { type: "application/json" }));
  const response = await fetch(EU_SEARCH_URL, { method: "POST", body, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`EU Funding & Tenders: ${response.status}`);
  }
  const data: unknown = await response.json();
  const results = typeof data === "object" && data !== null && "results" in data ? data.results : [];
  return Array.isArray(results) ? results.map(getEuCall).filter((call) => call !== null) : [];
}

export async function getFundingCalls(): Promise<FundingCall[]> {
  try {
    return [...(await getEuCalls()), ...STATIC_CALLS];
  } catch {
    return STATIC_CALLS;
  }
}

function getReason(card: Card, call: FundingCall): string {
  const reasons: string[] = [];
  if (call.sectors.includes(card.sector)) {
    reasons.push(SECTOR_LABELS[card.sector]);
  }
  if (call.types.includes(card.type)) {
    reasons.push(INNOVATION_TYPE_LABELS[card.type].toLowerCase());
  }
  if (card.readiness >= call.minReadiness && card.readiness <= call.maxReadiness) {
    reasons.push(`${card.readinessScale} ${card.readiness} w zakresie`);
  }
  return reasons.length > 0 ? reasons.join(" · ") : "zbieżna tematyka";
}

export function getFundingForCard(card: Card, calls: FundingCall[], limit = 3): FundingMatch[] {
  const similarities = getCardTextSimilarities(
    card,
    calls.map((call) => call.text),
  );
  const rankedMatches = calls
    .map((call, index) => {
      const isReadinessInRange = card.readiness >= call.minReadiness && card.readiness <= call.maxReadiness;
      const score =
        similarities[index] +
        (call.sectors.includes(card.sector) ? 0.15 : 0) +
        (call.types.includes(card.type) ? 0.05 : 0) +
        (isReadinessInRange ? 0.05 : -0.1);
      return { call, score, reason: getReason(card, call) };
    })
    .sort((first, second) => second.score - first.score);
  const bestNational = rankedMatches.find((match) => STATIC_CALLS.includes(match.call));
  const otherMatches = rankedMatches.filter((match) => match !== bestNational);
  return [...(bestNational ? [bestNational] : []), ...otherMatches].slice(0, limit);
}
