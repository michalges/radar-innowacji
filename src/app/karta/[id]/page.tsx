import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { claimCard, reportCard, sendMessage } from "@/app/actions";
import { CardHeader, CardPath, CardProfile, CardScore, PANEL_CLASS } from "@/components/CardDetails";
import { ClaimForm, ContactForm, ReportForm } from "@/components/CardForms";
import { DUPLICATE_SIMILARITY } from "@/lib/constants";
import { getCard, getCardEditToken, getCards, getChallenges } from "@/lib/repository";
import { getChallengesForCard, getSimilarCards } from "@/lib/similarity";

function getPercent(similarity: number): string {
  return `${Math.round(Math.min(similarity, 1) * 100)}%`;
}

async function CardPageContent({ params, searchParams }: PageProps<"/karta/[id]">) {
  const { id } = await params;
  const { edycja } = await searchParams;
  const card = await getCard(id);
  if (!card) {
    notFound();
  }
  const [cards, challenges] = await Promise.all([getCards(), getChallenges()]);
  const similarCards = getSimilarCards(card, cards);
  const matchingChallenges = getChallengesForCard(card, challenges);
  const isOwnerView = typeof edycja === "string" && edycja === getCardEditToken(card.id);

  return (
    <>
      {isOwnerView && (
        <div className="flex flex-col gap-1 rounded-2xl bg-green-soft px-5 py-4 text-[15px] text-green">
          <b>Gotowe — karta jest na radarze.</b>
          <span>
            Twój prywatny link do edycji (w produkcji przychodzi mailem):{" "}
            <Link href={`/edytuj/${edycja}`} className="font-semibold">
              /edytuj/{edycja.slice(0, 8)}…
            </Link>
          </span>
        </div>
      )}
      <CardHeader card={card} />
      <div className="flex flex-wrap gap-6">
        <CardProfile card={card} />
        <CardScore card={card} />
      </div>
      <div className="flex flex-wrap gap-6">
        <CardPath card={card} />
        <section className={`${PANEL_CLASS} flex-[2_1_320px]`}>
          <h2 className="font-display text-xl font-semibold">Dopasowania i podobne</h2>
          {matchingChallenges.map((match) => (
            <Link
              key={match.item.id}
              href={`/wyzwania/${match.item.id}`}
              className="flex flex-col gap-0.5 rounded-xl border border-line p-3 text-ink no-underline hover:bg-paper"
            >
              <span className="text-sm font-semibold">Wyzwanie: {match.item.title}</span>
              <span className="text-xs text-ink-soft">
                {match.item.organization} · {match.reasons.join(" · ")}
              </span>
            </Link>
          ))}
          {similarCards.map((match) => (
            <Link
              key={match.item.id}
              href={`/karta/${match.item.id}`}
              className={`flex flex-col gap-0.5 rounded-xl p-3 text-ink no-underline ${match.similarity >= DUPLICATE_SIMILARITY ? "bg-warn-soft" : "border border-line hover:bg-paper"}`}
            >
              <span className="text-sm font-semibold">
                {match.similarity >= DUPLICATE_SIMILARITY ? "Możliwy duplikat: " : "Podobne: "}
                {match.item.title}
              </span>
              <span className="text-xs text-ink-soft">
                podobieństwo {getPercent(match.similarity)} · {match.reasons.join(" · ")}
              </span>
            </Link>
          ))}
          {matchingChallenges.length + similarCards.length === 0 && (
            <p className="text-sm text-ink-soft">Brak dopasowań. Gdy pojawi się pasujące wyzwanie, twórcy dostaną powiadomienie.</p>
          )}
        </section>
      </div>
      <div className="flex flex-wrap gap-6">
        <section className={`${PANEL_CLASS} flex-[3_1_380px]`}>
          <h2 className="font-display text-xl font-semibold">Napisz do twórców</h2>
          <p className="text-sm text-ink-soft">Przekażemy wiadomość — adresy e-mail pozostają ukryte po obu stronach.</p>
          <ContactForm action={sendMessage.bind(null, card.id)} />
        </section>
        <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-6">
          {!card.isClaimed && (
            <section id="przejmij" className={`${PANEL_CLASS} bg-mint`}>
              <h2 className="font-display text-xl font-semibold">To Wasza innowacja?</h2>
              <p className="text-sm text-ink-soft">Przejmij kartę, żeby ją poprawić i odbierać wiadomości. Bez zakładania konta.</p>
              <ClaimForm action={claimCard.bind(null, card.id)} />
            </section>
          )}
          <section className={PANEL_CLASS}>
            <h2 className="font-display text-xl font-semibold">Coś się nie zgadza?</h2>
            <p className="text-sm text-ink-soft">Kartę stworzyło AI. Zgłoszenia błędów cofają ją do weryfikacji.</p>
            <ReportForm action={reportCard.bind(null, card.id)} />
          </section>
        </div>
      </div>
    </>
  );
}

export default function CardPage(props: PageProps<"/karta/[id]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Ładuję kartę…</p>}>
      <CardPageContent {...props} />
    </Suspense>
  );
}
