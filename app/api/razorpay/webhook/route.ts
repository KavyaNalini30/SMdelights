import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Razorpay webhook (Dashboard -> Webhooks -> URL: https://<site>/api/razorpay/webhook,
 * events: payment.captured, order.paid, payment.failed).
 * A safety net: if the customer closes the tab before the browser calls /verify,
 * the order is still marked paid here. Safe to receive the same event many times.
 */
type PaymentEntity = { id: string; order_id: string; amount: number; method?: string; status: string };

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload?: { payment?: { entity?: PaymentEntity } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return NextResponse.json({ ok: true, ignored: true });

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, total_paise")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: true, ignored: "unknown order" });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (payment.amount !== order.total_paise) {
      console.error(`Webhook amount mismatch for order ${order.id}: ${payment.amount} vs ${order.total_paise}`);
      await db.from("orders").update({ admin_note: "⚠ Payment amount did not match order total — check Razorpay." }).eq("id", order.id);
      return NextResponse.json({ ok: true, flagged: true });
    }
    await markOrderPaid({
      orderId: order.id,
      amountPaise: payment.amount,
      source: "webhook",
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      method: payment.method,
      raw: event,
    });
  } else if (event.event === "payment.failed") {
    await db.from("payments").upsert(
      {
        order_id: order.id,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount_paise: payment.amount,
        status: "failed",
        method: payment.method ?? null,
        source: "webhook",
        raw: event,
      },
      { onConflict: "razorpay_payment_id", ignoreDuplicates: true },
    );
  }

  return NextResponse.json({ ok: true });
}
