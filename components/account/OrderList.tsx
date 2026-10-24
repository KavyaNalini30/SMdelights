import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export type OrderSummary = {
  id: string;
  order_number: string;
  created_at: string;
  delivery_date: string;
  status: OrderStatus;
  total_paise: number;
  fulfilment: "delivery" | "pickup";
  is_demo: boolean;
};

export function OrderList({ orders }: { orders: OrderSummary[] }) {
  if (!orders.length) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
        No orders yet. <Link href="/shop" className="underline">Start shopping</Link>
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/order/${o.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-cream/50">
            <div>
              <p className="font-medium">
                {o.order_number}
                {o.is_demo && <span className="ml-2 rounded-full bg-caramel/15 px-2 py-0.5 text-xs">Demo</span>}
              </p>
              <p className="text-sm text-muted">
                Placed {formatDate(o.created_at)} · {o.fulfilment === "pickup" ? "Pickup" : "Delivery"} {formatDate(o.delivery_date)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatPrice(o.total_paise)}</p>
              <p className="text-sm text-muted">{ORDER_STATUS_LABEL[o.status]}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
