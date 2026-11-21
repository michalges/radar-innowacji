"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import type { ClaimRequestReason } from "@/lib/types";
import { CARD_STATUSES, CARD_STATUS_LABELS, EVIDENCE_MIME_TYPES, MAX_EVIDENCE_FILES, MAX_EVIDENCE_TOTAL_BYTES, type CardStatus } from "@/lib/constants";

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

const INPUT_CLASS = "min-h-12 rounded-xl border border-line bg-white px-4 text-base font-normal outline-none focus:border-primary";
const TEXTAREA_CLASS = "resize-y rounded-xl border border-line bg-white p-4 text-base font-normal outline-none focus:border-primary";
const PRIMARY_BUTTON_CLASS =
  "min-h-12 cursor-pointer self-start rounded-full bg-primary px-6 font-semibold text-white hover:bg-primary-dark disabled:cursor-wait disabled:bg-ink-soft";
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

function getFileSizeLabel(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ClaimReviewForm({ action, email, reason }: { action: BoundAction; email: string; reason: ClaimRequestReason }) {
  const [state, formAction, isPending] = useActionState(action, null);
  if (state?.message) {
    return <FormFeedback state={state} />;
  }
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-line p-4 frosted">
      <h3 className="font-semibold">Poproś o weryfikację przez administratora</h3>
      <p className="text-sm text-ink-soft">Administrator skontaktuje się z Tobą na {email || "podany e-mail"}. Przesłanych plików nie przekazujemy dalej.</p>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="reason" value={reason} />
      <textarea
        name="note"
        required
        minLength={20}
        maxLength={1000}
        rows={3}
        aria-label="Twoja rola w projekcie"
        placeholder="Jaka jest Twoja rola w projekcie i jak możemy to potwierdzić? (np. telefon do sekretariatu, link do strony szkoły)"
        className={TEXTAREA_CLASS}
      />
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={SECONDARY_BUTTON_CLASS}>
        {isPending ? "Wysyłam…" : "Wyślij do administratora"}
      </button>
    </form>
  );
}

export function ClaimForm({ action, reviewAction }: { action: BoundAction; reviewAction: BoundAction }) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  const fileError =
    files.length > MAX_EVIDENCE_FILES
      ? `Maksymalnie ${MAX_EVIDENCE_FILES} pliki.`
      : totalBytes > MAX_EVIDENCE_TOTAL_BYTES
        ? "Pliki razem przekraczają 8 MB."
        : null;

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-label="E-mail z domeny instytucji"
          placeholder="ty@szkola.edu.pl"
          className={INPUT_CLASS}
        />
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-primary/40 bg-white/70 px-4 py-5 text-center transition-colors hover:border-primary focus-within:border-primary">
          <span className="font-semibold text-primary-dark">Dodaj dowód autorstwa</span>
          <span className="text-sm text-ink-soft">Zdjęcie lub PDF: prezentacja, dokumentacja, dyplom, artykuł. Do {MAX_EVIDENCE_FILES} plików, razem 8 MB.</span>
          <input
            name="evidence"
            type="file"
            required
            multiple
            accept={EVIDENCE_MIME_TYPES.join(",")}
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="sr-only"
          />
        </label>
        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-sm">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-muted">{getFileSizeLabel(file.size)}</span>
              </li>
            ))}
          </ul>
        )}
        {fileError && (
          <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
            {fileError}
          </p>
        )}
        <p className="text-xs text-ink-soft">AI porówna materiały z opisem pomysłu. Pliki nie są nigdzie zapisywane: służą tylko do tej jednej weryfikacji.</p>
        <FormFeedback state={state} />
        <button type="submit" disabled={isPending || fileError !== null} className={PRIMARY_BUTTON_CLASS}>
          {isPending ? "AI sprawdza materiały…" : "Zweryfikuj i przejmij"}
        </button>
      </form>
      {state?.reviewReason && <ClaimReviewForm action={reviewAction} email={email} reason={state.reviewReason} />}
    </div>
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

export function FollowUpForm({ action, status }: { action: BoundAction; status: CardStatus }) {
  const [state, formAction, isPending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <select name="status" defaultValue={status} aria-label="Status" className={INPUT_CLASS}>
        {CARD_STATUSES.map((cardStatus) => (
          <option key={cardStatus} value={cardStatus}>
            {CARD_STATUS_LABELS[cardStatus]}
          </option>
        ))}
      </select>
      <input name="note" maxLength={300} aria-label="Notatka" placeholder="Krótka notatka (opcjonalnie)" className={INPUT_CLASS} />
      <FormFeedback state={state} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        Zapisz status
      </button>
    </form>
  );
}
