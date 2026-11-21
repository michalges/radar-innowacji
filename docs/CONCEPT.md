# Radar Innowacji — Concept

Source brief: `PCI - Pełna treść zadania konkursowego.pdf`

Pipeline the brief expects: find → structure → score → recommend path → match partners, with duplicate detection, demonstrated on ≥2 use cases.

## Core: "Radar" platform with AI intake + transparent scoring

### 1. Low-friction intake
- **"Zgłoś w 2 minuty"**: free text, poster photo, PDF of a school project or voice note → LLM extracts a structured card (problem, solution, type: tech / organizational / educational / social / process, stage, creators, institution, needed resources, tags).
- **Nominate someone else**: anyone can flag "my colleague built X"; the creator gets an invite to confirm. Catches innovations whose authors would never submit them.
- **Passive discovery (auto-detection)**: crawlers/RSS over school, university and municipality websites (news posts, BIP), competition results (olimpiady, Explory, hackathons), PBN/PPM publications, UPRP patents, NCBiR/Interreg project lists. An LLM classifies "is this an innovation?" and creates a *draft* card for moderator verification.

### 2. Structured profile + creator profile
- Shared schema: TRL, plus a readiness scale for social/organizational ideas; mapping to PCI sectors (motoryzacja, jakość życia, ICT, lotnictwo, kosmos).
- Flag for creators aged 16–30 → links to PCI labs and accelerator.

### 3. Transparent scoring
- 6–8 fixed criteria on a 1–5 scale: novelty, problem scale, replicability, readiness, implementation cost, team, social/economic impact, IP potential.
- AI proposes a score **with a written reason and cited evidence** per criterion; a human expert accepts or adjusts it; both versions are stored (repeatable, auditable).
- Visualized as a radar chart.

### 4. Path recommendation (rules + AI)
- Readable decision tree, e.g.:
  - IP + high TRL → commercialization / spin-off / license
  - Organizational + replicable → transfer to other JST as an "open recipe"
  - Early idea from a young creator → PCI accelerator / lab
  - Needs funding → matching grant calls (FENG, FEP Podkarpackie, NCBiR)
- Output: next 3 steps, responsible party, KPIs (covers "mierniki skuteczności").

### 5. Duplicate check + matching (embeddings)
- Vector search over cards, patents, publications and EU projects → "similar solutions already exist".
- **Demand side**: institutions/companies post needs or challenges; two-way matching innovation ↔ need / partner / investor / grant, with explained matches ("same problem tag, TRL 6, same sector").

### 6. After identification
- Pipeline: Zgłoszone → Zweryfikowane → Ocenione → Rekomendacja → W kontakcie → Wdrożone/Przeniesione.
- Follow-ups + regional dashboard (heatmap per powiat and sector, conversion rate).

## Differentiators (pick 1–2)
- **"Ambasadorzy radaru"**: one designated person per school/office, gamified leaderboard.
- **Replication kit**: auto-generated one-page "how to implement this in your institution" guide.
- **Weekly digest** of relevant new innovations for matched institutions/investors.
- **Multi-tenant** from day one: one instance per region or PCI-like body, optional shared search across instances.

## Demo cases (≥2, different types)
1. **Tech**: university student team's drone crop sensor → TRL 5, similar UPRP patent found → license + PCI aviation lab, matched with an agri company.
2. **Organizational**: a gmina's digital office queue system or a school's peer-tutoring model → replicable → transfer to 3 similar JST, replication kit generated.
3. (Optional) **Auto-detected** from a school news page.

## Stack suggestion
Next.js + Postgres/pgvector (or Supabase), LLM API for extraction, scoring rationale and embeddings, cron-based scrapers, seed data from a few real public sources. Document data sources, AI limitations (human always decides) and GDPR (creator consent, minors aged 16–17) on one slide.

## Scope priority
- **Must**: intake → AI card → scoring with rationale → path recommendation → similar items + matches, working on 2 cases.
- **Nice**: crawler, dashboard, digest.
- **Skip**: complex auth, integrations beyond 1–2 sources.

## Submission checklist
- Project title, problem and solution description, how it works and main functions
- PDF presentation (max 10 slides)
- Video (max 3 min), public link
- Optional: repo, live demo, screenshots
