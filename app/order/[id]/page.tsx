import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { CompletePayment } from "@/components/checkout/CompletePayment";
import { buttonClass } from "@/components/ui/Button";
import { CheckIcon, ClockIcon, WhatsAppIcon } from "@/components/ui/icons";
import { site, whatsappLink } from "@/config/site";
import { formatDate, formatPrice } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL, type Order, type OrderItem } from "@/lib/types";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default function OrderPage(props: PageProps<"/order/[id]">) {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-cream" />}>
        <OrderDetails {...props} />
      </Suspense>
    </div>
  );
}

/** Guests open their order with the secret token in the link; signed-in customers can open their own orders. */
async function loadOrder(id: string, token: string | undefined) {
  if (!isSupabaseConfigured || !z.uuid().safeParse(id).success) return null;

  if (token && z.uuid().safeParse(token).success) {
    const db = createAdminClient();
    const { data } = await db.from("orders").select("*, items:order_items(*)").eq("id", id).eq("access_token", token).maybeSingle();
    if (data) return data as Order & { items: OrderItem[] };
  }
  // Signed-in owner (RLS only returns the customer's own orders).
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle();
  return (data as (Order & { items: OrderItem[] }) | null) ?? null;
}

async function OrderDetails({ params, searchParams }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const { t } = await searchParams;
  const order = await loadOrder(id, typeof t === "string" ? t : undefined);

  if (!order) {
    return (
      <div className="text-center">
        <h1 className="text-4xl">Order not found</h1>
        <p className="mt-3 text-muted">Please use the link from your confirmation, or log in to see your orders.</p>
        <Link href="/account/orders" className={buttonClass("secondary", "md", "mt-6")}>My orders</Link>
      </div>
    );
  }

  const awaitingOnlinePayment = order.status === "pending" && order.payment_method === "razorpay";
  const paid = Boolean(order.paid_at);
  const waMessage = `Hi SM Delights! My order number is ${order.order_number}.`;

  return (
    <>
      <div className="text-center">
        <span
          className={`mx-auto grid size-14 place-items-center rounded-full ${awaitingOnlinePayment ? "bg-cream text-caramel" : "bg-success/10 text-success"}`}
          aria-hidden
        >
          {awaitingOnlinePayment ? <ClockIcon width={28} height={28} /> : <CheckIcon width={28} height={28} />}
        </span>
        <p className="eyebrow mt-5">Order {order.order_number}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">
          {awaitingOnlinePayment ? "Almost there — payment pending" : order.status === "cancelled" ? "This order was cancelled" : "Thank you for your order!"}
        </h1>
        {order.is_demo && (
          <p className="mx-auto mt-4 w-fit rounded-full border border-caramel/60 bg-caramel/10 px-4 py-1.5 text-sm font-medium">
            Demo payment — no money was taken
          </p>
        )}
        <p className="mx-auto mt-4 max-w-lg text-muted">
          {awaitingOnlinePayment
            ? "Your order is saved, but we haven't received the payment yet. Complete it below to confirm your order."
            : order.payment_method === "pay_at_pickup" && !paid
              ? "We've received your order. Please pay by cash or UPI when you pick it up. We'll message you on WhatsApp with the pickup location and time."
              : `We'll confirm the ${order.fulfilment === "pickup" ? "pickup location and time" : "delivery"} with you on WhatsApp.`}
        </p>
        {awaitingOnlinePayment && <CompletePayment orderId={order.id} token={order.access_token} />}
      </div>

      <section className="mt-10 rounded-[var(--radius-card)] border border-line bg-paper p-6">
        <div className="flex flex-wrap justify-between gap-3 text-sm">
          <div>
            <p className="text-muted">Status</p>
            <p className="font-medium">{ORDER_STATUS_LABEL[order.status]}</p>
          </div>
          <div>
            <p className="text-muted">{order.fulfilment === "pickup" ? "Pickup" : "Delivery"} date</p>
            <p className="font-medium">{formatDate(order.delivery_date)}</p>
          </div>
          <div>
            <p className="text-muted">Payment</p>
            <p className="font-medium">
              {paid ? (order.is_demo ? "Demo payment" : "Paid online") : order.payment_method === "pay_at_pickup" ? "Pay at pickup" : "Not paid yet"}
            </p>
          </div>
        </div>

        <ul className="mt-6 divide-y divide-line border-t border-line text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-3">
              <span>
                {item.product_name} <span className="text-muted">· {item.variant_label} × {item.quantity}</span>
                {item.note && <span className="block text-xs text-muted">“{item.note}”</span>}
              </span>
              <span className="shrink-0">{formatPrice(item.line_total_paise)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal_paise)}</dd></div>
          <div className="flex justify-between">
            <dt>{order.fulfilment === "pickup" ? "Pickup" : `Delivery${order.zone_name ? ` (${order.zone_name})` : ""}`}</dt>
            <dd>{order.delivery_fee_paise ? formatPrice(order.delivery_fee_paise) : "Free"}</dd>
          </div>
          <div className="flex justify-between font-serif text-2xl"><dt>Total</dt><dd>{formatPrice(order.total_paise)}</dd></div>
        </dl>

        {order.fulfilment === "delivery" && (
          <div className="mt-6 border-t border-line pt-4 text-sm">
            <p className="text-muted">Delivering to</p>
            <p className="mt-1">
              {order.customer_name}, {order.address_line1}
              {order.address_line2 && `, ${order.address_line2}`}
              {order.area && `, ${order.area}`}, {order.city}, {order.state} {order.pincode}
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={whatsappLink(site.whatsappNumbers[0].e164, waMessage)} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg")}>
          <WhatsAppIcon width={20} height={20} /> Message us about this order
        </a>
        <Link href="/shop" className={buttonClass("secondary", "lg")}>Continue shopping</Link>
      </div>
      <p className="mt-4 text-center text-xs text-muted">Bookmark this page to check your order status later.</p>
    </>
  );
}
