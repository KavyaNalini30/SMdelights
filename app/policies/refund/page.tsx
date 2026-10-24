import type { Metadata } from "next";
import { Confirm, ContactBlock, PolicyPage } from "@/components/policy/Policy";

export const metadata: Metadata = { title: "Refund & Cancellation Policy", alternates: { canonical: "/policies/refund" } };

export default function RefundPolicy() {
  return (
    <PolicyPage title="Refunds & Cancellation">
      <p>
        Our products are fresh, perishable food made to order, so we can&apos;t accept returns. Here&apos;s how
        cancellations and refunds work.
      </p>

      <h2>Cancelling an order</h2>
      <ul>
        <li><Confirm>You can cancel for a full refund up to 24 hours before your delivery or pickup date</Confirm> — message us on WhatsApp with your order number.</li>
        <li><Confirm>Cancellations within 24 hours of the delivery or pickup date may not be refunded, as your order will already be in preparation.</Confirm></li>
        <li><Confirm>Bulk, wedding and corporate orders follow the terms agreed in your quote, which may include a non-refundable advance.</Confirm></li>
      </ul>

      <h2>If we can&apos;t fulfil your order</h2>
      <p>
        Delivery date, availability and delivery charges are confirmed on WhatsApp. If we&apos;re unable to accept or
        fulfil your order for any reason, we&apos;ll cancel it and refund the full amount you paid.
      </p>

      <h2>Damaged or incorrect items</h2>
      <p>
        <Confirm>If your order arrives damaged, or you received the wrong item, send us a photo on WhatsApp within 2 hours of delivery.</Confirm>{" "}
        <Confirm>We&apos;ll offer a replacement or a full or partial refund, depending on the issue.</Confirm>
      </p>

      <h2>How refunds are paid</h2>
      <ul>
        <li>Refunds for online payments go back to the original payment method (UPI, card or bank account) through our payment partner, Razorpay.</li>
        <li><Confirm>Refunds are processed within 2 working days of approval</Confirm>; your bank may take a further 5–7 working days to show it.</li>
        <li><Confirm>Refunds for cash payments at pickup are made by UPI or bank transfer.</Confirm></li>
      </ul>

      <h2>Not eligible for a refund</h2>
      <ul>
        <li><Confirm>Change of mind after the cancellation window.</Confirm></li>
        <li><Confirm>Products not stored as recommended after delivery.</Confirm></li>
        <li><Confirm>Taste preferences.</Confirm></li>
      </ul>

      <h2>Contact</h2>
      <ContactBlock />
    </PolicyPage>
  );
}
