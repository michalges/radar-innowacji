import { runCrawler } from "@/lib/crawler";

/** Entry point for a scheduled job (cron); send `Authorization: Bearer $CRON_SECRET` when the secret is set. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Brak autoryzacji" }, { status: 401 });
  }
  const summary = await runCrawler();
  return Response.json(summary, { status: summary.error ? 502 : 200 });
}
