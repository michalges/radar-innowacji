# Radar Innowacji

Wyłapuje innowacje ze szkół, uczelni i urzędów, ocenia je tanimi modelami AI według jawnych kryteriów i łączy z tymi, którzy mogą je wdrożyć. Bez logowania i bez ręcznej moderacji. Koncepcja: [docs/CONCEPT.md](docs/CONCEPT.md).

## Uruchomienie

```bash
pnpm install
cp .env.example .env.local   # wpisz OPENROUTER_API_KEY
pnpm dev                     # http://localhost:3000
```

Wymaga Node.js 24 (wbudowany `node:sqlite`). Baza tworzy się sama w `data/radar.db` z danymi demo; usuń folder `data/`, żeby zacząć od nowa.

## Skrypty

- `pnpm dev`, `pnpm build`, `pnpm start`
- `pnpm lint`, `pnpm types:check`
- `curl -X POST localhost:3000/api/crawl` — demo skanu źródeł (to samo co przycisk na radarze); ustaw `CRON_SECRET`, żeby wymagać nagłówka `Authorization: Bearer …`.

## Struktura

- `src/lib/pipeline.ts` — moderacja, karta, ocena (OpenRouter, model z `OPENROUTER_MODEL`, eskalacja przy wynikach blisko progu)
- `src/lib/rules.ts` — pozycja na radarze, ścieżki, wynik
- `src/lib/similarity.ts` — duplikaty i dopasowania (TF-IDF)
- `src/lib/repository.ts`, `src/lib/db.ts`, `src/lib/seed.ts` — dane
- `src/app` — strony: radar, mapa, zgłoś, pomysł, edycja (link), wyzwania, kryteria

## Deploy (Coolify)

1. New resource → Docker Compose → this repo (`docker-compose.yml`).
2. Set env: `OPENROUTER_API_KEY` (optionally `OPENROUTER_MODEL`, `CRON_SECRET`).
3. Assign a domain to service `app`, port 3000.

Each container start resets the database to `seed/seed.json` (demo mode). Remove `node scripts/seed.mjs &&` from the Dockerfile `CMD` to keep data between deploys.
