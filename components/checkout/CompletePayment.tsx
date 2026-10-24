"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { payWithRazorpay } from "@/lib/razorpay-client";

/** Re-opens Razorpay for an order whose payment wasn't completed. */
export function CompletePayment({ orderId, token }: { orderId: string; token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start the payment.");
      if (await payWithRazorpay(data)) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <Button size="lg" onClick={pay} disabled={busy}>
        {busy ? "Opening payment…" : "Complete payment"}
      </Button>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
