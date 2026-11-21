import type { CardStatus, Criterion, InnovationType, Sector } from "@/lib/constants";

export type CriterionScore = {
  criterion: Criterion;
  score: number;
  reason: string;
  evidence: string;
};

export type CardContent = {
  title: string;
  problem: string;
  solution: string;
  effect: string;
  type: InnovationType;
  readinessScale: "TRL" | "ORL";
  readiness: number;
  sector: Sector;
  creators: string;
  hasMinors: boolean;
  isYoungCreator: boolean;
  institution: string;
  region: string;
  resources: string;
  tags: string[];
  missing: string[];
};

export type Card = CardContent & {
  id: string;
  source: "zgloszenie" | "crawler";
  sourceUrl: string | null;
  sourceLabel: string;
  sourceText: string;
  quotes: Partial<Record<keyof CardContent, string>>;
  scores: CriterionScore[];
  confidence: number;
  model: string;
  status: CardStatus;
  reports: number;
  isClaimed: boolean;
  createdAt: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  organization: string;
  sector: Sector | null;
  createdAt: string;
};

export type Message = {
  id: string;
  cardId: string;
  sender: string;
  body: string;
  createdAt: string;
};

export type RecommendedPath = {
  name: string;
  rule: string;
  steps: { title: string; owner: string }[];
  kpi: string;
};

export type Match<T> = { item: T; similarity: number; reasons: string[] };
