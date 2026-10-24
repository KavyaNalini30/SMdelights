"use client";

import { useActionState, useState } from "react";
import { submitReview, type PublicFormState } from "@/app/actions";
import { FormMessage } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/icons";

export function ReviewForm() {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitReview, null);
  const [rating, setRating] = useState(5);

  if (state?.ok) {
    return <FormMessage kind="success">Thank you for your review! It will appear on the site once we&apos;ve had a look.</FormMessage>;
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <FormMessage kind="error">{state.error}</FormMessage>}
      <fieldset>
        <legend className="label">Your rating</legend>
        <input type="hidden" name="rating" value={rating} />
        <div className="flex gap-1 text-caramel">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n} className="rounded p-0.5">
              <StarIcon filled={n <= rating} width={30} height={30} />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="name" className="label">Your name</label>
        <input id="name" name="name" autoComplete="name" required className="field" />
        {state?.fields?.name && <p className="mt-1 text-sm text-danger">{state.fields.name}</p>}
      </div>
      <div>
        <label htmlFor="body" className="label">Your review</label>
        <textarea id="body" name="body" required maxLength={1000} className="field min-h-28" placeholder="What did you order? How was it?" />
        {state?.fields?.body && <p className="mt-1 text-sm text-danger">{state.fields.body}</p>}
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Sending…" : "Submit review"}</Button>
    </form>
  );
}
