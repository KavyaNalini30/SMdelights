"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { phoneSchema } from "@/lib/validation";
import { FormMessage } from "./AuthCard";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phone = phoneSchema.safeParse(form.phone);
    if (form.name.trim().length < 2) return setError("Please enter your name.");
    if (!phone.success) return setError("Please enter a valid 10-digit mobile number.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    const { data, error } = await createClient().auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.name.trim(), phone: phone.data },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message.toLowerCase().includes("already") ? "An account with this email already exists. Try logging in." : error.message);
      return;
    }
    // With email confirmation on (recommended) there's no session yet.
    if (data.session) {
      router.replace("/account");
      router.refresh();
    } else setSentTo(form.email.trim());
  }

  if (sentTo) {
    return (
      <FormMessage kind="success">
        Almost done! We&apos;ve sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your account.
      </FormMessage>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input id="name" autoComplete="name" required className="field" value={form.name} onChange={set("name")} />
      </div>
      <div>
        <label htmlFor="phone" className="label">Mobile number (WhatsApp)</label>
        <input id="phone" type="tel" inputMode="tel" autoComplete="tel" required className="field" value={form.phone} onChange={set("phone")} />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" type="email" autoComplete="email" required className="field" value={form.email} onChange={set("email")} />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" type="password" autoComplete="new-password" required minLength={8} className="field" value={form.password} onChange={set("password")} />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}
