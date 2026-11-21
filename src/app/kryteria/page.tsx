import type { Metadata } from "next";
import { PANEL_CLASS } from "@/components/CardDetails";
import {
  CRITERIA,
  CRITERION_LABELS,
  CRITERION_QUESTIONS,
  PUBLISH_CONFIDENCE,
  REPORTS_TO_UNCONFIRM,
  UNCONFIRMED_CONFIDENCE,
} from "@/lib/constants";

export const metadata: Metadata = { title: "Jak oceniamy · Radar Innowacji" };

const PIPELINE_STEPS = [
  ["Filtr", "Mały model odrzuca spam i treści nie na temat."],
  ["Czy to innowacja?", `≥ ${PUBLISH_CONFIDENCE * 100}% pewności — publikujemy; ${UNCONFIRMED_CONFIDENCE * 100}–${PUBLISH_CONFIDENCE * 100}% — jako „niepotwierdzone”.`],
  ["Opis", "AI wypełnia stałe pola z cytatami ze źródła."],
  ["Ocena", "8 kryteriów, skala 1–5, z uzasadnieniem."],
  ["Ścieżka", "Jawne reguły poniżej."],
  ["Kontrola", `${REPORTS_TO_UNCONFIRM} zgłoszenia błędu cofają pomysł do weryfikacji.`],
];

const PATH_RULES = [
  ["Technologiczna + IP ≥ 4 + TRL ≥ 6", "Komercjalizacja: licencja lub spin-off"],
  ["Technologiczna + IP ≥ 4 + TRL < 6", "Walidacja w laboratorium PCI + ochrona IP"],
  ["Nietechnologiczna + replikowalność ≥ 4", "Transfer do podobnych instytucji"],
  ["Twórcy 16–30 + gotowość ≤ 4", "Laboratorium PCI → akcelerator"],
  ["Wysoki koszt (niski koszt ≤ 2)", "Finansowanie grantowe"],
  ["Pozostałe", "Mentoring i walidacja potrzeby"],
];

const LIMITATIONS = [
  ["Źródła", "RSS Politechniki Łódzkiej (na żywo) i zgłoszenia twórców."],
  ["Założenie", "Opis źródła jest prawdziwy; twórca może go poprawić."],
  ["Halucynacje", "Każdy cytat AI jest sprawdzany w tekście źródła."],
  ["Podobieństwo", "Liczone tylko z tekstu, bez obrazów i danych zewnętrznych."],
  ["Model", "Mały model — oceny są wstępne, nie ekspertyzą."],
  ["Język", "Działa tylko po polsku."],
  ["Dane", "Część pomysłów to dane demonstracyjne."],
];

export default function CriteriaPage() {
  return (
    <>
      <h1 className="font-display text-[clamp(34px,4.5vw,54px)] leading-none font-extrabold tracking-tight">
        Jak <span className="text-teal">oceniamy</span>
      </h1>
      <div className="flex flex-wrap items-start gap-6">
        <section className={`${PANEL_CLASS} flex-[3_1_420px]`}>
          <h2 className="font-display text-xl font-semibold">Proces</h2>
          <ol className="flex flex-col gap-3">
            {PIPELINE_STEPS.map(([title, text], index) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-7 flex-none items-center justify-center rounded-full bg-mint text-sm font-bold text-teal-dark">{index + 1}</span>
                <span className="flex flex-col gap-0.5 text-[15px] leading-normal">
                  <b>{title}</b>
                  <span className="text-ink-soft">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className={`${PANEL_CLASS} flex-[2_1_340px]`}>
          <h2 className="font-display text-xl font-semibold">Kryteria</h2>
          <dl className="flex flex-col gap-2.5 text-[15px]">
            {CRITERIA.map((criterion) => (
              <div key={criterion}>
                <dt className="font-semibold">{CRITERION_LABELS[criterion]}</dt>
                <dd className="text-sm text-ink-soft">{CRITERION_QUESTIONS[criterion]}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <section className={PANEL_CLASS}>
        <h2 className="font-display text-xl font-semibold">Ścieżki</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-left text-[15px]">
            <thead className="text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="py-2 pr-4 font-semibold">Warunek</th>
                <th className="py-2 font-semibold">Ścieżka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {PATH_RULES.map(([condition, path]) => (
                <tr key={condition}>
                  <td className="py-2.5 pr-4">{condition}</td>
                  <td className="py-2.5 font-semibold">{path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={PANEL_CLASS}>
        <h2 className="font-display text-xl font-semibold">Jak to działa / ograniczenia</h2>
        <ul className="flex flex-col gap-1.5 text-[15px]">
          {LIMITATIONS.map(([title, text]) => (
            <li key={title}>
              <b>{title}:</b> <span className="text-ink-soft">{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
