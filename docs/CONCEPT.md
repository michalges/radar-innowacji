# Radar Innowacji — Concept

## In one paragraph

Radar Innowacji is a public web app that finds innovations hidden in schools, universities, municipal offices (JST) and local organisations, and gets them to the people who can use, fund or replicate them. Innovations come in two ways: people submit them in a 2-minute form, and a crawler detects them in public sources. Cheap AI models check each one, structure it into a card, score it on fixed criteria, place it on a sector radar, recommend a path and match it with challenges and partners. There is no admin queue and no login.

## Who it is for

| User | What they want | What they do in the app |
|---|---|---|
| **Creator**: teacher, student, clerk, NGO member, young creator aged 16–30 | Recognition, help, a partner, funding | Submit an idea, or claim a card the crawler found |
| **Seeker**: gmina, company, school, investor | A ready solution to a concrete problem | Browse the radar, post a challenge, contact creators |
| **PCI / the region** | A picture of regional innovation, and more transfer and commercialisation | Read the regional view and the pipeline stats; no daily manual work |

## How someone uses it (no account)

1. **I have an idea** → **Zgłoś** → describe it in a few sentences or upload a photo or PDF (voice note optional) → check the AI-generated card → the card is published with a score, a recommended path and matches → an email with a secret edit link arrives.
2. **The crawler found my work** → open the card → **"To moje — przejmij kartę"** → confirm with an email from the institution's domain → complete the details.
3. **I'm looking for solutions** → browse the radar by sector or readiness, or post a problem under **Wyzwania** → see matching innovations, with the reason each one matched → **"Chcę się skontaktować"** (the message is relayed, so nobody's email address is exposed).

## End-to-end flow

```
Zgłoś form  ─┐
Crawler     ─┼→ AI pipeline → public card → score + path → matching ↔ challenges
             │                                                   ↓
Challenges  ─┘                                contact → "W kontakcie" → implemented / transferred
```

Card stages: **Zgłoszone → Ocenione → Rekomendacja → W kontakcie → Wdrożone / Przeniesione**. Stages advance automatically on events: card published, contact made, creator marks it implemented.

## Automatic pipeline (no admin)

| # | Step | Done by | Result |
|---|---|---|---|
| 1 | Safety filter | small LLM (e.g. Claude Haiku) | Blocks spam, offensive and off-topic content, and personal data of minors |
| 2 | "Is this an innovation?" | small LLM | Confidence: **≥70%** published · **40–70%** published as "niepotwierdzone" · **<40%** dropped |
| 3 | Fill in the card | small LLM | Card schema fields, each with a **quote from the source** |
| 4 | Duplicates | embeddings (no LLM) | Close match: merged, or marked "podobne do X" |
| 5 | Scoring | small LLM, fixed output format | 1–5 per criterion, each with a reason and evidence |
| 6 | Path + matches | rules + embeddings | Recommended path, matching challenges, partners, grant calls |

A stronger model is called only when the small one returns confidence near a threshold. This keeps the cost low.

### Quality control without a moderator
- Every card shows its AI confidence and source quotes, so a reader can verify it.
- **"Zgłoś błąd"** on every card. After N reports the card drops to "niepotwierdzone" and is re-checked.
- The creator, through the edit link, corrects their card; the AI re-scores it.
- Rate limits per email and IP. Every AI decision is logged with the model, prompt version and input, so it can be audited.

## Card schema

- Title, problem, solution, effect / evidence
- Type: technological · organisational · educational · social · process
- Readiness: **TRL 1–9** (tech) or **ORL 1–9** (organisational/social readiness)
- PCI sector: motoryzacja · jakość życia · ICT · lotnictwo · kosmos
- Creators: role and age group; names of minors are not published
- Institution, powiat
- Resources needed, tags
- Source (form or URL), source quotes, AI confidence, status

## Scoring (transparent criteria)

8 fixed criteria, each scored 1–5 with a written reason and cited evidence:

| Criterion | Question |
|---|---|
| Nowość (novelty) | How new is it in the region or sector? |
| Skala problemu (scale of the problem) | How many people or institutions have this problem? |
| Replikowalność (replicability) | Can another institution copy it easily? |
| Gotowość (readiness) | TRL / ORL level |
| Niski koszt (low cost) | Cost to implement or replicate |
| Zespół (team) | Can the team carry it forward? |
| Wpływ społeczny / gospodarczy (social / economic impact) | Expected effect |
| Potencjał IP (IP potential) | Patentable or licensable? |

The total is the average of the 8 scores. It is shown as a radar chart on the card. The rubric is fixed and versioned, so the same input gets the same score.

## Path recommendation (readable rules)

| Condition | Path |
|---|---|
| Tech + IP potential ≥ 4 + TRL ≥ 6 | Commercialisation: licence / spin-off, matched investor |
| Organisational/educational + replicability ≥ 4 | Transfer to similar institutions, auto-generated **przepis wdrożeniowy** (1-page "how to implement" guide) |
| Creator 16–30 + TRL ≤ 4 | PCI lab → PCI accelerator |
| Needs funding | Matching grant calls (FENG, FEP Podkarpackie, NCBiR, …) |
| Similar card exists | Connect the creators before going further |

Each path gives **3 next steps, who is responsible, and a KPI** (e.g. "number of schools that adopted the model after 6 months").

## The radar

- **Slice** = PCI sector
- **Distance from the centre** = readiness: outer ring **POMYSŁ** (1–3), middle ring **PILOTAŻ** (4–6), centre **GOTOWE** (7–9)
- **Dot colour** = technological (teal) vs organisational/social (lime)
- Placement is a pure function of the card's fields, so it can be reproduced and explained.

## Matching and duplicates

- Embeddings over cards, challenges, patents (UPRP), publications and EU/NCBiR project lists.
- Two-way matching: innovation ↔ challenge, partner, investor, grant call.
- Every match is explained, e.g. "ten sam problem · Jakość życia · TRL 4".
- Weekly email digest of new matches for people who posted challenges.

## No-login model

- **Submit or post a challenge:** email → secret edit link (a capability URL). No passwords, no accounts.
- **Claim a crawled card:** confirm with an email from the institution's domain.
- **Contact:** relayed messages; addresses are never shown.
- **Minors (16–17):** parental consent via an email link; no names published, only the institution.

## Data sources

School, university and gmina websites (news pages, RSS), BIP, competition and hackathon results, UPRP patents, PBN/PPM publications, NCBiR / Interreg / FENG project lists. For the demo, use 10–20 real public news items collected by hand; real crawling of 1–2 RSS feeds is a nice-to-have.

## Screens

| Screen | Purpose | Design board |
|---|---|---|
| **Radar** (home) | Explore innovations by sector and readiness; recent detections | B+C "Radar w stylu Otwartego laboratorium" |
| **Zgłoś** | Submit in 2 minutes, AI card preview, duplicate hint | C "Otwarte laboratorium" |
| **Karta innowacji** | Full card, radar score with reasons, path, matches | A (content), to be restyled in C |
| **Wyzwania** | Post a problem, see matches | to design |
| **Status / edit** (via link) | Creator's card, stage, incoming contacts | to design |
| **Mapa regionu** | Heatmap per powiat and sector, conversion stats | to design |

### Visual direction
"Otwarte laboratorium" style: white background, dark ink `#1B1530`, Bricolage Grotesque headings + Inter body, teal accent `#0F766E`, lime `#A3E635` as the second colour, mint/lime/cream pastel tints, thin light 1px borders, pill-shaped buttons and tags.

Design canvas (private, shared from the Share menu): https://claude.ai/artifact/2ks9QeHBjEeDJLmwD5CrbY

## Tech stack (suggested)

- Next.js (App Router) + Tailwind
- Postgres + pgvector (or Supabase)
- Claude Haiku for steps 1–5; a larger Claude model only for borderline cases
- Embeddings for duplicates and matching
- Cron job for the crawler and the weekly digest
- Transactional email for edit links and relayed contact

## Demo script (≈3 min, 2+ cases of different types)

1. **Organisational case:** submit "Uczeń uczy ucznia" (peer tutoring) through Zgłoś → card, score, path = transfer to other schools + przepis wdrożeniowy.
2. **Tech case, auto-detected:** the air-quality sensor built by students appears on the radar from a school news page → the teacher claims it → path = PCI lab → accelerator.
3. **Matching:** a gmina posts "smog przy szkołach" → the sensor card matches instantly → contact → stage "W kontakcie".

## Mapping to the brief

| Brief requirement | Covered by |
|---|---|
| Identify hidden innovations | Zgłoś form, nominating others, crawler |
| Structure and profile | Card schema, AI extraction with quotes |
| Assess with transparent criteria | 8-criterion rubric, reasons, radar chart |
| Recommend a path + measures of effectiveness | Rules table, 3 steps + KPI |
| Match with partners, avoid duplicate work | Embeddings, explained matches, duplicate check |
| What happens after identification | Card stages, contact relay, digest |
| ≥2 demo cases | Tutoring (organisational) + air sensor (tech) |
| Data sources, AI limitations, GDPR | Sections above + risks below |
| Scalability | Multi-tenant per region; cheap models; no manual moderation |

## Risks and answers

| Risk | Mitigation |
|---|---|
| AI scores or classifies wrongly | Visible confidence, source quotes, "zgłoś błąd", creator edits, logged decisions |
| Spam / abuse without login | Safety filter, rate limits, publish threshold, email confirmation |
| Personal data / minors | No names of minors, parental consent link, delete via edit link, GDPR basis = consent |
| Crawled content without consent | Only public institutional sources; claim or remove via the card |
| Judges expect human oversight | Auditable rules and logs; an optional expert-review mode can be switched on per region |

## Scope for the deadline

- **Must have:** Zgłoś → AI card → scoring with reasons → path → duplicates + matches, working on 2 cases; Radar screen.
- **Nice to have:** real crawler on 1–2 feeds, Wyzwania screen, regional map, digest.
- **Skip:** accounts, admin panel, integrations beyond 1–2 sources.
