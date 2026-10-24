import Link from "next/link";
import { markPaidInPerson, saveOrderNote } from "@/app/admin/actions";
import { StatusForm } from "@/components/admin/StatusForm";
import { Card, Pill, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/config/site";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, type Order, type OrderItem, type OrderStatus } from "@/lib/types";

export default async function AdminOrder({ params }: PageProps<"/admin/orders/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*), history:order_status_history(status, note, created_at), payments(status, method, source, amount_paise, razorpay_payment_id, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return <p>Order not found. <Link href="/admin/orders" className="underline">Back to orders</Link></p>;

  const order = data as Order & {
    items: OrderItem[];
    history: { status: OrderStatus; note: string | null; created_at: string }[];
    payments: { status: string; method: string | null; source: string; amount_paise: number; razorpay_payment_id: string | null; created_at: string }[];
  };
  const phone = `91${order.customer_phone}`;
  const waText = `Hi ${order.customer_name.split(" ")[0]}! This is SM Delights about your order ${order.order_number}.`;

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="text-sm text-muted">← All orders</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl">{order.order_number}</h2>
        <StatusBadge status={order.status} />
        {order.is_demo && <Pill tone="warn">Demo payment — no money taken</Pill>}
      </div>
      {order.admin_note?.startsWith("⚠") && <Card className="border-danger/40 bg-danger/5 text-sm">{order.admin_note}</Card>}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card>
            <h3 className="font-serif text-2xl">Items</h3>
            <ul className="mt-3 divide-y divide-line text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2.5">
                  <span>
                    <strong className="font-medium">{i.quantity} ×</strong> {i.product_name} <span className="text-muted">({i.variant_label})</span>
                    {i.note && <span className="mt-0.5 block rounded bg-caramel/10 px-2 py-1 text-xs">Note: {i.note}</span>}
                  </span>
                  <span>{formatPrice(i.line_total_paise)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal_paise)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{formatPrice(order.delivery_fee_paise)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.total_paise)}</dd></div>
            </dl>
            {order.customer_note && <p className="mt-4 rounded-xl bg-cream p-3 text-sm"><strong>Customer note:</strong> {order.customer_note}</p>}
          </Card>

          <Card>
            <h3 className="font-serif text-2xl">{order.fulfilment === "pickup" ? "Pickup" : "Delivery"}</h3>
            <p className="mt-2 text-sm">
              <strong>{formatDate(order.delivery_date)}</strong>
              {order.fulfilment === "delivery" && (
                <>
                  <br />
                  {order.address_line1}{order.address_line2 && `, ${order.address_line2}`}{order.area && `, ${order.area}`}
                  <br />
                  {order.city}, {order.state} {order.pincode} · {order.zone_name}
                </>
              )}
            </p>
          </Card>

          <Card>
            <h3 className="font-serif text-2xl">History</h3>
            <ol className="mt-3 space-y-2 text-sm">
              {order.history
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
                .map((h, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-32 shrink-0 text-muted">{formatDateTime(h.created_at)}</span>
                    <span><strong className="font-medium">{ORDER_STATUS_LABEL[h.status]}</strong>{h.note && ` — ${h.note}`}</span>
                  </li>
                ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="font-serif text-2xl">Customer</h3>
            <p className="mt-2 text-sm">
              {order.customer_name}<br />
              <a href={`tel:+${phone}`} className="underline">+91 {order.customer_phone}</a>
              {order.customer_email && <><br /><a href={`mailto:${order.customer_email}`} className="underline">{order.customer_email}</a></>}
            </p>
            <a
              href={whatsappLink(phone, waText)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1f8f4c] px-4 py-2 text-sm text-white"
            >
              <WhatsAppIcon width={18} height={18} /> WhatsApp customer
            </a>
          </Card>

          <Card>
            <StatusForm id={order.id} status={order.status} />
          </Card>

          <Card>
            <h3 className="font-serif text-xl">Payment</h3>
            <p className="mt-1 text-sm">
              {order.paid_at ? `Paid ${formatDateTime(order.paid_at)}` : "Not paid"} ·{" "}
              {order.payment_method === "pay_at_pickup" ? "Pay at pickup" : order.payment_method === "demo" ? "Demo" : "Razorpay"}
            </p>
            {order.payments.map((p, i) => (
              <p key={i} className="mt-1 text-xs text-muted">
                {p.status} · {p.method ?? p.source} · {formatPrice(p.amount_paise)} {p.razorpay_payment_id && `· ${p.razorpay_payment_id}`}
              </p>
            ))}
            {!order.paid_at && order.payment_method === "pay_at_pickup" && (
              <form action={markPaidInPerson} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={order.id} />
                <Button type="submit" name="method" value="cash" size="sm" variant="secondary">Paid in cash</Button>
                <Button type="submit" name="method" value="upi" size="sm" variant="secondary">Paid by UPI</Button>
              </form>
            )}
          </Card>

          <Card>
            <form action={saveOrderNote} className="space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <label htmlFor="admin_note" className="label">Private note (only admins see this)</label>
              <textarea id="admin_note" name="admin_note" defaultValue={order.admin_note ?? ""} className="field min-h-20 text-sm" />
              <Button type="submit" size="sm" variant="secondary">Save note</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
