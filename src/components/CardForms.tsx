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
            Otwórz panel karty
          </Link>
        )}
      </p>
    );
  }
  return null;
}

const INPUT_CLASS = "min-h-12 rounded-xl border border-line px-4 text-base outline-none focus:border-teal";
const PRIMARY_BUTTON_CLASS =
  "min-h-12 cursor-pointer self-start rounded-full bg-teal px-6 font-semibold text-white hover:bg-teal-dark disabled:cursor-wait disabled:opacity-70";
const SECONDARY_BUTTON_CLASS =
  "min-h-11 cursor-pointer self-start rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink hover:bg-paper disabled:cursor-wait disabled:opacity-70";

export function ContactForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Kim jesteś?
        <input name="sender" required placeholder="np. Gmina Kolbuszowa, Jan z firmy X" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Wiadomość do twórców
        <textarea name="body" required rows={4} className="resize-y rounded-xl border border-line p-4 text-base font-normal outline-none focus:border-teal" />
      </label>
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        {isPending ? "Wysyłam…" : "Chcę się skontaktować"}
      </button>
    </form>
  );
}

export function ClaimForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        E-mail z domeny Twojej szkoły, uczelni lub urzędu
        <input name="email" type="email" required placeholder="nauczyciel@szkola.edu.pl" className={INPUT_CLASS} />
      </label>
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        To moje — przejmij kartę
      </button>
    </form>
  );
}

const REPORT_REASONS = [
  { value: "bledne-dane", label: "Błędne dane na karcie" },
  { value: "nie-innowacja", label: "To nie jest innowacja" },
  { value: "duplikat", label: "Duplikat innej karty" },
  { value: "dane-osobowe", label: "Narusza prywatność" },
];

export function ReportForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Co jest nie tak?
        <select name="reason" className={`${INPUT_CLASS} bg-white font-normal`}>
          {REPORT_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </label>
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={SECONDARY_BUTTON_CLASS}>
        Zgłoś błąd
      </button>
    </form>
  );
}

export function EditForm({ action }: { action: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Co poprawić lub dopisać? AI zaktualizuje kartę i oceni ją ponownie.
        <textarea
          name="corrections"
          required
          rows={5}
          placeholder="np. Szkoła: ZS nr 2 w Mielcu. Z programu skorzystało 60 uczniów, średnia ocen wzrosła z 2,8 do 3,4."
          className="resize-y rounded-xl border border-line p-4 text-base font-normal outline-none focus:border-teal"
        />
      </label>
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        {isPending ? "AI ocenia ponownie…" : "Zapisz i oceń ponownie"}
      </button>
    </form>
  );
}
