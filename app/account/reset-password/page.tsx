import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthCard";
import { ResetPasswordForm } from "@/components/account/PasswordForms";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

// Reached from the reset email via /auth/callback, which signs the customer in first.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password">
      <ResetPasswordForm />
    </AuthCard>
  );
}
