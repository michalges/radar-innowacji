import seedFile from "../../seed/seed.json";
import { seedFileSchema } from "@/lib/schemas";
import type { Card, Challenge } from "@/lib/types";

const DAY_MS = 86_400_000;

const seed = seedFileSchema.parse(seedFile);

export function getSeedCards(): Card[] {
  const now = Date.now();
  return seed.ideas.map((idea, index) => ({ ...idea, createdAt: new Date(now - index * DAY_MS).toISOString() }));
}

export function getSeedChallenges(): Challenge[] {
  const now = new Date().toISOString();
  return seed.challenges.map((challenge) => ({ ...challenge, createdAt: now }));
}

export const CRAWL_FIXTURES = seed.crawlSources;
