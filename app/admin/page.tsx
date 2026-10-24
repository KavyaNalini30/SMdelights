import Link from "next/link";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Card } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { daysAgoISO, formatPrice, todayIST } from "@/lib/format";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const today = todayIST();

  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const [toPrepare, pending, dueToday, newEnquiries, pendingReviews, zonesWithoutFee, recentPaid] = await Promise.all([
    count(supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "preparing"])),
    count(supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("orders").select("id", { count: "exact", head: true }).eq("delivery_date", today).neq("status", "cancelled")),
    count(supabase.from("corporate_enquiries").select("id", { count: "exact", head: true }).eq("status", "new")),
    count(supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false)),
    count(supabase.from("delivery_zones").select("id", { count: "exact", head: true }).is("fee_paise", null).eq("is_active", true)),
    supabase.from("orders").select("total_paise").not("paid_at", "is", null).eq("is_demo", false).gte("created_at", daysAgoISO(30)),
  ]);
  const revenue30 = (recentPaid.data ?? []).reduce((s, o) => s + o.total_paise, 0);

  const tiles = [
    { label: "To prepare (paid / preparing)", value: toPrepare, href: "/admin/orders?status=paid" },
    { label: "Due today", value: dueToday, href: `/admin/orders?date=${today}` },
    { label: "Awaiting payment", value: pending, href: "/admin/orders?status=pending" },
    { label: "New enquiries", value: newEnquiries, href: "/admin/enquiries" },
    { label: "Reviews to approve", value: pendingReviews, href: "/admin/reviews" },
    { label: "Paid sales, last 30 days", value: formatPrice(revenue30), href: "/admin/orders" },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={60} />
      {zonesWithoutFee > 0 && (
        <Card className="border-caramel/60 bg-caramel/10">
          <p className="font-medium">Set your delivery fees</p>
          <p className="mt-1 text-sm text-muted">
            {zonesWithoutFee} delivery area{zonesWithoutFee > 1 ? "s don't" : " doesn't"} have a fee yet, so customers there can only choose pickup.{" "}
            <Link href="/admin/delivery-zones" className="underline">Set fees</Link>
          </p>
        </Card>
      )}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="block rounded-[var(--radius-card)] border border-line bg-paper p-5 transition-shadow hover:shadow-soft">
              <p className="font-serif text-4xl">{t.value}</p>
              <p className="mt-1 text-sm text-muted">{t.label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
