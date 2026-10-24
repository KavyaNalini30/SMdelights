import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteAddress, signOut } from "./actions";
import { FormMessage } from "@/components/account/AuthCard";
import { OrderList, type OrderSummary } from "@/components/account/OrderList";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage(props: PageProps<"/account">) {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-cream" />}>
        <AccountContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function AccountContent({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  if (!isSupabaseConfigured) return <p className="text-muted">Accounts aren&apos;t set up yet.</p>;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/account/login");
  const { updated } = await searchParams;

  const [{ data: profile }, { data: addresses }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, role").eq("id", data.user.id).single(),
    supabase.from("addresses").select("id, label, line1, line2, area, city, state, pincode, is_default").eq("user_id", data.user.id).order("created_at"),
    supabase
      .from("orders")
      .select("id, order_number, created_at, delivery_date, status, total_paise, fulfilment, is_demo")
      .eq("user_id", data.user.id) // explicit: RLS lets admins read every order
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 text-5xl">Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-sm text-muted">{data.user.email}</p>
        </div>
        <div className="flex gap-2">
          {profile?.role === "admin" && (
            <Link href="/admin" className="inline-flex h-11 items-center rounded-full bg-caramel px-5 text-sm font-medium text-ivory">Admin panel</Link>
          )}
          <form action={signOut}>
            <Button variant="ghost" type="submit">Log out</Button>
          </form>
        </div>
      </div>
      {updated === "password" && <div className="mt-6"><FormMessage kind="success">Your password has been updated.</FormMessage></div>}

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-3xl">Recent orders</h2>
          {(orders?.length ?? 0) > 0 && <Link href="/account/orders" className="text-sm underline">All orders</Link>}
        </div>
        <OrderList orders={(orders ?? []) as OrderSummary[]} />
      </section>

      <section className="mt-12 rounded-[var(--radius-card)] border border-line bg-paper p-6">
        <h2 className="mb-4 text-3xl">Your details</h2>
        <ProfileForm name={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
      </section>

      <section className="mt-8 rounded-[var(--radius-card)] border border-line bg-paper p-6">
        <h2 className="text-3xl">Saved addresses</h2>
        {addresses?.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 rounded-2xl border border-line p-4 text-sm">
                <p>
                  {a.is_default && <span className="mb-1 block text-xs uppercase tracking-wider text-caramel">Default</span>}
                  {a.line1}{a.line2 && `, ${a.line2}`}{a.area && `, ${a.area}`}<br />
                  {a.city}, {a.state} {a.pincode}
                </p>
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-muted underline hover:text-danger">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Addresses you save at checkout appear here.</p>
        )}
      </section>
    </>
  );
}
