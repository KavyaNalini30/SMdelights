"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/app/account/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "./AuthCard";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <FormMessage kind="error">{state.error}</FormMessage>}
      {state?.ok && <FormMessage kind="success">Saved.</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="label">Name</label>
          <input id="full_name" name="full_name" defaultValue={name} autoComplete="name" className="field" required />
        </div>
        <div>
          <label htmlFor="phone" className="label">Mobile (WhatsApp)</label>
          <input id="phone" name="phone" defaultValue={phone} type="tel" autoComplete="tel" className="field" required />
        </div>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Saving…" : "Save details"}</Button>
    </form>
  );
}
