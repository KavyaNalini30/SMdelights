"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useCartSync } from "@/components/cart/useCartSync";
import { Button, ButtonLink } from "@/components/ui/Button";
import { site, whatsappLink } from "@/config/site";
import type { CheckoutResponse } from "@/lib/checkout-response";
import { earliestDeliveryDate, latestDeliveryDate, zoneForPincode } from "@/lib/delivery";
import { cn, formatPrice } from "@/lib/format";
import { payWithRazorpay } from "@/lib/razorpay-client";
import type { DeliveryZone, Fulfilment } from "@/lib/types";
import { cartSubtotal, useCart, useHydrated } from "@/store/cart";

export type CheckoutPrefill = {
  signedIn: boolean;
  name: string;
  phone: string;
  email: string;
  address: { line1: string; line2: string | null; area: string | null; city: string; state: string; pincode: string } | null;
};

type Errors = Record<string, string>;

export function CheckoutForm({
  zones,
  prefill,
  demoMode,
}: {
  zones: DeliveryZone[];
  prefill: CheckoutPrefill | null;
  demoMode: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const removeLine = useCart((s) => s.remove);
  const { chennaiOnly } = useCartSync(hydrated);

  const [name, setName] = useState(prefill?.name ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [address, setAddress] = useState({
    line1: prefill?.address?.line1 ?? "",
    line2: prefill?.address?.line2 ?? "",
    area: prefill?.address?.area ?? "",
    city: prefill?.address?.city ?? "Chennai",
    state: prefill?.address?.state ?? "Tamil Nadu",
    pincode: prefill?.address?.pincode ?? "",
  });
  const [saveAddress, setSaveAddress] = useState(!prefill?.address);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [payment, setPayment] = useState<"online" | "pay_at_pickup">("online");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<ReactNode>(null);
  const [submitting, setSubmitting] = useState(false);

  const minDate = useMemo(() => earliestDeliveryDate(), []);
  const maxDate = useMemo(() => latestDeliveryDate(), []);

  const zone = fulfilment === "delivery" ? zoneForPincode(address.pincode, zones) : null;
  const pincodeComplete = /^\d{6}$/.test(address.pincode);
  const subtotal = cartSubtotal(lines);
  const fee = fulfilment === "pickup" ? 0 : zone?.fee_paise ?? null;
  const total = fee == null ? null : subtotal + fee;
  const blockedItems =
    fulfilment === "delivery" && zone && !zone.is_local ? lines.filter((l) => chennaiOnly.has(l.variantId)) : [];

  const deliveryProblem: ReactNode =
    fulfilment !== "delivery" || !pincodeComplete
      ? null
      : !zone
        ? "Sorry, we don't deliver to this pincode yet. You can choose pickup, or message us on WhatsApp."
        : zone.fee_paise == null
          ? `Delivery to ${zone.name} can't be booked online yet — choose pickup, or message us on WhatsApp to arrange delivery.`
          : blockedItems.length
            ? `${blockedItems.map((l) => l.name).join(", ")} can only be delivered within Chennai. Please remove ${blockedItems.length === 1 ? "it" : "them"} or choose pickup.`
            : null;

  if (!hydrated) return <div className="mt-10 h-96 animate-pulse rounded-[var(--radius-card)] bg-cream" />;
  if (!lines.length) {
    return (
      <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-line bg-paper/60 px-6 py-16 text-center">
        <p className="font-serif text-2xl">Your cart is empty</p>
        <ButtonLink href="/shop" className="mt-6">Browse the menu</ButtonLink>
      </div>
    );
  }

  // Error keys match the server's field paths ("address.pincode"); input ids drop the "address." prefix.
  const field = (key: string) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key.replace("address.", "")}-error` : undefined,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErrors({});
    setFormError(null);
    if (deliveryProblem) {
      setFormError(deliveryProblem);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ variantId: l.variantId, qty: l.qty, note: l.note })),
          name,
          phone,
          email,
          fulfilment,
          address: fulfilment === "delivery" ? address : undefined,
          deliveryDate,
          payment: fulfilment === "pickup" ? payment : "online",
          note,
          saveAddress: prefill?.signedIn ? saveAddress : false,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data.fields ?? {});
        if (Array.isArray(data.unavailable)) data.unavailable.forEach((id: string) => removeLine(id));
        setFormError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const result = data as CheckoutResponse;
      if (result.mode === "razorpay") {
        try {
          await payWithRazorpay(result);
        } catch (err) {
          console.error(err);
        }
      }
      // Paid, pending (closed Razorpay) or pay-at-pickup: the order page shows the live status
      // and offers "Complete payment" if needed. The order exists, so the cart is done.
      clearCart();
      router.push(`/order/${result.orderId}?t=${result.token}`);
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="space-y-8">
        {demoMode && (
          <p className="rounded-xl border border-caramel/50 bg-caramel/10 px-4 py-3 text-sm">
            <strong>Demo mode:</strong> payments are simulated — no money will be taken.
          </p>
        )}

        <Section title="Your details" hint={prefill?.signedIn ? undefined : <>Have an account? <Link href="/account/login?next=/checkout" className="underline">Log in</Link></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" error={errors.name}>
              <input id="name" className="field" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} {...field("name")} />
            </Field>
            <Field id="phone" label="Mobile number (WhatsApp)" error={errors.phone}>
              <input id="phone" className="field" type="tel" inputMode="tel" autoComplete="tel" required placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} {...field("phone")} />
            </Field>
            <Field id="email" label="Email (optional)" error={errors.email} className="sm:col-span-2">
              <input id="email" className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...field("email")} />
            </Field>
          </div>
        </Section>

        <Section title="Delivery or pickup">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery or pickup">
            <Choice checked={fulfilment === "delivery"} onSelect={() => setFulfilment("delivery")} title="Delivery" text="Chennai, Tamil Nadu & Bengaluru" />
            <Choice
              checked={fulfilment === "pickup"}
              onSelect={() => setFulfilment("pickup")}
              title="Pickup — free"
              text="Kolathur, Chennai. Location shared on WhatsApp."
            />
          </div>

          {fulfilment === "delivery" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="line1" label="House / flat no., street" error={errors["address.line1"]} className="sm:col-span-2">
                <input id="line1" className="field" autoComplete="address-line1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} {...field("address.line1")} />
              </Field>
              <Field id="line2" label="Landmark (optional)" error={errors["address.line2"]} className="sm:col-span-2">
                <input id="line2" className="field" autoComplete="address-line2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
              </Field>
              <Field id="area" label="Area (optional)">
                <input id="area" className="field" value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })} />
              </Field>
              <Field id="pincode" label="Pincode" error={errors["address.pincode"]}>
                <input id="pincode" className="field" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })} {...field("address.pincode")} />
              </Field>
              <Field id="city" label="City" error={errors["address.city"]}>
                <input id="city" className="field" autoComplete="address-level2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} {...field("address.city")} />
              </Field>
              <Field id="state" label="State" error={errors["address.state"]}>
                <input id="state" className="field" autoComplete="address-level1" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} {...field("address.state")} />
              </Field>
              {pincodeComplete && zone && !deliveryProblem && (
                <p className="text-sm text-success sm:col-span-2">
                  ✓ {zone.name} — delivery {zone.fee_paise === 0 ? "free" : formatPrice(zone.fee_paise!)}
                </p>
              )}
              {deliveryProblem && (
                <p className="rounded-xl bg-cream px-4 py-3 text-sm sm:col-span-2" role="status">
                  {deliveryProblem}{" "}
                  <a className="underline" href={whatsappLink(undefined, "Hi! I'd like to arrange delivery for an order.")} target="_blank" rel="noopener noreferrer">
                    WhatsApp us
                  </a>
                </p>
              )}
              {prefill?.signedIn && (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-4 accent-chocolate" />
                  Save this address to my account
                </label>
              )}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="deliveryDate" label={fulfilment === "delivery" ? "Delivery date" : "Pickup date"} error={errors.deliveryDate}>
              <input id="deliveryDate" type="date" className="field" required min={minDate} max={maxDate} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} {...field("deliveryDate")} />
            </Field>
            <p className="self-end pb-3 text-xs text-muted">
              Orders need a day&apos;s notice. We&apos;ll confirm the timing with you on WhatsApp ({site.hours}).
            </p>
          </div>
        </Section>

        {fulfilment === "pickup" && (
          <Section title="Payment">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment">
              <Choice checked={payment === "online"} onSelect={() => setPayment("online")} title="Pay online now" text="UPI, cards or netbanking" />
              <Choice checked={payment === "pay_at_pickup"} onSelect={() => setPayment("pay_at_pickup")} title="Pay at pickup" text="Cash or UPI when you collect" />
            </div>
          </Section>
        )}

        <Section title="Anything else?">
          <label htmlFor="note" className="sr-only">Order note</label>
          <textarea id="note" className="field min-h-24" maxLength={500} placeholder="Occasion, message on the box, preferred time…" value={note} onChange={(e) => setNote(e.target.value)} />
        </Section>

        {/* Honeypot: hidden from people, bots fill it in. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
          <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
        </div>
      </div>

      <aside className="rounded-[var(--radius-card)] border border-line bg-paper p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl">Order summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span className="min-w-0">
                {l.name} <span className="text-muted">· {l.variantLabel} × {l.qty}</span>
                {l.note && <span className="block text-xs text-muted">“{l.note}”</span>}
              </span>
              <span className="shrink-0">{formatPrice(l.unitPrice * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt>{fulfilment === "pickup" ? "Pickup" : "Delivery"}</dt>
            <dd>{fulfilment === "pickup" ? "Free" : fee == null ? <span className="text-muted">Enter pincode</span> : fee === 0 ? "Free" : formatPrice(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-serif text-2xl">
            <dt>Total</dt><dd>{total == null ? "—" : formatPrice(total)}</dd>
          </div>
        </dl>

        {formError && (
          <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</p>
        )}

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || Boolean(deliveryProblem)}>
          {submitting
            ? "Placing order…"
            : fulfilment === "pickup" && payment === "pay_at_pickup"
              ? "Place order"
              : total == null
                ? "Pay now"
                : `Pay ${formatPrice(total)}${demoMode ? " (demo)" : ""}`}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          By placing an order you agree to our <Link href="/policies/terms" className="underline">terms</Link> and{" "}
          <Link href="/policies/refund" className="underline">refund policy</Link>.
        </p>
      </aside>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-paper p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-2xl">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

function Choice({ checked, onSelect, title, text }: { checked: boolean; onSelect: () => void; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        checked ? "border-chocolate bg-chocolate/[0.04] ring-1 ring-chocolate" : "border-line hover:border-chocolate/50",
      )}
    >
      <span className="flex items-center gap-2 font-medium">
        <span className={cn("grid size-4 place-items-center rounded-full border", checked ? "border-chocolate" : "border-muted")}>
          {checked && <span className="size-2 rounded-full bg-chocolate" />}
        </span>
        {title}
      </span>
      <span className="mt-1 block pl-6 text-sm text-muted">{text}</span>
    </button>
  );
}
