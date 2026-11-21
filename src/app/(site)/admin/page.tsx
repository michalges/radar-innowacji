import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { decideClaimRequest, logoutAdmin } from "@/app/actions";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getIsAdmin, hasAdminToken } from "@/lib/admin";
import { getCardEditToken, getCards, getClaimRequests } from "@/lib/repository";
import type { ClaimRequest, ClaimRequestReason, ClaimRequestStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Weryfikacja zgłoszeń · Radar Innowacji", robots: { index: false } };

const REASON_LABELS: Record<ClaimRequestReason, string> = {
  "ai-nie-potwierdzilo": "AI nie potwierdziło materiałów",
  "ai-niedostepne": "AI było niedostępne",
};

const STATUS_STYLES: Record<ClaimRequestStatus, { label: string; className: string }> = {
  oczekuje: { label: "Oczekuje", className: "bg-warn-soft text-warn" },
  zatwierdzone: { label: "Zatwierdzone", className: "bg-green-soft text-green" },
  odrzucone: { label: "Odrzucone", className: "bg-paper text-ink-soft" },
};

const DATE_FORMAT = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

function ClaimRequestItem({ request, cardTitle }: { request: ClaimRequest; cardTitle: string }) {
  const status = STATUS_STYLES[request.status];
  const editToken = request.status === "zatwierdzone" ? getCardEditToken(request.cardId) : null;
  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link href={`/pomysl/${request.cardId}`} className="font-display text-lg font-semibold">
          {cardTitle}
        </Link>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">E-mail</dt>
        <dd className="min-w-0 break-all">{request.email}</dd>
        <dt className="text-muted">Powód</dt>
        <dd>{REASON_LABELS[request.reason]}</dd>
        <dt className="text-muted">Zgłoszono</dt>
        <dd>{DATE_FORMAT.format(new Date(request.createdAt))}</dd>
      </dl>
      <p className="rounded-2xl bg-paper px-4 py-3 text-[15px] whitespace-pre-line">{request.note}</p>
      {request.status === "oczekuje" && (
        <form action={decideClaimRequest.bind(null, request.id)} className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="decision"
            value="zatwierdz"
            className="min-h-11 cursor-pointer rounded-full bg-teal px-5 text-sm font-semibold text-white hover:bg-teal-dark"
          >
            Zatwierdź autorstwo
          </button>
          <button
            type="submit"
            name="decision"
            value="odrzuc"
            className="min-h-11 cursor-pointer rounded-full bg-paper px-5 text-sm font-semibold text-ink hover:bg-line-soft"
          >
            Odrzuć
          </button>
        </form>
      )}
      {editToken && (
        <p className="text-sm text-ink-soft">
          Link do panelu dla właściciela (w produkcji wysyłany mailem): <Link href={`/edytuj/${editToken}`}>/edytuj/{editToken.slice(0, 8)}…</Link>
        </p>
      )}
    </li>
  );
}

async function AdminContent() {
  if (!hasAdminToken()) {
    return <p className="text-ink-soft">Panel jest wyłączony. Ustaw zmienną środowiskową ADMIN_TOKEN, aby go włączyć.</p>;
  }
  if (!(await getIsAdmin())) {
    return <AdminLoginForm />;
  }
  const [requests, cards] = await Promise.all([getClaimRequests(), getCards()]);
  const cardTitles = new Map(cards.map((card) => [card.id, card.title]));
  const pendingCount = requests.filter((request) => request.status === "oczekuje").length;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft">
          <b className="text-ink">{pendingCount}</b> oczekujących zgłoszeń. Przed zatwierdzeniem potwierdź autorstwo mailowo lub telefonicznie z instytucją.
        </p>
        <form action={logoutAdmin}>
          <button type="submit" className="min-h-10 cursor-pointer rounded-full bg-paper px-4 text-sm font-semibold text-ink hover:bg-line-soft">
            Wyloguj
          </button>
        </form>
      </div>
      {requests.length === 0 ? (
        <p className="text-ink-soft">Brak zgłoszeń do ręcznej weryfikacji.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((request) => (
            <ClaimRequestItem key={request.id} request={request} cardTitle={cardTitles.get(request.cardId) ?? request.cardId} />
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-tight font-extrabold tracking-tight">
        Weryfikacja <span className="text-teal">autorstwa</span>
      </h1>
      <Suspense fallback={<p className="text-ink-soft">Ładuję…</p>}>
        <AdminContent />
      </Suspense>
    </div>
  );
}
