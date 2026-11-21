export const SECTORS = ["motoryzacja", "jakosc-zycia", "ict", "lotnictwo", "kosmos"] as const;
export type Sector = (typeof SECTORS)[number];

export const SECTOR_LABELS: Record<Sector, string> = {
  motoryzacja: "Motoryzacja",
  "jakosc-zycia": "Jakość życia",
  ict: "ICT",
  lotnictwo: "Lotnictwo",
  kosmos: "Kosmos",
};

export const INNOVATION_TYPES = ["technologiczna", "organizacyjna", "edukacyjna", "spoleczna", "procesowa"] as const;
export type InnovationType = (typeof INNOVATION_TYPES)[number];

export const INNOVATION_TYPE_LABELS: Record<InnovationType, string> = {
  technologiczna: "Technologiczna",
  organizacyjna: "Organizacyjna",
  edukacyjna: "Edukacyjna",
  spoleczna: "Społeczna",
  procesowa: "Procesowa",
};

export const CRITERIA = [
  "nowosc",
  "skala",
  "replikowalnosc",
  "gotowosc",
  "koszt",
  "zespol",
  "wplyw",
  "ip",
] as const;
export type Criterion = (typeof CRITERIA)[number];

export const CRITERION_LABELS: Record<Criterion, string> = {
  nowosc: "Nowość",
  skala: "Skala problemu",
  replikowalnosc: "Replikowalność",
  gotowosc: "Gotowość",
  koszt: "Niski koszt",
  zespol: "Zespół",
  wplyw: "Wpływ",
  ip: "Potencjał IP",
};

export const CRITERION_QUESTIONS: Record<Criterion, string> = {
  nowosc: "Jak nowe jest to rozwiązanie w regionie lub branży?",
  skala: "Ilu ludzi lub instytucji dotyczy problem?",
  replikowalnosc: "Czy inna instytucja łatwo to powtórzy?",
  gotowosc: "Poziom TRL/ORL (1–9) przeskalowany na 1–5.",
  koszt: "Czy wdrożenie lub powtórzenie jest tanie?",
  zespol: "Czy zespół jest w stanie rozwijać rozwiązanie dalej?",
  wplyw: "Jaki jest oczekiwany efekt społeczny lub gospodarczy?",
  ip: "Czy rozwiązanie można opatentować lub licencjonować?",
};

export const CARD_STATUSES = ["opublikowana", "niepotwierdzona", "w-kontakcie", "wdrozona"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  opublikowana: "Ocenione",
  niepotwierdzona: "Niepotwierdzone",
  "w-kontakcie": "W kontakcie",
  wdrozona: "Wdrożone",
};

export const PUBLISH_CONFIDENCE = 0.7;
export const UNCONFIRMED_CONFIDENCE = 0.4;
export const ESCALATION_MARGIN = 0.08;
export const REPORTS_TO_UNCONFIRM = 3;
export const DUPLICATE_SIMILARITY = 0.55;
export const MATCH_SIMILARITY = 0.12;

export const FREE_EMAIL_DOMAINS = ["gmail.com", "wp.pl", "o2.pl", "onet.pl", "interia.pl", "outlook.com", "yahoo.com", "icloud.com"];

export const CARD_EVENT_KINDS = ["ocenione", "niepotwierdzone", "potwierdzone", "w-kontakcie", "wdrozone", "poprawione", "zgloszenie-bledu", "notatka"] as const;
export type CardEventKind = (typeof CARD_EVENT_KINDS)[number];

export const CARD_EVENT_LABELS: Record<CardEventKind, string> = {
  ocenione: "Ocenione",
  niepotwierdzone: "Do weryfikacji",
  potwierdzone: "Właściciel potwierdził",
  "w-kontakcie": "W kontakcie",
  wdrozone: "Wdrożone",
  poprawione: "Opis poprawiony",
  "zgloszenie-bledu": "Zgłoszono błąd",
  notatka: "Notatka",
};
