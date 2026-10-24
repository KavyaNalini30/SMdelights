"use client";

import type { CheckoutResponse } from "@/lib/checkout-response";

type RazorpayPayload = Extract<CheckoutResponse, { mode: "razorpay" }>;
type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Opens Razorpay Checkout, then verifies the payment on our server. Resolves false if the customer closes it. */
export async function payWithRazorpay(payload: RazorpayPayload): Promise<boolean> {
  await loadScript();
  const success = await new Promise<RazorpaySuccess | null>((resolve) => {
    const rzp = new window.Razorpay!({
      ...payload.razorpay,
      handler: (response: RazorpaySuccess) => resolve(response),
      modal: { ondismiss: () => resolve(null), confirm_close: true },
      retry: { enabled: true, max_count: 3 },
    });
    rzp.open();
  });
  if (!success) return false;

  const res = await fetch("/api/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: payload.orderId, token: payload.token, ...success }),
  });
  if (!res.ok) {
    // The webhook will still confirm a genuine payment; the order page shows its live status.
    console.error("verify failed", await res.text().catch(() => ""));
  }
  return true;
}
