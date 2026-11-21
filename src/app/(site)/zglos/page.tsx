import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = { title: "Zgłoś pomysł · Radar Innowacji" };

export default function SubmitPage() {
  return (
    <div className="flex max-w-180 flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[clamp(36px,5vw,60px)] leading-none font-extrabold tracking-tight">
          Masz pomysł? <span className="text-primary">Zgłoś w 2 minuty.</span>
        </h1>
        <p className="text-lg text-ink-soft">Opisz go własnymi słowami — AI zrobi resztę.</p>
      </div>
      <SubmitForm />
    </div>
  );
}
