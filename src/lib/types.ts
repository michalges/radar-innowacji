import type { CardEventKind, CardStatus, Criterion, InnovationType, Sector } from "@/lib/constants";

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

export type CardEvent = {
  id: number;
  cardId: string;
  kind: CardEventKind;
  note: string | null;
  createdAt: string;
};

export type RecommendedPath = {
  name: string;
  rule: string;
  steps: { title: string; owner: string }[];
  kpi: string;
};

export type Match<T> = { item: T; similarity: number; reasons: string[] };

export type ClaimRequestStatus = "oczekuje" | "zatwierdzone" | "odrzucone";

/** Why the claim needs a human: the AI did not confirm the materials, or AI verification was unavailable. */
export type ClaimRequestReason = "ai-nie-potwierdzilo" | "ai-niedostepne";

export type ClaimRequest = {
  id: string;
  cardId: string;
  email: string;
  note: string;
  reason: ClaimRequestReason;
  status: ClaimRequestStatus;
  createdAt: string;
  decidedAt: string | null;
};
