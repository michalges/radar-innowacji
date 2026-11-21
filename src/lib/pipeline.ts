import "server-only";
import { z } from "zod";
import {
  CRITERIA,
  CRITERION_QUESTIONS,
  ESCALATION_MARGIN,
  INNOVATION_TYPES,
  PUBLISH_CONFIDENCE,
  SECTORS,
  UNCONFIRMED_CONFIDENCE,
} from "@/lib/constants";
import { getChatCompletion, getJsonFromText, getModels } from "@/lib/openrouter";
import { logAiCall } from "@/lib/repository";
import type { Card, CardContent } from "@/lib/types";

const PROMPT_VERSION = "2026-11-21.1";

const cardContentSchema = z.object({
  title: z.string().min(1).max(120),
  problem: z.string(),
  solution: z.string(),
  effect: z.string(),
  type: z.enum(INNOVATION_TYPES),
  readinessScale: z.enum(["TRL", "ORL"]),
  readiness: z.number().int().min(1).max(9),
  sector: z.enum(SECTORS),
  creators: z.string(),
  hasMinors: z.boolean(),
  isYoungCreator: z.boolean(),
  institution: z.string(),
  region: z.string(),
  resources: z.string(),
  tags: z.array(z.string()).max(8),
  missing: z.array(z.string()).max(6),
});

const analysisSchema = z.object({
  safe: z.boolean(),
  safetyReason: z.string(),
  isInnovation: z.boolean(),
  confidence: z.number().min(0).max(1),
  card: cardContentSchema.nullable(),
  quotes: z.record(z.string(), z.string()).default({}),
  scores: z
    .array(
      z.object({
        criterion: z.enum(CRITERIA),
        score: z.number().int().min(1).max(5),
        reason: z.string(),
        evidence: z.string(),
      }),
    )
    .default([]),
});

type Analysis = z.infer<typeof analysisSchema>;

const SYSTEM_PROMPT = `Jesteś modułem automatycznej moderacji i oceny w aplikacji "Radar Innowacji" (Podkarpackie Centrum Innowacji).
Dostajesz tekst: zgłoszenie od użytkownika albo wpis znaleziony na stronie szkoły, uczelni, gminy, w BIP lub bazie patentowej.
Odpowiadasz WYŁĄCZNIE jednym obiektem JSON, po polsku, bez komentarzy.

Kroki:
1. Bezpieczeństwo: safe=false dla spamu, reklam, treści obraźliwych, bezsensownych lub niezwiązanych z innowacjami. Podaj safetyReason.
2. Czy to innowacja (nowe lub ulepszone rozwiązanie technologiczne, organizacyjne, edukacyjne, społeczne lub procesowe, które działa albo jest budowane)? Ogłoszenia, wydarzenia, gratulacje bez opisu rozwiązania to NIE innowacja. confidence 0–1.
3. Jeśli safe i isInnovation: wypełnij "card". Nie wymyślaj faktów: czego brak w tekście, zostaw puste i wpisz do "missing" (maks. 4 pozycje, każda 1–4 słowa, np. "nazwa szkoły", "kontakt").
   - type: ${INNOVATION_TYPES.join(" | ")}
   - readinessScale: "TRL" dla technologii, "ORL" dla rozwiązań organizacyjnych/społecznych/edukacyjnych; readiness 1–9 (1–3 pomysł, 4–6 pilotaż/prototyp, 7–9 wdrożone).
   - sector (sektory PCI, wybierz najbliższy): ${SECTORS.join(" | ")} (jakosc-zycia obejmuje edukację, zdrowie, środowisko, usługi publiczne).
   - creators: role i grupy wiekowe, NIGDY imion i nazwisk osób niepełnoletnich. hasMinors=true, jeśli twórcami są osoby < 18 lat. isYoungCreator=true, jeśli twórcy mają 16–30 lat.
   - tags: 3–6 krótkich słów kluczowych.
4. quotes: dla pól problem, solution, effect, creators podaj DOSŁOWNE fragmenty z tekstu źródłowego, które je uzasadniają (pomiń, jeśli brak).
5. scores: oceń każde z 8 kryteriów w skali 1–5 (1 = bardzo słabo, 5 = bardzo dobrze), z krótkim uzasadnieniem (reason) i dosłownym dowodem z tekstu (evidence, może być pusty):
${CRITERIA.map((criterion) => `   - ${criterion}: ${CRITERION_QUESTIONS[criterion]}`).join("\n")}
   Dla "gotowosc": readiness 1–2 → 1, 3–4 → 2, 5 → 3, 6–7 → 4, 8–9 → 5.

Jeśli !safe lub !isInnovation: card=null, quotes={}, scores=[].

Format:
{"safe":true,"safetyReason":"","isInnovation":true,"confidence":0.9,"card":{"title":"","problem":"","solution":"","effect":"","type":"technologiczna","readinessScale":"TRL","readiness":4,"sector":"ict","creators":"","hasMinors":false,"isYoungCreator":false,"institution":"","region":"","resources":"","tags":[],"missing":[]},"quotes":{"solution":""},"scores":[{"criterion":"nowosc","score":3,"reason":"","evidence":""}]}`;

async function getAnalysis(model: string, text: string): Promise<Analysis> {
  const content = await getChatCompletion(model, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Tekst do analizy:\n"""\n${text}\n"""` },
  ]);
  logAiCall(model, PROMPT_VERSION, text, content);
  return analysisSchema.parse(getJsonFromText(content));
}

function isNearThreshold(confidence: number): boolean {
  return [PUBLISH_CONFIDENCE, UNCONFIRMED_CONFIDENCE].some(
    (threshold) => Math.abs(confidence - threshold) < ESCALATION_MARGIN,
  );
}

function getNormalizedText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Keeps only quotes that really appear in the source, so the card never shows invented evidence. */
function getVerifiedQuotes(quotes: Record<string, string>, sourceText: string): Card["quotes"] {
  const normalizedSource = getNormalizedText(sourceText);
  const cardKeys = new Set<string>(Object.keys(cardContentSchema.shape));
  const verified: Card["quotes"] = {};
  for (const [field, quote] of Object.entries(quotes)) {
    if (cardKeys.has(field) && quote && normalizedSource.includes(getNormalizedText(quote))) {
      verified[field as keyof CardContent] = quote;
    }
  }
  return verified;
}

function getSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug}-${crypto.randomUUID().slice(0, 6)}`;
}

export type PipelineResult =
  | { outcome: "odrzucone"; reason: string; model: string }
  | { outcome: "opublikowana" | "niepotwierdzona"; card: Card; model: string };

type SourceInfo = Pick<Card, "source" | "sourceUrl" | "sourceLabel">;

export async function runPipeline(text: string, sourceInfo: SourceInfo): Promise<PipelineResult> {
  const models = getModels();
  let model = models.primary;
  let analysis = await getAnalysis(model, text);

  if (models.escalation && isNearThreshold(analysis.confidence)) {
    model = models.escalation;
    analysis = await getAnalysis(model, text);
  }

  if (!analysis.safe) {
    return { outcome: "odrzucone", reason: analysis.safetyReason || "Treść nie przeszła filtra bezpieczeństwa.", model };
  }
  if (!analysis.isInnovation || !analysis.card || analysis.confidence < UNCONFIRMED_CONFIDENCE) {
    return { outcome: "odrzucone", reason: "Model uznał, że tekst nie opisuje innowacji.", model };
  }

  const status = analysis.confidence >= PUBLISH_CONFIDENCE ? "opublikowana" : "niepotwierdzona";
  const card: Card = {
    ...analysis.card,
    ...sourceInfo,
    id: getSlug(analysis.card.title),
    sourceText: text,
    quotes: getVerifiedQuotes(analysis.quotes, text),
    scores: CRITERIA.map(
      (criterion) =>
        analysis.scores.find((score) => score.criterion === criterion) ?? {
          criterion,
          score: 1,
          reason: "Brak danych w zgłoszeniu.",
          evidence: "",
        },
    ),
    confidence: analysis.confidence,
    model,
    status,
    reports: 0,
    isClaimed: sourceInfo.source === "zgloszenie",
    createdAt: new Date().toISOString(),
  };
  return { outcome: status, card, model };
}
