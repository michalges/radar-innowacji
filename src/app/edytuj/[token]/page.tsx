import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteCardByToken, markImplemented, updateCardByToken } from "@/app/actions";
import { CardHeader, CardScore, PANEL_CLASS } from "@/components/CardDetails";
import { EditForm } from "@/components/CardForms";
import { getCardByEditToken, getMessages } from "@/lib/repository";

export const metadata: Metadata = { title: "Twój pomysł · Radar Innowacji", robots: { index: false } };

async function EditPageContent({ params }: PageProps<"/edytuj/[token]">) {
  const { token } = await params;
  const card = await getCardByEditToken(token);
  if (!card) {
    notFound();
  }
  const messages = await getMessages(card.id);

  return (
    <>
      <p className="text-sm text-ink-soft">
        Prywatny panel — nie udostępniaj linku. <Link href={`/pomysl/${card.id}`}>Widok publiczny →</Link>
      </p>
      <CardHeader card={card} />
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[3_1_380px] flex-col gap-6">
          <section className={PANEL_CLASS}>
            <h2 className="font-display text-xl font-semibold">Wiadomości ({messages.length})</h2>
            {messages.map((message) => (
              <article key={message.id} className="flex flex-col gap-1 rounded-xl bg-paper p-4 text-[15px]">
                <span className="text-xs font-semibold text-ink-soft">
                  {message.sender} · {new Date(message.createdAt).toLocaleDateString("pl-PL")}
                </span>
                <p className="leading-normal whitespace-pre-line">{message.body}</p>
              </article>
            ))}
          </section>
          <section className={PANEL_CLASS}>
            <h2 className="font-display text-xl font-semibold">Popraw opis</h2>
            <EditForm action={updateCardByToken.bind(null, token)} />
          </section>
          <div className="flex flex-wrap gap-3">
            {card.status !== "wdrozona" && (
              <form action={markImplemented.bind(null, token)}>
                <button type="submit" className="min-h-11 cursor-pointer rounded-full bg-teal px-5 text-sm font-semibold text-white hover:bg-teal-dark">
                  Oznacz jako wdrożone
                </button>
              </form>
            )}
            <form action={deleteCardByToken.bind(null, token)}>
              <button type="submit" className="min-h-11 cursor-pointer rounded-full bg-warn-soft px-5 text-sm font-semibold text-warn hover:bg-[#fde68a]">
                Usuń
              </button>
            </form>
          </div>
        </div>
        <CardScore card={card} />
      </div>
    </>
  );
}

export default function EditPage(props: PageProps<"/edytuj/[token]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Ładuję…</p>}>
      <EditPageContent {...props} />
    </Suspense>
  );
}
