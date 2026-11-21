"use server";

import { createHash } from "node:crypto";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CARD_STATUSES, FREE_EMAIL_DOMAINS, SECTORS, type CardStatus, type CardEventKind } from "@/lib/constants";
import { hasApiKey } from "@/lib/openrouter";
import { runPipeline } from "@/lib/pipeline";
import {
  addCardEvent,
  addReport,
  deleteCard,
  getCard,
  getCardByEditToken,
  getCardEditToken,
  insertCard,
  insertChallenge,
  insertMessage,
  saveCard,
  setCardOwner,
} from "@/lib/repository";

export type FormState = { error?: string; message?: string; link?: string } | null;

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

export async function claimCard(cardId: string, _state: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }
  const domain = parsed.data.split("@")[1]?.toLowerCase() ?? "";
  if (FREE_EMAIL_DOMAINS.includes(domain)) {
    return { error: "Użyj e-maila z domeny szkoły, uczelni lub urzędu." };
  }
  const card = await getCard(cardId);
  const editToken = getCardEditToken(cardId);
  if (!card || !editToken) {
    return { error: "Nie znaleziono pomysłu." };
  }
  setCardOwner(cardId, parsed.data);
  saveCard({ ...card, isClaimed: true });
  addCardEvent(cardId, "potwierdzone");
  refresh();
  return {
    message: "Gotowe. Twój link (w produkcji przyjdzie mailem):",
    link: `/edytuj/${editToken}`,
  };
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
