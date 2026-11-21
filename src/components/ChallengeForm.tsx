"use client";

import { useActionState } from "react";
import { submitChallenge } from "@/app/actions";
import { SECTORS, SECTOR_LABELS } from "@/lib/constants";

const INPUT_CLASS = "min-h-12 rounded-xl border border-line px-4 text-base font-normal outline-none focus:border-teal";

export function ChallengeForm() {
  const [state, formAction, isPending] = useActionState(submitChallenge, null);
  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Jaki problem chcecie rozwiązać?
        <input name="title" required placeholder="np. Smog przy szkołach" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Opis
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Kogo dotyczy, co już próbowaliście, czego szukacie."
          className="resize-y rounded-xl border border-line p-4 text-base font-normal outline-none focus:border-teal"
        />
      </label>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Organizacja
          <input name="organization" required placeholder="Gmina, firma, szkoła" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Sektor
          <select name="sector" className={`${INPUT_CLASS} bg-white`} defaultValue="">
            <option value="">Dowolny</option>
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {SECTOR_LABELS[sector]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        E-mail do cotygodniowych dopasowań <span className="font-normal text-ink-soft">(nie publikujemy go)</span>
        <input name="email" type="email" required className={INPUT_CLASS} />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 cursor-pointer self-start rounded-full bg-teal px-6 font-semibold text-white hover:bg-teal-dark disabled:opacity-70"
      >
        Dodaj wyzwanie i pokaż dopasowania →
      </button>
    </form>
  );
}
