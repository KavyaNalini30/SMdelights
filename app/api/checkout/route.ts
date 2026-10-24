import { NextResponse } from "next/server";
import { getDeliveryZones } from "@/lib/catalog";
import { razorpayPayload, type CheckoutResponse } from "@/lib/checkout-response";
import { earliestDeliveryDate, latestDeliveryDate, zoneForPincode } from "@/lib/delivery";
import { markOrderPaid } from "@/lib/orders";
import { priceCart } from "@/lib/pricing";
import { createRazorpayOrder, isDemoMode } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema, fieldErrors } from "@/lib/validation";

/*
 * Creates an order. Every amount is recalculated here from database prices —
 * the browser only sends variant ids, quantities and delivery details.
 */
function fail(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail("Online ordering isn't set up yet. Please order on WhatsApp.", 503);
  }
  if (!(await rateLimit("checkout", 10, 600))) {
    return fail("Too many attempts. Please wait a few minutes and try again.", 429);
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail("Please check the highlighted fields.", 400, { fields: fieldErrors(parsed.error) });
  }
  const input = parsed.data;

  if (input.deliveryDate < earliestDeliveryDate() || input.deliveryDate > latestDeliveryDate()) {
    return fail("Please choose a date from tomorrow onwards.", 400, {
      fields: { deliveryDate: "Orders need at least one day's notice" },
    });
  }

  // 1. Price the cart from the database.
  const cart = await priceCart(input.lines);
  if (cart.unavailable.length) {
    return fail("Some items in your cart are no longer available. Please review your cart.", 409, {
      unavailable: cart.unavailable,
    });
  }
  if (!cart.lines.length) return fail("Your cart is empty.");

  // 2. Delivery zone and fee.
  let zone: Awaited<ReturnType<typeof getDeliveryZones>>[number] | null = null;
  let deliveryFeePaise = 0;
  if (input.fulfilment === "delivery") {
    const address = input.address!;
    zone = zoneForPincode(address.pincode, await getDeliveryZones());
    if (!zone) {
      return fail("Sorry, we don't deliver to this pincode yet.", 400, {
        fields: { "address.pincode": "We deliver in Chennai and ship within Tamil Nadu and to Bengaluru" },
      });
    }
    if (zone.fee_paise == null) {
      return fail(
        `Delivery charges for ${zone.name} aren't available online yet. Please choose pickup, or message us on WhatsApp to arrange delivery.`,
      );
    }
    if (!zone.is_local) {
      const localOnly = cart.lines.filter((l) => l.chennaiOnly).map((l) => l.productName);
      if (localOnly.length) {
        return fail(`These items can only be delivered within Chennai: ${localOnly.join(", ")}.`);
      }
    }
    deliveryFeePaise = zone.fee_paise;
  }

  const totalPaise = cart.subtotalPaise + deliveryFeePaise;
  const paymentMethod = input.payment === "pay_at_pickup" ? "pay_at_pickup" : isDemoMode ? "demo" : "razorpay";

  let userId: string | null = null;
  try {
    const { data } = await (await createClient()).auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // Guest checkout.
  }

  // 3. Save the order (service role — customers can't write orders directly).
  const db = createAdminClient();
  const address = input.fulfilment === "delivery" ? input.address! : null;
  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      user_id: userId,
      customer_name: input.name,
      customer_phone: input.phone,
      customer_email: input.email ?? null,
      fulfilment: input.fulfilment,
      address_line1: address?.line1 ?? null,
      address_line2: address?.line2 ?? null,
      area: address?.area ?? null,
      city: address?.city ?? null,
      state: address?.state ?? null,
      pincode: address?.pincode ?? null,
      zone_id: zone?.id ?? null,
      zone_name: zone?.name ?? null,
      delivery_date: input.deliveryDate,
      subtotal_paise: cart.subtotalPaise,
      delivery_fee_paise: deliveryFeePaise,
      total_paise: totalPaise,
      payment_method: paymentMethod,
      is_demo: paymentMethod === "demo",
      customer_note: input.note ?? null,
    })
    .select("id, order_number, access_token, total_paise, customer_name, customer_phone, customer_email")
    .single();
  if (orderError || !order) {
    console.error("order insert failed", orderError);
    return fail("We couldn't place your order. Please try again.", 500);
  }

  const { error: itemsError } = await db.from("order_items").insert(
    cart.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.productName,
      variant_label: l.variantLabel,
      unit_price_paise: l.unitPricePaise,
      quantity: l.qty,
      note: l.note ?? null,
    })),
  );
  if (itemsError) {
    console.error("order items insert failed", itemsError);
    await db.from("orders").delete().eq("id", order.id);
    return fail("We couldn't place your order. Please try again.", 500);
  }
  await db.from("order_status_history").insert({ order_id: order.id, status: "pending", note: "Order placed" });

  if (userId && address && input.saveAddress) {
    const { count } = await db.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", userId);
    await db.from("addresses").insert({
      user_id: userId,
      recipient_name: input.name,
      phone: input.phone,
      ...address,
      is_default: !count,
    });
  }

  // 4. Payment.
  if (paymentMethod === "pay_at_pickup") {
    return NextResponse.json<CheckoutResponse>({ mode: "done", orderId: order.id, token: order.access_token });
  }

  if (paymentMethod === "demo") {
    await markOrderPaid({ orderId: order.id, amountPaise: totalPaise, source: "demo" });
    return NextResponse.json<CheckoutResponse>({ mode: "done", orderId: order.id, token: order.access_token });
  }

  try {
    const rzp = await createRazorpayOrder({
      amountPaise: totalPaise,
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
    });
    await db.from("orders").update({ razorpay_order_id: rzp.id }).eq("id", order.id);
    return NextResponse.json<CheckoutResponse>(razorpayPayload({ ...order, razorpay_order_id: rzp.id }));
  } catch (e) {
    console.error(e);
    await db
      .from("orders")
      .update({ status: "cancelled", admin_note: "Payment could not be started (Razorpay error)" })
      .eq("id", order.id);
    return fail("We couldn't start the payment. Please try again in a moment.", 502);
  }
}
