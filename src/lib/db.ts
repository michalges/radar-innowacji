import "server-only";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getSeedCards, getSeedChallenges } from "@/lib/seed";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "radar.db");

const SCHEMA = readFileSync(path.join(process.cwd(), "seed", "schema.sql"), "utf8");

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
