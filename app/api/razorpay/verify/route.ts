import { NextResponse } from "next/server";
import { z } from "zod";
import { markOrderPaid } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  orderId: z.uuid(),
  token: z.uuid(),
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/**
 * Called by the browser right after Razorpay Checkout succeeds.
 * The payment only counts once its signature is verified here with the key secret.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const p = parsed.data;

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, access_token, razorpay_order_id, total_paise")
    .eq("id", p.orderId)
    .single();

  if (!order || order.access_token !== p.token || order.razorpay_order_id !== p.razorpay_order_id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!verifyPaymentSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature)) {
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  }

  await markOrderPaid({
    orderId: order.id,
    amountPaise: order.total_paise,
    source: "verify",
    razorpayOrderId: p.razorpay_order_id,
    razorpayPaymentId: p.razorpay_payment_id,
  });
  return NextResponse.json({ ok: true, orderId: order.id, token: order.access_token });
}
