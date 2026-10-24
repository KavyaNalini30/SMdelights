import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/account/AuthCard";
import { SignupForm } from "@/components/account/SignupForm";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create an account"
      subtitle="Save your address and see your order history."
      footer={<>Already have an account? <Link href="/account/login" className="font-medium text-chocolate underline">Log in</Link></>}
    >
      <SignupForm />
    </AuthCard>
  );
}
