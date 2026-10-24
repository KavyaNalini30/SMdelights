import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderList, type OrderSummary } from "@/components/account/OrderList";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default function OrdersPage() {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <Link href="/account" className="text-sm text-muted hover:text-chocolate">← My account</Link>
      <h1 className="mt-3 text-5xl">My orders</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-cream" />}>
          <Orders />
        </Suspense>
      </div>
    </div>
  );
}

async function Orders() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, created_at, delivery_date, status, total_paise, fulfilment, is_demo")
    .eq("user_id", auth.user.id) // explicit: RLS lets admins read every order
    .order("created_at", { ascending: false })
    .limit(100);
  return <OrderList orders={(data ?? []) as OrderSummary[]} />;
}
