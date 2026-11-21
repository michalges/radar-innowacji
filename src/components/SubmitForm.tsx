"use client";

import { useActionState } from "react";
import { submitIdea } from "@/app/actions";

const EXAMPLE_TEXT =
  "Np. uczniowie z koła ekologicznego zbudowali kompostownik z czujnikiem temperatury. Działa od września na resztkach ze stołówki.";

export function SubmitForm() {
  const [state, formAction, isPending] = useActionState(submitIdea, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label htmlFor="text" className="sr-only">
        Opis pomysłu
      </label>
      <textarea
        id="text"
        name="text"
        rows={8}
        required
        minLength={40}
        maxLength={5000}
        placeholder={EXAMPLE_TEXT}
        className="resize-y rounded-2xl border border-line p-4.5 text-base leading-relaxed text-ink outline-none placeholder:text-muted focus:border-teal"
      />
      <label className="flex flex-col gap-1.5 text-[15px] font-semibold">
        E-mail <span className="text-sm font-normal text-ink-soft">dostaniesz link do edycji</span>
        <input name="email" type="email" required autoComplete="email" className="min-h-12 rounded-xl border border-line px-4 text-base font-normal outline-none focus:border-teal" />
      </label>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-[15px]">
        <label className="flex min-h-8 items-center gap-2.5">
          <input type="radio" name="kto" value="ja" defaultChecked className="size-5 accent-teal" />
          Mój pomysł
        </label>
        <label className="flex min-h-8 items-center gap-2.5">
          <input type="radio" name="kto" value="ktos-inny" className="size-5 accent-teal" />
          Zgłaszam kogoś innego
        </label>
        <label className="flex min-h-8 items-center gap-2.5">
          <input type="checkbox" name="niepelnoletni" className="size-5 accent-teal" />
          Mam mniej niż 18 lat
        </label>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-13 cursor-pointer self-start rounded-full bg-teal px-7 font-display text-lg font-semibold text-white hover:bg-teal-dark disabled:cursor-wait disabled:bg-ink-soft"
      >
        {isPending ? "AI analizuje…" : "Wyślij →"}
      </button>
    </form>
  );
}
