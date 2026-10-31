"use client";

import { useActionState, useState } from "react";
import { saveZone, type AdminState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { courierFeePaise } from "@/lib/delivery";
import { formatPrice, formatWeight } from "@/lib/format";
import type { DeliveryZone } from "@/lib/types";

const rupees = (paise: number | null) => (paise == null ? "" : String(paise / 100));
const toPaise = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? null : Math.round(Number(s) * 100));

export function ZoneForm({ zone, active }: { zone: DeliveryZone; active: boolean }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveZone, null);
  // Live example so the owner can check the slabs against the courier's rate card.
  const [rates, setRates] = useState({
    base_weight_g: String(zone.base_weight_g),
    base_fee: rupees(zone.base_fee_paise),
    step_weight_g: String(zone.step_weight_g),
    step_fee: rupees(zone.step_fee_paise),
  });
  const preview = {
    base_weight_g: Number(rates.base_weight_g) || 500,
    base_fee_paise: toPaise(rates.base_fee),
    step_weight_g: Number(rates.step_weight_g) || 500,
    step_fee_paise: toPaise(rates.step_fee),
  };
  const id = (k: string) => `${k}-${zone.id}`;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={zone.id} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-2xl">{zone.name}</h3>
        <span className="flex flex-wrap gap-1.5">
          {zone.allows_fast && <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs text-success">Fast delivery (WhatsApp)</span>}
          {zone.base_fee_paise == null && <span className="rounded-full bg-caramel/20 px-2.5 py-0.5 text-xs">Courier rates not set — courier off</span>}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor={id("bw")} className="label">First slab (g)</label>
          <input id={id("bw")} name="base_weight_g" inputMode="numeric" value={rates.base_weight_g} onChange={(e) => setRates({ ...rates, base_weight_g: e.target.value })} className="field" />
        </div>
        <div>
          <label htmlFor={id("bf")} className="label">Price (₹)</label>
          <input id={id("bf")} name="base_fee" inputMode="decimal" placeholder="e.g. 60" value={rates.base_fee} onChange={(e) => setRates({ ...rates, base_fee: e.target.value })} className="field" />
        </div>
        <div>
          <label htmlFor={id("sw")} className="label">Then every (g)</label>
          <input id={id("sw")} name="step_weight_g" inputMode="numeric" value={rates.step_weight_g} onChange={(e) => setRates({ ...rates, step_weight_g: e.target.value })} className="field" />
        </div>
        <div>
          <label htmlFor={id("sf")} className="label">Costs extra (₹)</label>
          <input id={id("sf")} name="step_fee" inputMode="decimal" placeholder="e.g. 30" value={rates.step_fee} onChange={(e) => setRates({ ...rates, step_fee: e.target.value })} className="field" />
        </div>
      </div>
      <p className="text-xs text-muted">
        {preview.base_fee_paise == null
          ? "Leave the price empty to switch courier off for this area (customers can still pick up or WhatsApp you)."
          : `Examples: ${[500, 1200, 2500]
              .map((g) => {
                const fee = courierFeePaise(preview, g);
                return `${formatWeight(g)} = ${fee == null ? "set the extra price" : formatPrice(fee)}`;
              })
              .join(" · ")}`}
      </p>

      <div>
        <label htmlFor={id("desc")} className="label">Shown to customers</label>
        <input id={id("desc")} name="description" defaultValue={zone.description ?? ""} className="field" />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Pincodes covered</summary>
        <div className="mt-2">
          <label htmlFor={id("pre")} className="label">Pincode beginnings, comma separated</label>
          <input id={id("pre")} name="prefixes" defaultValue={zone.pincode_prefixes.join(", ")} className="field" />
          <p className="mt-1 text-xs text-muted">A pincode uses the area with the longest matching beginning — so “600” (Chennai) wins over “60” (Tamil Nadu).</p>
        </div>
      </details>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={active} className="accent-chocolate" /> Deliver to this area
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        {state?.ok && <span className="text-sm text-success">{state.ok}</span>}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
