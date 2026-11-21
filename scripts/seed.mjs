#!/usr/bin/env node
/**
 * Resets the database to the demo data in seed/seed.json.
 * Usage: `pnpm db:seed` locally, or `node scripts/seed.mjs` inside the container.
 * Restart the app afterwards if it is running, so it picks up a clean state.
 */
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DAY_MS = 86_400_000;
const rootDir = path.resolve(import.meta.dirname, "..");
const dataDir = process.env.DATA_DIR ?? path.join(rootDir, "data");
const seed = JSON.parse(readFileSync(path.join(rootDir, "seed", "seed.json"), "utf8"));

mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "radar.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec(readFileSync(path.join(rootDir, "seed", "schema.sql"), "utf8"));

db.exec("BEGIN");
for (const table of ["cards", "challenges", "messages", "reports", "crawled_sources", "card_events", "claim_requests"]) {
  db.exec(`DELETE FROM ${table}`);
}
const now = Date.now();
const insertIdea = db.prepare("INSERT INTO cards (id, edit_token, data, created_at) VALUES (?, ?, ?, ?)");
seed.ideas.forEach((idea, index) => {
  const createdAt = new Date(now - index * DAY_MS).toISOString();
  insertIdea.run(idea.id, crypto.randomUUID(), JSON.stringify({ ...idea, createdAt }), createdAt);
});
const insertChallenge = db.prepare("INSERT INTO challenges (id, edit_token, data, created_at) VALUES (?, ?, ?, ?)");
for (const challenge of seed.challenges) {
  const createdAt = new Date(now).toISOString();
  insertChallenge.run(challenge.id, crypto.randomUUID(), JSON.stringify({ ...challenge, createdAt }), createdAt);
}
db.exec("COMMIT");
db.close();

console.log(`Seeded ${seed.ideas.length} ideas and ${seed.challenges.length} challenges into ${dataDir}/radar.db`);
