"use client";

import { useActionState } from "react";
import { submitEnquiry, type PublicFormState } from "@/app/actions";
import { FormMessage } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/Button";

export function EnquiryForm({ interests }: { interests: string[] }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitEnquiry, null);
  const err = (k: string) => state?.fields?.[k];

  if (state?.ok) {
    return (
      <FormMessage kind="success">
        Thank you! We&apos;ve received your enquiry and will get back to you on WhatsApp soon.
      </FormMessage>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.error && <FormMessage kind="error">{state.error}</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Your name" error={err("name")}>
          <input id="name" name="name" autoComplete="name" required className="field" aria-invalid={!!err("name") || undefined} />
        </Field>
        <Field id="phone" label="Mobile (WhatsApp)" error={err("phone")}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" required className="field" aria-invalid={!!err("phone") || undefined} />
        </Field>
        <Field id="company" label="Company / organisation (optional)">
          <input id="company" name="company" autoComplete="organization" className="field" />
        </Field>
        <Field id="email" label="Email (optional)" error={err("email")}>
          <input id="email" name="email" type="email" autoComplete="email" className="field" />
        </Field>
        <Field id="eventDate" label="Event date (optional)" error={err("eventDate")}>
          <input id="eventDate" name="eventDate" type="date" className="field" />
        </Field>
        <Field id="quantity" label="Approximate quantity (optional)">
          <input id="quantity" name="quantity" className="field" placeholder="e.g. 150 boxes / 300 brownies" />
        </Field>
      </div>
      <fieldset>
        <legend className="label">Interested in</legend>
        <div className="flex flex-wrap gap-2">
          {interests.map((item) => (
            <label key={item} className="cursor-pointer rounded-full border border-line bg-paper px-4 py-2 text-sm has-[:checked]:border-chocolate has-[:checked]:bg-chocolate has-[:checked]:text-ivory">
              <input type="checkbox" name="items" value={item} className="sr-only" /> {item}
            </label>
          ))}
        </div>
      </fieldset>
      <Field id="message" label="Tell us about your event (optional)">
        <textarea id="message" name="message" maxLength={2000} className="field min-h-28" placeholder="Occasion, budget per box, branding or custom packaging…" />
      </Field>
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Sending…" : "Send enquiry"}</Button>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
