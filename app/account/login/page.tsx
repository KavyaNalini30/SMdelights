import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/account/AuthCard";
import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to see your orders and check out faster."
      footer={<>New here? <Link href="/account/signup" className="font-medium text-chocolate underline">Create an account</Link> · You can also check out as a guest.</>}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
