import "server-only";
import { site } from "@/config/site";
import { razorpayKeyId } from "@/lib/razorpay";

/** What the browser needs to open Razorpay Checkout for an order. */
export function razorpayPayload(order: {
  id: string;
  access_token: string;
  order_number: string;
  total_paise: number;
  razorpay_order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
}) {
  return {
    mode: "razorpay" as const,
    orderId: order.id,
    token: order.access_token,
    razorpay: {
      key: razorpayKeyId,
      order_id: order.razorpay_order_id,
      amount: order.total_paise,
      currency: "INR",
      name: site.name,
      description: `Order ${order.order_number}`,
      prefill: {
        name: order.customer_name,
        contact: `+91${order.customer_phone}`,
        email: order.customer_email ?? undefined,
      },
      notes: { order_number: order.order_number },
      theme: { color: "#3b2416" },
    },
  };
}

export type CheckoutResponse =
  | { mode: "done"; orderId: string; token: string }
  | ReturnType<typeof razorpayPayload>;
