import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/account/AuthCard";
import { ForgotPasswordForm } from "@/components/account/PasswordForms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to set a new one."
      footer={<Link href="/account/login" className="underline">Back to log in</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
