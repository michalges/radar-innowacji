import { z } from "zod";
import { CARD_STATUSES, CRITERIA, INNOVATION_TYPES, SECTORS } from "@/lib/constants";

export const cardContentSchema = z.object({
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

export const criterionScoreSchema = z.object({
  criterion: z.enum(CRITERIA),
  score: z.number().int().min(1).max(5),
  reason: z.string(),
  evidence: z.string(),
});

export const seedIdeaSchema = cardContentSchema.extend({
  id: z.string(),
  source: z.enum(["zgloszenie", "crawler"]),
  sourceUrl: z.string().nullable(),
  sourceLabel: z.string(),
  sourceText: z.string(),
  quotes: z.record(z.string(), z.string()),
  scores: z.array(criterionScoreSchema),
  confidence: z.number().min(0).max(1),
  model: z.string(),
  status: z.enum(CARD_STATUSES),
  reports: z.number().int(),
  isClaimed: z.boolean(),
});

export const seedChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  organization: z.string(),
  sector: z.enum(SECTORS).nullable(),
});

export const seedFileSchema = z.object({
  ideas: z.array(seedIdeaSchema),
  challenges: z.array(seedChallengeSchema),
  crawlSources: z.array(z.object({ url: z.string(), label: z.string(), text: z.string() })),
});
