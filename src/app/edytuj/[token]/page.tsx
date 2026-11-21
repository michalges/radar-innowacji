import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteCardByToken, markImplemented, updateCardByToken } from "@/app/actions";
import { CardHeader, CardScore, PANEL_CLASS } from "@/components/CardDetails";
import { EditForm } from "@/components/CardForms";
import { getCardByEditToken, getMessages } from "@/lib/repository";

export const metadata: Metadata = { title: "Twoja karta · Radar Innowacji", robots: { index: false } };

async function EditPageContent({ params }: PageProps<"/edytuj/[token]">) {
  const { token } = await params;
  const card = await getCardByEditToken(token);
  if (!card) {
    notFound();
  }
  const messages = await getMessages(card.id);

  return (
    <>
      <p className="rounded-2xl bg-mint px-5 py-3 text-sm text-teal-dark">
        To Twój prywatny panel karty. Nie udostępniaj tego linku. <Link href={`/karta/${card.id}`}>Zobacz publiczną kartę →</Link>
      </p>
      <CardHeader card={card} />
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[3_1_380px] flex-col gap-6">
          <section className={PANEL_CLASS}>
            <h2 className="font-display text-xl font-semibold">Wiadomości ({messages.length})</h2>
            {messages.length === 0 && <p className="text-sm text-ink-soft">Jeszcze nikt nie napisał. Dopasowane gminy i firmy dostają Twoją kartę w cotygodniowym zestawieniu.</p>}
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
            <h2 className="font-display text-xl font-semibold">Popraw kartę</h2>
            <EditForm action={updateCardByToken.bind(null, token)} />
          </section>
          <section className={`${PANEL_CLASS} flex-row flex-wrap items-center`}>
            {card.status !== "wdrozona" && (
              <form action={markImplemented.bind(null, token)}>
                <button type="submit" className="min-h-11 cursor-pointer rounded-full bg-teal px-5 text-sm font-semibold text-white hover:bg-teal-dark">
                  Oznacz jako wdrożone
                </button>
              </form>
            )}
            <form action={deleteCardByToken.bind(null, token)}>
              <button type="submit" className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-5 text-sm font-semibold text-warn hover:bg-warn-soft">
                Usuń kartę
              </button>
            </form>
          </section>
        </div>
        <CardScore card={card} />
      </div>
    </>
  );
}

export default function EditPage(props: PageProps<"/edytuj/[token]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Ładuję panel…</p>}>
      <EditPageContent {...props} />
    </Suspense>
  );
}
