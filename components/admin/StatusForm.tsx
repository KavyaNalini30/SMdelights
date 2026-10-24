"use client";

import { useActionState } from "react";
import { updateOrderStatus, type AdminState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export function StatusForm({ id, status }: { id: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateOrderStatus, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="status" className="label">Order status</label>
        <select id="status" name="status" defaultValue={status} className="field">
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className="label">Note for the history (optional)</label>
        <input id="note" name="note" className="field" maxLength={500} placeholder="e.g. Sent via Dunzo, tracking …" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Update status"}</Button>
      {state?.ok && <p className="text-sm text-success" role="status">{state.ok}</p>}
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
    </form>
  );
}
