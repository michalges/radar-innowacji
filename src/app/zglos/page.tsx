import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = { title: "Zgłoś innowację · Radar Innowacji" };

const STEPS = [
  { title: "AI sprawdza", text: "Czy to innowacja, czy treść jest bezpieczna i czy podobne rozwiązanie już istnieje." },
  { title: "AI układa kartę", text: "Problem, rozwiązanie, gotowość, sektor — z cytatami z Twojego opisu." },
  { title: "Ocena i ścieżka", text: "8 jawnych kryteriów, rekomendowana ścieżka i dopasowane wyzwania." },
  { title: "Link do edycji", text: "Bez konta: poprawiasz kartę i odpowiadasz na wiadomości przez link." },
];

export default function SubmitPage() {
  return (
    <>
      <div className="flex max-w-190 flex-col gap-3">
        <h1 className="font-display text-[clamp(36px,5vw,60px)] leading-none font-extrabold tracking-tight">
          Masz pomysł, który działa? <span className="text-teal">Zgłoś w 2 minuty.</span>
        </h1>
        <p className="text-lg leading-normal text-ink-soft">
          Napisz albo wklej opis. AI ułoży z niego kartę innowacji, oceni ją i opublikuje na radarze, a Ty dostaniesz link do poprawek.
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-7">
        <SubmitForm />
        <aside aria-label="Co się stanie" className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-3xl bg-mint p-6">
          <h2 className="text-[13px] font-semibold tracking-wide text-teal-dark uppercase">Co się stanie po wysłaniu</h2>
          <ol className="flex flex-col gap-3.5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3.5 rounded-2xl bg-white p-4">
                <span className="flex size-8 flex-none items-center justify-center rounded-full bg-mint font-display font-extrabold text-teal-dark">
                  {index + 1}
                </span>
                <span className="flex flex-col gap-0.5 text-sm leading-normal">
                  <b className="text-[15px]">{step.title}</b>
                  <span className="text-ink-soft">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
