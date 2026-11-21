import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { claimCard, reportCard, sendMessage } from "@/app/actions";
import { CardHeader, CardPath, CardProfile, CardScore, CardTimeline, PANEL_CLASS } from "@/components/CardDetails";
import { ClaimForm, ContactForm, ReportForm } from "@/components/CardForms";
import { FundingPanel } from "@/components/FundingPanel";
import { DUPLICATE_SIMILARITY } from "@/lib/constants";
import { getCard, getCardEditToken, getCardEvents, getCards, getChallenges } from "@/lib/repository";
import { getChallengesForCard, getSimilarCards } from "@/lib/similarity";

const LINK_ROW_CLASS = "flex flex-col gap-0.5 rounded-xl p-3 text-ink no-underline";

async function IdeaPageContent({ params, searchParams }: PageProps<"/pomysl/[id]">) {
  const { id } = await params;
  const { edycja } = await searchParams;
  const card = await getCard(id);
  if (!card) {
    notFound();
  }
  const [cards, challenges, events] = await Promise.all([getCards(), getChallenges(), getCardEvents(card.id)]);
  const similarCards = getSimilarCards(card, cards);
  const matchingChallenges = getChallengesForCard(card, challenges);
  const isOwnerView = typeof edycja === "string" && edycja === getCardEditToken(card.id);

  return (
    <>
      {isOwnerView && (
        <p className="rounded-2xl bg-green-soft px-5 py-4 text-[15px] text-green">
          <b>Opublikowane.</b> Twój link do edycji: <Link href={`/edytuj/${edycja}`}>/edytuj/{edycja.slice(0, 8)}…</Link>
        </p>
      )}
      <CardHeader card={card} />
      <div className="flex flex-wrap gap-6">
        <CardProfile card={card} />
        <CardScore card={card} />
      </div>
      <div className="flex flex-wrap gap-6">
        <CardPath card={card} />
        <section className={`${PANEL_CLASS} flex-[2_1_320px]`}>
          <h2 className="font-display text-xl font-semibold">Pasuje do</h2>
          {matchingChallenges.map((match) => (
            <Link key={match.item.id} href={`/wyzwania/${match.item.id}`} className={`${LINK_ROW_CLASS} bg-mint hover:bg-green-soft`}>
              <span className="text-sm font-semibold">{match.item.title}</span>
              <span className="text-xs text-ink-soft">{match.item.organization}</span>
            </Link>
          ))}
          {similarCards.map((match) => {
            const isDuplicate = match.similarity >= DUPLICATE_SIMILARITY;
            return (
              <Link
                key={match.item.id}
                href={`/pomysl/${match.item.id}`}
                className={`${LINK_ROW_CLASS} ${isDuplicate ? "bg-warn-soft" : "border border-line hover:bg-paper"}`}
              >
                <span className="text-sm font-semibold">
                  {isDuplicate && "Możliwy duplikat: "}
                  {match.item.title}
                </span>
                <span className="text-xs text-ink-soft">{match.reasons.join(" · ")}</span>
              </Link>
            );
          })}
          {matchingChallenges.length + similarCards.length === 0 && <p className="text-sm text-ink-soft">Brak dopasowań.</p>}
        </section>
      </div>
      <div className="flex flex-wrap gap-6">
        <section className={`${PANEL_CLASS} flex-[3_1_380px]`}>
          <h2 className="font-display text-xl font-semibold">Napisz do twórców</h2>
          <ContactForm action={sendMessage.bind(null, card.id)} />
        </section>
        <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-6">
          <FundingPanel card={card} />
          {!card.isClaimed && (
            <section id="przejmij" className={`${PANEL_CLASS} bg-mint`}>
              <h2 className="font-display text-xl font-semibold">To Twój pomysł?</h2>
              <ClaimForm action={claimCard.bind(null, card.id)} />
            </section>
          )}
          <CardTimeline card={card} events={events} />
          <ReportForm action={reportCard.bind(null, card.id)} />
        </div>
      </div>
    </>
  );
}

export default function IdeaPage(props: PageProps<"/pomysl/[id]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Ładuję…</p>}>
      <IdeaPageContent {...props} />
    </Suspense>
  );
}
