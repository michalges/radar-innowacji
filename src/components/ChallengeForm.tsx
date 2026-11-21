"use client";

import { useActionState } from "react";
import { submitChallenge } from "@/app/actions";
import { SECTORS, SECTOR_LABELS } from "@/lib/constants";

const INPUT_CLASS = "min-h-12 rounded-xl border border-line bg-white px-4 text-base font-normal outline-none focus:border-teal";

export function ChallengeForm() {
  const [state, formAction, isPending] = useActionState(submitChallenge, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input name="title" required aria-label="Problem" placeholder="Problem, np. smog przy szkołach" className={INPUT_CLASS} />
      <textarea
        name="description"
        required
        rows={3}
        aria-label="Opis"
        placeholder="Kogo dotyczy, czego szukacie"
        className="resize-y rounded-xl border border-line bg-white p-4 text-base outline-none focus:border-teal"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="organization" required aria-label="Organizacja" placeholder="Organizacja" className={INPUT_CLASS} />
        <select name="sector" aria-label="Sektor" className={INPUT_CLASS} defaultValue="">
          <option value="">Dowolny sektor</option>
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {SECTOR_LABELS[sector]}
            </option>
          ))}
        </select>
      </div>
      <input name="email" type="email" required aria-label="E-mail" placeholder="E-mail (nie publikujemy)" className={INPUT_CLASS} />
      {state?.error && (
        <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 cursor-pointer self-start rounded-full bg-teal px-6 font-semibold text-white hover:bg-teal-dark disabled:bg-ink-soft"
      >
        Pokaż dopasowania →
      </button>
    </form>
  );
}
