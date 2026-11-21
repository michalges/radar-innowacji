import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getSeedCards, getSeedChallenges } from "@/lib/seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "radar.db");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    edit_token TEXT NOT NULL UNIQUE,
    owner_email TEXT,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    edit_token TEXT NOT NULL UNIQUE,
    email TEXT,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reports (
    card_id TEXT NOT NULL,
    reporter TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (card_id, reporter)
  );
  CREATE TABLE IF NOT EXISTS crawled_sources (
    url TEXT PRIMARY KEY,
    outcome TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`;

function seedDatabase(db: DatabaseSync) {
  const insertCard = db.prepare("INSERT INTO cards (id, edit_token, data, created_at) VALUES (?, ?, ?, ?)");
  for (const card of getSeedCards()) {
    insertCard.run(card.id, crypto.randomUUID(), JSON.stringify(card), card.createdAt);
  }
  const insertChallenge = db.prepare("INSERT INTO challenges (id, edit_token, data, created_at) VALUES (?, ?, ?, ?)");
  for (const challenge of getSeedChallenges()) {
    insertChallenge.run(challenge.id, crypto.randomUUID(), JSON.stringify(challenge), challenge.createdAt);
  }
}

function openDatabase() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM cards").get() as { count: number };
  if (count === 0) {
    seedDatabase(db);
  }
  return db;
}

const globalForDb = globalThis as unknown as { radarDb?: DatabaseSync };

export function getDb() {
  globalForDb.radarDb ??= openDatabase();
  return globalForDb.radarDb;
}
