"use client";

import { useActionState } from "react";
import { submitIdea } from "@/app/actions";

const EXAMPLE_TEXT =
  "W naszej szkole uczniowie z koła ekologicznego zbudowali kompostownik z czujnikiem temperatury, który wysyła powiadomienie, kiedy kompost trzeba przerzucić. Działa od września na resztkach ze stołówki, a kompost trafia do szkolnego ogrodu.";

export function SubmitForm() {
  const [state, formAction, isPending] = useActionState(submitIdea, null);

  return (
    <form action={formAction} className="flex min-w-0 flex-[1_1_420px] flex-col gap-4.5">
      <label htmlFor="text" className="font-display text-xl font-semibold">
        Opisz pomysł własnymi słowami
      </label>
      <textarea
        id="text"
        name="text"
        rows={9}
        required
        minLength={40}
        maxLength={5000}
        placeholder={EXAMPLE_TEXT}
        className="resize-y rounded-2xl border border-line p-4.5 text-base leading-relaxed text-ink outline-none placeholder:text-muted focus:border-teal"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[15px] font-semibold">
          Twój e-mail <span className="font-normal text-ink-soft">(dostaniesz link do edycji, nie publikujemy go)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="min-h-12 rounded-xl border border-line px-4 text-base outline-none focus:border-teal"
        />
      </div>
      <fieldset className="flex flex-col gap-3 text-[15px]">
        <legend className="mb-2 font-semibold">Kto zgłasza?</legend>
        <label className="flex min-h-8 items-center gap-2.5">
          <input type="radio" name="kto" value="ja" defaultChecked className="size-5 accent-teal" />
          To mój pomysł / mojego zespołu
        </label>
        <label className="flex min-h-8 items-center gap-2.5">
          <input type="radio" name="kto" value="ktos-inny" className="size-5 accent-teal" />
          Zgłaszam kogoś innego (twórca przejmie kartę później)
        </label>
      </fieldset>
      <label className="flex items-start gap-2.5 text-sm leading-normal text-ink-soft">
        <input type="checkbox" name="niepelnoletni" className="mt-0.5 size-5 flex-none accent-teal" />
        Mam mniej niż 18 lat — nie publikujemy moich danych, a opiekun dostanie link do zgody.
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-13 cursor-pointer self-start rounded-full bg-teal px-7 font-display text-lg font-semibold text-white hover:bg-teal-dark disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? "AI układa kartę…" : "Ułóż kartę →"}
      </button>
    </form>
  );
}
