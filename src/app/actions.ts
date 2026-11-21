"use server";

import { createHash } from "node:crypto";
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  CARD_STATUSES,
  EVIDENCE_MIME_TYPES,
  FREE_EMAIL_DOMAINS,
  MAX_EVIDENCE_FILES,
  MAX_EVIDENCE_TOTAL_BYTES,
  SECTORS,
  type CardStatus,
  type CardEventKind,
} from "@/lib/constants";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, getIsAdmin, getIsAdminToken } from "@/lib/admin";
import { hasApiKey } from "@/lib/openrouter";
import { runPipeline } from "@/lib/pipeline";
import { getClaimVerification, type VerificationResult } from "@/lib/verification";
import {
  addCardEvent,
  addReport,
  deleteCard,
  getCard,
  getCardByEditToken,
  getCardEditToken,
  getClaimRequest,
  hasPendingClaimRequest,
  insertCard,
  insertChallenge,
  insertClaimRequest,
  insertMessage,
  saveCard,
  setCardOwner,
  setClaimRequestStatus,
} from "@/lib/repository";
import type { ClaimRequestReason } from "@/lib/types";

export type FormState = { error?: string; message?: string; link?: string; reviewReason?: ClaimRequestReason } | null;

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const requestLog = new Map<string, number[]>();

async function getClientKey(): Promise<string> {
  const headerList = await headers();
  const address = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return createHash("sha256").update(address).digest("hex").slice(0, 16);
}

async function getIsRateLimited(): Promise<boolean> {
  const key = await getClientKey();
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Nieznany błąd";
}

const emailSchema = z.email("Podaj poprawny e-mail");

const submissionSchema = z.object({
  text: z.string().trim().min(40, "Opisz pomysł w co najmniej 40 znakach").max(5000, "Maksymalnie 5000 znaków"),
  email: emailSchema,
  isNomination: z.boolean(),
});

export async function submitIdea(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = submissionSchema.safeParse({
    text: formData.get("text"),
    email: formData.get("email"),
    isNomination: formData.get("kto") === "ktos-inny",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  if (!hasApiKey()) {
    return { error: "Brak klucza OPENROUTER_API_KEY — dodaj go do .env.local." };
  }
  if (await getIsRateLimited()) {
    return { error: "Za dużo zgłoszeń z tego adresu. Spróbuj za godzinę." };
  }

  let cardId: string;
  let editToken: string;
  try {
    const result = await runPipeline(parsed.data.text, {
      source: "zgloszenie",
      sourceUrl: null,
      sourceLabel: parsed.data.isNomination ? "Zgłoszenie (nominacja)" : "Zgłoszenie twórcy",
    });
    if (result.outcome === "odrzucone") {
      return { error: `Nie opublikowaliśmy: ${result.reason}` };
    }
    const card = { ...result.card, isClaimed: !parsed.data.isNomination };
    editToken = insertCard(card, parsed.data.isNomination ? null : parsed.data.email);
    addCardEvent(card.id, result.outcome === "opublikowana" ? "ocenione" : "niepotwierdzone");
    cardId = card.id;
  } catch (error) {
    return { error: `AI nie odpowiedziało poprawnie (${getErrorMessage(error)}). Spróbuj ponownie.` };
  }
  redirect(`/pomysl/${cardId}?edycja=${editToken}`);
}

const challengeSchema = z.object({
  title: z.string().trim().min(5, "Tytuł: min. 5 znaków").max(120),
  description: z.string().trim().min(30, "Opis: min. 30 znaków").max(3000),
  organization: z.string().trim().min(2, "Podaj nazwę organizacji").max(120),
  email: emailSchema,
  sector: z.enum(SECTORS).nullable(),
});

export async function submitChallenge(_state: FormState, formData: FormData): Promise<FormState> {
  const sector = formData.get("sector");
  const parsed = challengeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    organization: formData.get("organization"),
    email: formData.get("email"),
    sector: sector ? sector : null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  if (await getIsRateLimited()) {
    return { error: "Za dużo zgłoszeń z tego adresu. Spróbuj za godzinę." };
  }
  const { email, ...challengeData } = parsed.data;
  const id = `wyzwanie-${crypto.randomUUID().slice(0, 8)}`;
  insertChallenge({ ...challengeData, id, createdAt: new Date().toISOString() }, email);
  redirect(`/wyzwania/${id}`);
}

export async function reportCard(cardId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const card = await getCard(cardId);
  if (!card) {
    return { error: "Nie znaleziono pomysłu." };
  }
  const reason = String(formData.get("reason") ?? "inne");
  addReport(card, await getClientKey(), reason);
  refresh();
  return { message: "Dzięki, zapisane." };
}

function getEvidenceError(files: File[]): string | null {
  if (files.length === 0) {
    return "Dodaj co najmniej jeden plik (zdjęcie lub PDF), który potwierdza, że to Twój pomysł.";
  }
  if (files.length > MAX_EVIDENCE_FILES) {
    return `Możesz dodać maksymalnie ${MAX_EVIDENCE_FILES} pliki.`;
  }
  if (files.some((file) => !EVIDENCE_MIME_TYPES.includes(file.type))) {
    return "Obsługujemy tylko zdjęcia (PNG, JPG, WebP) i PDF.";
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_EVIDENCE_TOTAL_BYTES) {
    return "Pliki są za duże: razem maksymalnie 8 MB.";
  }
  return null;
}

type InstitutionEmail = { email: string; domain: string } | { error: string };

function getInstitutionEmail(value: FormDataEntryValue | null): InstitutionEmail {
  const parsed = emailSchema.safeParse(value);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Podaj poprawny e-mail" };
  }
  const domain = parsed.data.split("@")[1]?.toLowerCase() ?? "";
  if (FREE_EMAIL_DOMAINS.includes(domain)) {
    return { error: "Użyj e-maila z domeny szkoły, uczelni lub urzędu." };
  }
  return { email: parsed.data, domain };
}

export async function claimCard(cardId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const institutionEmail = getInstitutionEmail(formData.get("email"));
  if ("error" in institutionEmail) {
    return { error: institutionEmail.error };
  }
  const files = formData.getAll("evidence").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const evidenceError = getEvidenceError(files);
  if (evidenceError) {
    return { error: evidenceError };
  }
  if (await getIsRateLimited()) {
    return { error: "Za dużo prób z tego adresu. Spróbuj za godzinę." };
  }
  const card = await getCard(cardId);
  const editToken = getCardEditToken(cardId);
  if (!card || !editToken || card.isClaimed) {
    return { error: "Nie znaleziono pomysłu albo ma już właściciela." };
  }
  if (!hasApiKey()) {
    return { error: "Weryfikacja AI jest chwilowo niedostępna.", reviewReason: "ai-niedostepne" };
  }
  let verification: VerificationResult;
  try {
    verification = await getClaimVerification(card, institutionEmail.domain, files);
  } catch (error) {
    return { error: `Nie udało się zweryfikować materiałów (${getErrorMessage(error)}).`, reviewReason: "ai-niedostepne" };
  }
  if (!verification.isVerified) {
    return { error: `AI nie potwierdziło autorstwa: ${verification.reason}`, reviewReason: "ai-nie-potwierdzilo" };
  }
  setCardOwner(cardId, institutionEmail.email);
  saveCard({ ...card, isClaimed: true });
  addCardEvent(cardId, "potwierdzone", "Autorstwo zweryfikowane przez AI na podstawie przesłanych materiałów");
  redirect(`/edytuj/${editToken}`);
}

const claimReviewSchema = z.object({
  note: z.string().trim().min(20, "Opisz swoją rolę w co najmniej 20 znakach").max(1000, "Maksymalnie 1000 znaków"),
  reason: z.enum(["ai-nie-potwierdzilo", "ai-niedostepne"]),
});

/** Fallback when AI cannot confirm authorship: queues the claim for a person. Uploaded files are not part of it. */
export async function requestClaimReview(cardId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const institutionEmail = getInstitutionEmail(formData.get("email"));
  if ("error" in institutionEmail) {
    return { error: institutionEmail.error };
  }
  const parsed = claimReviewSchema.safeParse({ note: formData.get("note"), reason: formData.get("reason") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const card = await getCard(cardId);
  if (!card || card.isClaimed) {
    return { error: "Nie znaleziono pomysłu albo ma już właściciela." };
  }
  if (!hasPendingClaimRequest(cardId, institutionEmail.email)) {
    if (await getIsRateLimited()) {
      return { error: "Za dużo prób z tego adresu. Spróbuj za godzinę." };
    }
    insertClaimRequest(cardId, institutionEmail.email, parsed.data.note, parsed.data.reason);
  }
  return { message: `Przekazane do administratora. Odezwiemy się na ${institutionEmail.email}, zwykle w ciągu 2 dni roboczych.` };
}

export async function loginAdmin(_state: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  if (await getIsRateLimited()) {
    return { error: "Za dużo prób. Spróbuj za godzinę." };
  }
  if (!getIsAdminToken(token)) {
    return { error: "Nieprawidłowy token." };
  }
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_SESSION_SECONDS,
    path: "/",
  });
  refresh();
  return null;
}

export async function logoutAdmin() {
  (await cookies()).delete(ADMIN_COOKIE);
  refresh();
}

export async function decideClaimRequest(requestId: string, formData: FormData) {
  if (!(await getIsAdmin())) {
    return;
  }
  const request = getClaimRequest(requestId);
  if (!request || request.status !== "oczekuje") {
    return;
  }
  const isApproved = formData.get("decision") === "zatwierdz";
  const card = await getCard(request.cardId);
  if (isApproved && card && !card.isClaimed) {
    setCardOwner(card.id, request.email);
    saveCard({ ...card, isClaimed: true });
    addCardEvent(card.id, "potwierdzone", "Autorstwo potwierdzone przez administratora");
  }
  setClaimRequestStatus(requestId, isApproved && card ? "zatwierdzone" : "odrzucone");
  refresh();
}

const messageSchema = z.object({
  sender: z.string().trim().min(2, "Przedstaw się").max(120),
  body: z.string().trim().min(10, "Wiadomość: min. 10 znaków").max(2000),
});

export async function sendMessage(cardId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const parsed = messageSchema.safeParse({ sender: formData.get("sender"), body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const card = await getCard(cardId);
  if (!card) {
    return { error: "Nie znaleziono pomysłu." };
  }
  insertMessage({ ...parsed.data, id: crypto.randomUUID(), cardId, createdAt: new Date().toISOString() });
  if (card.status === "opublikowana" || card.status === "niepotwierdzona") {
    saveCard({ ...card, status: "w-kontakcie" });
    addCardEvent(cardId, "w-kontakcie");
  }
  refresh();
  return { message: "Wysłane. Twórcy odpowiedzą przez Radar." };
}

const editSchema = z.object({
  corrections: z.string().trim().min(10, "Opisz poprawki w co najmniej 10 znakach").max(3000),
});

export async function updateCardByToken(token: string, _state: FormState, formData: FormData): Promise<FormState> {
  const parsed = editSchema.safeParse({ corrections: formData.get("corrections") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const card = await getCardByEditToken(token);
  if (!card) {
    return { error: "Link do edycji jest nieprawidłowy." };
  }
  try {
    const text = `${card.sourceText}\n\nUzupełnienie od twórcy:\n${parsed.data.corrections}`;
    const result = await runPipeline(text, { source: card.source, sourceUrl: card.sourceUrl, sourceLabel: card.sourceLabel });
    if (result.outcome === "odrzucone") {
      return { error: result.reason };
    }
    saveCard({
      ...result.card,
      id: card.id,
      createdAt: card.createdAt,
      isClaimed: true,
      reports: 0,
      status: card.status === "w-kontakcie" || card.status === "wdrozona" ? card.status : result.card.status,
    });
    addCardEvent(card.id, "poprawione");
  } catch (error) {
    return { error: `AI nie odpowiedziało poprawnie (${getErrorMessage(error)}).` };
  }
  refresh();
  return { message: "Zapisane i ocenione ponownie." };
}

const STATUS_EVENT_KINDS: Record<CardStatus, CardEventKind> = {
  opublikowana: "ocenione",
  niepotwierdzona: "niepotwierdzone",
  "w-kontakcie": "w-kontakcie",
  wdrozona: "wdrozone",
};

const followUpSchema = z.object({
  status: z.enum(CARD_STATUSES),
  note: z.string().trim().max(300, "Notatka: max. 300 znaków"),
});

export async function setCardFollowUpByToken(token: string, _state: FormState, formData: FormData): Promise<FormState> {
  const parsed = followUpSchema.safeParse({ status: formData.get("status"), note: formData.get("note") ?? "" });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const card = await getCardByEditToken(token);
  if (!card) {
    return { error: "Link do edycji jest nieprawidłowy." };
  }
  const note = parsed.data.note || null;
  if (parsed.data.status !== card.status) {
    saveCard({ ...card, status: parsed.data.status });
    addCardEvent(card.id, STATUS_EVENT_KINDS[parsed.data.status], note);
  } else if (note) {
    addCardEvent(card.id, "notatka", note);
  }
  refresh();
  return { message: "Zapisane." };
}

export async function deleteCardByToken(token: string) {
  const card = await getCardByEditToken(token);
  if (card) {
    deleteCard(card.id);
  }
  redirect("/");
}
