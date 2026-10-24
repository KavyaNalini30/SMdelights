import { NextResponse } from "next/server";
import { z } from "zod";
import { razorpayPayload } from "@/lib/checkout-response";
import { createRazorpayOrder, isDemoMode } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ token: z.uuid() });

/** "Complete payment" for an online order that is still pending (e.g. the customer closed Razorpay). */
export async function POST(request: Request, ctx: RouteContext<"/api/orders/[id]/pay">) {
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (isDemoMode) return NextResponse.json({ error: "Online payments are not enabled" }, { status: 400 });

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, access_token, order_number, total_paise, razorpay_order_id, customer_name, customer_phone, customer_email, status, payment_method")
    .eq("id", id)
    .single();
  if (!order || order.access_token !== parsed.data.token) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "pending" || order.payment_method !== "razorpay") {
    return NextResponse.json({ error: "This order doesn't need payment" }, { status: 409 });
  }

  let razorpayOrderId = order.razorpay_order_id as string | null;
  if (!razorpayOrderId) {
    const rzp = await createRazorpayOrder({
      amountPaise: order.total_paise,
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
    });
    razorpayOrderId = rzp.id;
    await db.from("orders").update({ razorpay_order_id: rzp.id }).eq("id", order.id);
  }
  return NextResponse.json(razorpayPayload({ ...order, razorpay_order_id: razorpayOrderId }));
}
