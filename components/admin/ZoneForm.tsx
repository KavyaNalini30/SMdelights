"use client";

import { useActionState } from "react";
import { saveZone, type AdminState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import type { DeliveryZone } from "@/lib/types";

export function ZoneForm({ zone, active }: { zone: DeliveryZone; active: boolean }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveZone, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={zone.id} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-2xl">{zone.name}</h3>
        {zone.fee_paise == null && <span className="rounded-full bg-caramel/20 px-2.5 py-0.5 text-xs">Fee not set — pickup only</span>}
      </div>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor={`fee-${zone.id}`} className="label">Delivery fee (₹)</label>
          <input id={`fee-${zone.id}`} name="fee" inputMode="decimal" defaultValue={zone.fee_paise == null ? "" : String(zone.fee_paise / 100)} placeholder="e.g. 60" className="field" />
          <p className="mt-1 text-xs text-muted">0 = free. Empty = not available online.</p>
        </div>
        <div>
          <label htmlFor={`desc-${zone.id}`} className="label">Shown to customers</label>
          <input id={`desc-${zone.id}`} name="description" defaultValue={zone.description ?? ""} className="field" />
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Pincodes covered</summary>
        <div className="mt-2">
          <label htmlFor={`pre-${zone.id}`} className="label">Pincode beginnings, comma separated</label>
          <input id={`pre-${zone.id}`} name="prefixes" defaultValue={zone.pincode_prefixes.join(", ")} className="field" />
          <p className="mt-1 text-xs text-muted">A pincode uses the zone with the longest matching beginning — so “600” (Chennai) wins over “60” (rest of Tamil Nadu).</p>
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
