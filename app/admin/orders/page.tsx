import Link from "next/link";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Pill, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { cn, formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";

const FILTERS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: ORDER_STATUS_LABEL.pending },
  { value: "paid", label: ORDER_STATUS_LABEL.paid },
  { value: "preparing", label: ORDER_STATUS_LABEL.preparing },
  { value: "out_for_delivery", label: ORDER_STATUS_LABEL.out_for_delivery },
  { value: "delivered", label: ORDER_STATUS_LABEL.delivered },
  { value: "cancelled", label: ORDER_STATUS_LABEL.cancelled },
];

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : "";

  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, fulfilment, delivery_date, total_paise, status, payment_method, paid_at, is_demo, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all" && FILTERS.some((f) => f.value === status)) query = query.eq("status", status);
  if (date) query = query.eq("delivery_date", date);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`order_number.ilike.%${safe}%,customer_phone.ilike.%${safe}%,customer_name.ilike.%${safe}%`);
  }
  const { data: orders } = await query;

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={60} />
      <form className="flex gap-2" role="search">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Search order no., name or phone" className="field max-w-sm" aria-label="Search orders" />
        <button className="rounded-full bg-chocolate px-5 text-sm text-ivory">Search</button>
      </form>
      <ul className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <li key={f.value}>
            <Link
              href={f.value === "all" ? "/admin/orders" : `/admin/orders?status=${f.value}`}
              className={cn("block rounded-full border px-3 py-1.5 text-sm", status === f.value ? "border-chocolate bg-chocolate text-ivory" : "border-line bg-paper")}
            >
              {f.label}
            </Link>
          </li>
        ))}
      </ul>
      {date && <p className="text-sm">Showing orders due on <strong>{formatDate(date)}</strong> · <Link href="/admin/orders" className="underline">clear</Link></p>}

      {!orders?.length ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">No orders here yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
          {(orders as Order[]).map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="grid gap-1 p-4 hover:bg-cream/50 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {o.order_number} <StatusBadge status={o.status} />
                    {o.is_demo && <Pill tone="warn">Demo</Pill>}
                    {!o.paid_at && o.payment_method === "pay_at_pickup" && <Pill>Pay at pickup</Pill>}
                  </p>
                  <p className="text-sm text-muted">
                    {o.customer_name} · {o.customer_phone} · {o.fulfilment === "pickup" ? "Pickup" : "Delivery"} {formatDate(o.delivery_date)}
                  </p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-medium">{formatPrice(o.total_paise)}</p>
                  <p className="text-muted">{formatDateTime(o.created_at)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
