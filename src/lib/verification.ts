import "server-only";
import { z } from "zod";
import { getChatCompletion, getJsonFromText, getModels, type ContentPart } from "@/lib/openrouter";
import { logAiCall } from "@/lib/repository";
import type { Card } from "@/lib/types";

const PROMPT_VERSION = "claim-verification-v1";
const MIN_CONFIDENCE = 0.7;

export type VerificationResult = { isVerified: boolean; reason: string };

const verificationSchema = z.object({
  verdict: z.enum(["zgodne", "niepewne", "niezgodne"]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

const SYSTEM_PROMPT = `Weryfikujesz, czy osoba zgłaszająca się jako autor pomysłu rzeczywiście jest z nim związana.
Dostajesz opis pomysłu z bazy, domenę e-maila osoby i przesłane przez nią materiały (zdjęcia, skany, PDF: np. prezentację, dokumentację, dyplom, artykuł, notatki projektowe).
Oceń, czy materiały dotyczą TEGO pomysłu (ten sam problem i rozwiązanie, ta sama instytucja lub zespół) i wskazują, że osoba lub jej instytucja jest jego twórcą.
- "zgodne": materiały wyraźnie opisują ten pomysł i łączą go z osobą lub jej instytucją.
- "niepewne": materiały są ogólne, nieczytelne albo pasują tylko częściowo.
- "niezgodne": materiały dotyczą czegoś innego, wyglądają na spreparowane albo są puste.
Domena e-maila zgodna z instytucją pomysłu to dodatkowy sygnał, ale sama nie wystarcza.
reason: jedno lub dwa zdania po polsku dla użytkownika. Nie przepisuj danych osobowych z materiałów.
Format: {"verdict":"zgodne","confidence":0.8,"reason":""}`;

function getIdeaDescription(card: Card, emailDomain: string): string {
  return [
    `Tytuł: ${card.title}`,
    `Problem: ${card.problem}`,
    `Rozwiązanie: ${card.solution}`,
    `Instytucja: ${card.institution || "nieznana"}`,
    `Twórcy: ${card.creators || "nieznani"}`,
    `Region: ${card.region || "nieznany"}`,
    `Domena e-maila zgłaszającego: ${emailDomain}`,
  ].join("\n");
}

async function getFilePart(file: File): Promise<ContentPart> {
  const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  if (file.type === "application/pdf") {
    return { type: "file", file: { filename: file.name || "material.pdf", file_data: dataUrl } };
  }
  return { type: "image_url", image_url: { url: dataUrl } };
}

/**
 * Asks the model whether the uploaded materials prove authorship of the idea.
 * Files stay in memory for this request only; neither they nor the model's reasoning about them are stored.
 */
export async function getClaimVerification(card: Card, emailDomain: string, files: File[]): Promise<VerificationResult> {
  const { primary } = getModels();
  const fileParts = await Promise.all(files.map(getFilePart));
  const content = await getChatCompletion(primary, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: [{ type: "text", text: getIdeaDescription(card, emailDomain) }, ...fileParts] },
  ]);
  const verification = verificationSchema.parse(getJsonFromText(content));
  logAiCall(
    primary,
    PROMPT_VERSION,
    `card=${card.id} files=${files.map((file) => file.type).join(",")}`,
    JSON.stringify({ verdict: verification.verdict, confidence: verification.confidence }),
  );
  return {
    isVerified: verification.verdict === "zgodne" && verification.confidence >= MIN_CONFIDENCE,
    reason: verification.reason,
  };
}
