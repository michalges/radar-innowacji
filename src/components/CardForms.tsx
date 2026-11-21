"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

type BoundAction = (state: FormState, formData: FormData) => Promise<FormState>;

function FormFeedback({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
        {state.error}
      </p>
    );
  }
  if (state?.message) {
    return (
      <p role="status" className="rounded-xl bg-green-soft px-4 py-3 text-sm text-green">
        {state.message}{" "}
        {state.link && (
          <Link href={state.link} className="font-semibold">
            Otwórz panel
          </Link>
        )}
      </p>
    );
  }
  return null;
}

const INPUT_CLASS = "min-h-12 rounded-xl border border-line bg-white px-4 text-base font-normal outline-none focus:border-teal";
const TEXTAREA_CLASS = "resize-y rounded-xl border border-line bg-white p-4 text-base font-normal outline-none focus:border-teal";
const PRIMARY_BUTTON_CLASS =
  "min-h-12 cursor-pointer self-start rounded-full bg-teal px-6 font-semibold text-white hover:bg-teal-dark disabled:cursor-wait disabled:bg-ink-soft";
const SECONDARY_BUTTON_CLASS =
  "min-h-11 cursor-pointer self-start rounded-full bg-paper px-5 text-sm font-semibold text-ink hover:bg-line-soft disabled:cursor-wait";

export function ContactForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input name="sender" required aria-label="Kim jesteś" placeholder="Kim jesteś? (np. Gmina X)" className={INPUT_CLASS} />
      <textarea name="body" required rows={3} aria-label="Wiadomość" placeholder="Wiadomość do twórców" className={TEXTAREA_CLASS} />
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        Wyślij
      </button>
    </form>
  );
}

export function ClaimForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input name="email" type="email" required aria-label="E-mail z domeny instytucji" placeholder="ty@szkola.edu.pl" className={INPUT_CLASS} />
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        To moje
      </button>
    </form>
  );
}

const REPORT_REASONS = [
  { value: "bledne-dane", label: "Błędne dane" },
  { value: "nie-innowacja", label: "To nie innowacja" },
  { value: "duplikat", label: "Duplikat" },
  { value: "dane-osobowe", label: "Narusza prywatność" },
];

export function ReportForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <select name="reason" aria-label="Powód zgłoszenia" className={INPUT_CLASS}>
        {REPORT_REASONS.map((reason) => (
          <option key={reason.value} value={reason.value}>
            {reason.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={isPending} className={SECONDARY_BUTTON_CLASS}>
        Zgłoś błąd
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

export function EditForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <textarea
        name="corrections"
        required
        rows={4}
        aria-label="Poprawki"
        placeholder="Co poprawić lub dopisać?"
        className={TEXTAREA_CLASS}
      />
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        {isPending ? "AI ocenia…" : "Zapisz"}
      </button>
    </form>
  );
}
