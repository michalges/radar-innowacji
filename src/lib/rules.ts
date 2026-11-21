import { SECTORS, type Criterion } from "@/lib/constants";
import type { Card, CriterionScore, RecommendedPath } from "@/lib/types";

export const RADAR_CENTER = 180;
export const RADAR_RADIUS = 160;
const SECTOR_ANGLE = 360 / SECTORS.length;

export function getCriterionScore(scores: CriterionScore[], criterion: Criterion): number {
  return scores.find((score) => score.criterion === criterion)?.score ?? 0;
}

export function getTotalScore(scores: CriterionScore[]): number {
  if (scores.length === 0) {
    return 0;
  }
  const sum = scores.reduce((total, score) => total + score.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export type ReadinessRing = "gotowe" | "pilotaz" | "pomysl";

export function getReadinessRing(readiness: number): ReadinessRing {
  if (readiness >= 7) {
    return "gotowe";
  }
  return readiness >= 4 ? "pilotaz" : "pomysl";
}

export const READINESS_RING_LABELS: Record<ReadinessRing, string> = {
  gotowe: "Gotowe",
  pilotaz: "Pilotaż",
  pomysl: "Pomysł",
};

function getStableFraction(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export function getPolarPoint(angleDegrees: number, radius: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: Math.round((RADAR_CENTER + radius * Math.sin(radians)) * 10) / 10,
    y: Math.round((RADAR_CENTER - radius * Math.cos(radians)) * 10) / 10,
  };
}

/** Sector decides the slice, readiness decides the distance from the centre; the id only spreads dots inside a slice. */
export function getRadarPosition(card: Pick<Card, "id" | "sector" | "readiness">) {
  const sectorIndex = Math.max(0, SECTORS.indexOf(card.sector));
  const angle = sectorIndex * SECTOR_ANGLE + SECTOR_ANGLE * (0.18 + getStableFraction(card.id) * 0.64);
  const clampedReadiness = Math.min(9, Math.max(1, card.readiness));
  const radius = 22 + ((9 - clampedReadiness) / 8) * (RADAR_RADIUS - 36);
  return getPolarPoint(angle, radius);
}

export function isTechnological(card: Pick<Card, "type">): boolean {
  return card.type === "technologiczna";
}

export function getRecommendedPath(card: Card): RecommendedPath {
  const ip = getCriterionScore(card.scores, "ip");
  const replicability = getCriterionScore(card.scores, "replikowalnosc");
  const cost = getCriterionScore(card.scores, "koszt");
  const isTech = isTechnological(card);

  if (isTech && ip >= 4 && card.readiness >= 6) {
    return {
      name: "Komercjalizacja: licencja lub spin-off",
      rule: "technologiczna + potencjał IP ≥ 4 + TRL ≥ 6",
      steps: [
        { title: "Analiza czystości patentowej i wycena", owner: "Centrum transferu technologii uczelni" },
        { title: "Dopasowanie inwestora lub licencjobiorcy z branży", owner: "PCI" },
        { title: "Term sheet lub umowa licencyjna", owner: "Twórcy + inwestor" },
      ],
      kpi: "Podpisana umowa licencyjna lub założona spółka w ciągu 12 miesięcy",
    };
  }
  if (isTech && ip >= 4) {
    return {
      name: "Walidacja w laboratorium PCI + ochrona IP",
      rule: "technologiczna + potencjał IP ≥ 4 + TRL < 6",
      steps: [
        { title: "Testy w laboratorium PCI do poziomu TRL 6", owner: "Laboratorium PCI" },
        { title: "Zabezpieczenie zgłoszenia patentowego", owner: "Rzecznik patentowy" },
        { title: "Pilotaż z partnerem z wyzwania", owner: "Twórcy + partner" },
      ],
      kpi: "Osiągnięcie TRL 6 i pilotaż u 1 partnera w ciągu 9 miesięcy",
    };
  }
  if (!isTech && replicability >= 4) {
    return {
      name: "Transfer do podobnych instytucji",
      rule: "nietechnologiczna + replikowalność ≥ 4",
      steps: [
        { title: "Wygeneruj 1-stronicowy przepis wdrożeniowy", owner: "Radar (automatycznie)" },
        { title: "Zaproponuj 3 instytucjom o podobnym profilu", owner: "Radar (dopasowania)" },
        { title: "Spotkanie twórców z zainteresowanymi", owner: "Twórcy" },
      ],
      kpi: "Liczba instytucji, które wdrożyły model po 6 miesiącach (cel: 3)",
    };
  }
  if (card.isYoungCreator && card.readiness <= 4) {
    return {
      name: "Laboratorium PCI → akcelerator dla młodych",
      rule: "twórcy 16–30 lat + gotowość ≤ 4",
      steps: [
        { title: "Konsultacja z opiekunem laboratorium PCI", owner: "PCI" },
        { title: "Budowa prototypu w laboratorium", owner: "Twórcy" },
        { title: "Zgłoszenie do naboru akceleratora", owner: "Twórcy + PCI" },
      ],
      kpi: "Prototyp gotowy do testów z użytkownikami w ciągu 6 miesięcy",
    };
  }
  if (cost <= 2) {
    return {
      name: "Pozyskanie finansowania grantowego",
      rule: "wysoki koszt wdrożenia (niski koszt ≤ 2)",
      steps: [
        { title: "Wybór naboru (FENG, FEP Podkarpackie, NCBiR)", owner: "Radar (dopasowania)" },
        { title: "Przygotowanie wniosku z partnerem", owner: "Twórcy + partner" },
        { title: "Złożenie wniosku", owner: "Twórcy" },
      ],
      kpi: "Złożony wniosek grantowy w najbliższym naborze",
    };
  }
  return {
    name: "Mentoring i walidacja potrzeby",
    rule: "żadna z reguł szczegółowych nie pasuje",
    steps: [
      { title: "Rozmowy z 5 potencjalnymi użytkownikami", owner: "Twórcy" },
      { title: "Uzupełnienie karty o wyniki", owner: "Twórcy" },
      { title: "Ponowna ocena przez Radar", owner: "Radar (automatycznie)" },
    ],
    kpi: "Potwierdzona potrzeba u co najmniej 3 użytkowników",
  };
}
