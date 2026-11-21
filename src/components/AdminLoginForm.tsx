"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/actions";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdmin, null);
  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3">
      <input
        name="token"
        type="password"
        required
        autoComplete="current-password"
        aria-label="Token administratora"
        placeholder="Token administratora"
        className="min-h-12 rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-primary"
      />
      {state?.error && (
        <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 cursor-pointer self-start rounded-full bg-primary px-6 font-semibold text-white hover:bg-primary-dark disabled:cursor-wait disabled:bg-ink-soft"
      >
        Zaloguj
      </button>
    </form>
  );
}
