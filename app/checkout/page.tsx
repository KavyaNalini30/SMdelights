import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm, type CheckoutPrefill } from "@/components/checkout/CheckoutForm";
import { connection } from "next/server";
import { getDeliveryZones } from "@/lib/catalog";
import { earliestDeliveryDate, latestDeliveryDate } from "@/lib/delivery";
import { isDemoMode } from "@/lib/razorpay";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-5xl sm:text-6xl">Checkout</h1>
      <Suspense fallback={<div className="mt-10 h-96 animate-pulse rounded-[var(--radius-card)] bg-cream" />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

async function CheckoutContent() {
  // The delivery date range depends on today's date, so render per request.
  await connection();
  const [zones, prefill] = await Promise.all([getDeliveryZones(), loadPrefill()]);
  return (
    <CheckoutForm
      zones={zones}
      prefill={prefill}
      demoMode={isDemoMode}
      minDate={earliestDeliveryDate()}
      maxDate={latestDeliveryDate()}
    />
  );
}

/** Name, phone, email and default address of a signed-in customer (null for guests). */
async function loadPrefill(): Promise<CheckoutPrefill | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const [{ data: profile }, { data: address }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", data.user.id).single(),
    supabase
      .from("addresses")
      .select("line1, line2, area, city, state, pincode")
      .eq("user_id", data.user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    signedIn: true,
    name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: data.user.email ?? "",
    address: address ?? null,
  };
}
