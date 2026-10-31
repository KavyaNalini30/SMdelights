import "server-only";
import { after } from "next/server";
import { notifyOrderPlaced } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Marks an order as paid. Idempotent: the checkout "verify" call and the Razorpay
 * webhook can both arrive (in any order, even twice) and the order is updated once.
 */
export async function markOrderPaid(params: {
  orderId: string;
  amountPaise: number;
  source: "verify" | "webhook" | "demo" | "admin";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  method?: string;
  raw?: unknown;
}) {
  const db = createAdminClient();

  // Record the payment first; the unique payment id makes repeats a no-op.
  const { error: payError } = await db.from("payments").upsert(
    {
      order_id: params.orderId,
      razorpay_payment_id: params.razorpayPaymentId ?? null,
      razorpay_order_id: params.razorpayOrderId ?? null,
      amount_paise: params.amountPaise,
      status: params.source === "demo" ? "demo" : "captured",
      method: params.method ?? null,
      source: params.source,
      raw: params.raw ?? null,
    },
    { onConflict: "razorpay_payment_id", ignoreDuplicates: true },
  );
  if (payError) throw new Error(`Could not record payment: ${payError.message}`);

  // Only a still-pending order moves to "paid" — never overwrite a later status.
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", params.orderId)
    .eq("status", "pending")
    .select("id");
  if (error) throw new Error(`Could not mark order paid: ${error.message}`);

  if (updated?.length) {
    await db.from("order_status_history").insert({
      order_id: params.orderId,
      status: "paid",
      note: params.source === "demo" ? "Demo payment (no money taken)" : `Payment confirmed via ${params.source}`,
    });
    // Confirmation + owner alert once the money is in, after the response is sent.
    after(() => notifyOrderPlaced(params.orderId));
  }
  return { changed: Boolean(updated?.length) };
}
