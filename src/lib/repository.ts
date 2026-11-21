import "server-only";
import { connection } from "next/server";
import { REPORTS_TO_UNCONFIRM } from "@/lib/constants";
import { getDb } from "@/lib/db";
import type { Card, Challenge, Message } from "@/lib/types";

type DataRow = { data: string };

function parseRows<T>(rows: unknown[]): T[] {
  return (rows as DataRow[]).map((row) => JSON.parse(row.data) as T);
}

export async function getCards(): Promise<Card[]> {
  await connection();
  return parseRows<Card>(getDb().prepare("SELECT data FROM cards ORDER BY created_at DESC").all());
}

export async function getCard(id: string): Promise<Card | null> {
  await connection();
  const row = getDb().prepare("SELECT data FROM cards WHERE id = ?").get(id) as DataRow | undefined;
  return row ? (JSON.parse(row.data) as Card) : null;
}

export async function getCardByEditToken(token: string): Promise<Card | null> {
  await connection();
  const row = getDb().prepare("SELECT data FROM cards WHERE edit_token = ?").get(token) as DataRow | undefined;
  return row ? (JSON.parse(row.data) as Card) : null;
}

export function getCardEditToken(id: string): string | null {
  const row = getDb().prepare("SELECT edit_token FROM cards WHERE id = ?").get(id) as { edit_token: string } | undefined;
  return row?.edit_token ?? null;
}

export function insertCard(card: Card, ownerEmail: string | null): string {
  const editToken = crypto.randomUUID();
  getDb()
    .prepare("INSERT INTO cards (id, edit_token, owner_email, data, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(card.id, editToken, ownerEmail, JSON.stringify(card), card.createdAt);
  return editToken;
}

export function saveCard(card: Card) {
  getDb().prepare("UPDATE cards SET data = ? WHERE id = ?").run(JSON.stringify(card), card.id);
}

export function setCardOwner(id: string, email: string) {
  getDb().prepare("UPDATE cards SET owner_email = ? WHERE id = ?").run(email, id);
}

export function deleteCard(id: string) {
  getDb().prepare("DELETE FROM cards WHERE id = ?").run(id);
  getDb().prepare("DELETE FROM messages WHERE card_id = ?").run(id);
}

export function addReport(card: Card, reporter: string, reason: string): Card {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO reports (card_id, reporter, reason, created_at) VALUES (?, ?, ?, ?)").run(
    card.id,
    reporter,
    reason,
    new Date().toISOString(),
  );
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM reports WHERE card_id = ?").get(card.id) as { count: number };
  const updated: Card = {
    ...card,
    reports: count,
    status: count >= REPORTS_TO_UNCONFIRM ? "niepotwierdzona" : card.status,
  };
  saveCard(updated);
  return updated;
}

export async function getChallenges(): Promise<Challenge[]> {
  await connection();
  return parseRows<Challenge>(getDb().prepare("SELECT data FROM challenges ORDER BY created_at DESC").all());
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  await connection();
  const row = getDb().prepare("SELECT data FROM challenges WHERE id = ?").get(id) as DataRow | undefined;
  return row ? (JSON.parse(row.data) as Challenge) : null;
}

export function insertChallenge(challenge: Challenge, email: string) {
  getDb()
    .prepare("INSERT INTO challenges (id, edit_token, email, data, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(challenge.id, crypto.randomUUID(), email, JSON.stringify(challenge), challenge.createdAt);
}

export function insertMessage(message: Message) {
  getDb()
    .prepare("INSERT INTO messages (id, card_id, sender, body, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(message.id, message.cardId, message.sender, message.body, message.createdAt);
}

export async function getMessages(cardId: string): Promise<Message[]> {
  await connection();
  const rows = getDb()
    .prepare("SELECT id, card_id, sender, body, created_at FROM messages WHERE card_id = ? ORDER BY created_at DESC")
    .all(cardId) as { id: string; card_id: string; sender: string; body: string; created_at: string }[];
  return rows.map((row) => ({ id: row.id, cardId: row.card_id, sender: row.sender, body: row.body, createdAt: row.created_at }));
}

export function hasCrawledSource(url: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM crawled_sources WHERE url = ?").get(url));
}

export function markCrawledSource(url: string, outcome: string) {
  getDb()
    .prepare("INSERT OR REPLACE INTO crawled_sources (url, outcome, created_at) VALUES (?, ?, ?)")
    .run(url, outcome, new Date().toISOString());
}

export function logAiCall(model: string, promptVersion: string, input: string, output: string) {
  getDb()
    .prepare("INSERT INTO ai_log (model, prompt_version, input, output, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(model, promptVersion, input, output, new Date().toISOString());
}
