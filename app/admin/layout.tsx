import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Admin</h1>
        <Link href="/" className="text-sm text-muted underline">View shop</Link>
      </div>
      <Suspense fallback={<div className="h-10" />}>
        <AdminNav />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-cream" />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </div>
    </div>
  );
}

/** Server-side role check (proxy.ts only checks that someone is logged in). */
async function AdminGate({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <p className="text-muted">Connect Supabase first (see SETUP.md).</p>;
  const admin = await getAdmin();
  if (!admin) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-paper p-8 text-center">
        <p className="font-serif text-2xl">You don&apos;t have access to this page</p>
        <p className="mt-2 text-sm text-muted">Admin access is given with supabase/05_make_admin.sql — see SETUP.md.</p>
      </div>
    );
  }
  return <>{children}</>;
}
