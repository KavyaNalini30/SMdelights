"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { FormMessage } from "./AuthCard";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    });
    setBusy(false);
    setSent(true); // Same message whether or not the email exists (doesn't reveal accounts).
  }

  if (sent) {
    return <FormMessage kind="success">If an account exists for {email}, a reset link is on its way. Check your inbox.</FormMessage>;
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/account?updated=password");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input id="password" type="password" autoComplete="new-password" required minLength={8} className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
    </form>
  );
}
