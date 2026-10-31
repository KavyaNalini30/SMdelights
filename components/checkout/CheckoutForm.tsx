"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useCartSync } from "@/components/cart/useCartSync";
import { Button, ButtonLink } from "@/components/ui/Button";
import { site, whatsappLink } from "@/config/site";
import type { CheckoutResponse } from "@/lib/checkout-response";
import { WhatsAppCartChat } from "@/components/cart/WhatsAppCartChat";
import { cartWeightGrams, courierFeePaise, fastDeliveryAllowed, zoneForPincode } from "@/lib/delivery";
import { cn, formatPrice, formatWeight } from "@/lib/format";
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
  minDate,
  maxDate,
}: {
  zones: DeliveryZone[];
  prefill: CheckoutPrefill | null;
  demoMode: boolean;
  /** Earliest and latest delivery dates (YYYY-MM-DD, IST), worked out on the server. */
  minDate: string;
  maxDate: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const removeLine = useCart((s) => s.remove);
  const { chennaiOnly, weights, synced } = useCartSync(hydrated);

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
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<ReactNode>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsAddress = fulfilment !== "pickup";
  const zone = needsAddress ? zoneForPincode(address.pincode, zones) : null;
  const pincodeComplete = /^\d{6}$/.test(address.pincode);
  const subtotal = cartSubtotal(lines);
  // Same weight/rate maths as the server, which recalculates it anyway.
  const weight = cartWeightGrams(lines.map((l) => ({ weightGrams: weights.get(l.variantId), qty: l.qty })));
  const courierFee = fulfilment === "delivery" && zone && synced ? courierFeePaise(zone, weight) : null;
  const fee = fulfilment === "delivery" ? courierFee : 0; // fast delivery: agreed on WhatsApp
  const total = fee == null ? null : subtotal + fee;
  const perishables = fulfilment === "delivery" ? lines.filter((l) => chennaiOnly.has(l.variantId)) : [];

  const deliveryProblem: ReactNode =
    !needsAddress || !pincodeComplete
      ? null
      : !zone
        ? `Sorry, we don't deliver to this pincode yet — we deliver across ${site.delivery.states}. You can choose pickup, or message us on WhatsApp.`
        : fulfilment === "fast_whatsapp"
          ? fastDeliveryAllowed(zone)
            ? null
            : "Fast delivery is only available in Chennai and nearby areas. Please choose courier delivery or pickup."
          : perishables.length
            ? `${perishables.map((l) => l.name).join(", ")} can't travel by courier. Remove ${perishables.length === 1 ? "it" : "them"}, or choose pickup or fast delivery in Chennai.`
            : zone.base_fee_paise == null
              ? `Courier charges for ${zone.name} aren't available online yet — choose pickup, or message us on WhatsApp to arrange delivery.`
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
          address: needsAddress ? address : undefined,
          deliveryDate: fulfilment === "pickup" ? deliveryDate : undefined,
          payment: fulfilment === "pickup" ? payment : "online",
          note,
          saveAddress: prefill?.signedIn ? saveAddress : false,
          whatsappUpdates,
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
      // Fast delivery continues on WhatsApp: the order page opens the chat with the order details.
      router.push(`/order/${result.orderId}?t=${result.token}${fulfilment === "fast_whatsapp" ? "&wa=1" : ""}`);
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
            <Field id="email" label="Email (for your order confirmation)" error={errors.email} className="sm:col-span-2">
              <input id="email" className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} {...field("email")} />
            </Field>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={whatsappUpdates} onChange={(e) => setWhatsappUpdates(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-chocolate" />
              Send my order confirmation and updates on WhatsApp too
            </label>
          </div>
        </Section>

        <Section title="Delivery or pickup">
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Delivery or pickup">
            <Choice
              checked={fulfilment === "pickup"}
              onSelect={() => setFulfilment("pickup")}
              title="Pickup — free"
              text="Kolathur, Chennai. Location shared on WhatsApp."
            />
            <Choice
              checked={fulfilment === "delivery"}
              onSelect={() => setFulfilment("delivery")}
              title="Courier delivery"
              text="TN, Karnataka, Kerala, Andhra & Telangana · 2–3 days"
            />
            <Choice
              checked={fulfilment === "fast_whatsapp"}
              onSelect={() => setFulfilment("fast_whatsapp")}
              title="Fast delivery"
              text="Same day in Chennai & nearby · arranged on WhatsApp"
            />
          </div>

          {needsAddress && (
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
                  {fulfilment === "fast_whatsapp" ? (
                    <>✓ {zone.name} — we&apos;ll confirm the delivery time and charge with you on WhatsApp.</>
                  ) : (
                    <>✓ {zone.name} — courier {courierFee == null ? "…" : courierFee === 0 ? "free" : formatPrice(courierFee)} for {formatWeight(weight)}</>
                  )}
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

          {fulfilment === "pickup" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="deliveryDate" label="Pickup date" error={errors.deliveryDate}>
                <input id="deliveryDate" type="date" className="field" required min={minDate} max={maxDate} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} {...field("deliveryDate")} />
              </Field>
              <p className="self-end pb-3 text-xs text-muted">
                Orders need a day&apos;s notice. We&apos;ll confirm the timing with you on WhatsApp ({site.hours}).
              </p>
            </div>
          )}
          {fulfilment === "delivery" && (
            <p className="mt-5 text-sm text-muted">
              {site.delivery.dispatch}, then {site.delivery.courier.charAt(0).toLowerCase() + site.delivery.courier.slice(1)}. The courier charge depends on the parcel weight and your state.
            </p>
          )}
        </Section>

        {fulfilment === "fast_whatsapp" && (
          <Section title="How fast delivery works">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              <li>Place your order below — no payment now.</li>
              <li>WhatsApp opens with your order details already filled in. Just press send.</li>
              <li>We&apos;ll confirm the delivery time, the delivery charge and how to pay. Same-day delivery is possible in Chennai and nearby areas.</li>
            </ol>
          </Section>
        )}

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
          <div className="flex justify-between gap-3">
            <dt>{fulfilment === "pickup" ? "Pickup" : fulfilment === "fast_whatsapp" ? "Fast delivery" : `Courier (${formatWeight(weight)})`}</dt>
            <dd className="text-right">
              {fulfilment === "pickup" ? "Free" : fulfilment === "fast_whatsapp" ? <span className="text-muted">Confirmed on WhatsApp</span> : fee == null ? <span className="text-muted">Enter pincode</span> : fee === 0 ? "Free" : formatPrice(fee)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-serif text-2xl">
            <dt>Total</dt><dd>{total == null ? "—" : formatPrice(total)}</dd>
          </div>
          {fulfilment === "fast_whatsapp" && <p className="text-xs text-muted">Plus the delivery charge, agreed on WhatsApp.</p>}
        </dl>

        {formError && (
          <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</p>
        )}

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || Boolean(deliveryProblem)}>
          {submitting
            ? "Placing order…"
            : fulfilment === "fast_whatsapp"
              ? "Place order & continue on WhatsApp"
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
        <WhatsAppCartChat lines={lines} subtotal={subtotal} className="mt-5 border-t border-line pt-5" />
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
