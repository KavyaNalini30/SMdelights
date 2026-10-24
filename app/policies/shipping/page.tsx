import type { Metadata } from "next";
import { Confirm, ContactBlock, PolicyPage } from "@/components/policy/Policy";

export const metadata: Metadata = { title: "Shipping & Delivery Policy", alternates: { canonical: "/policies/shipping" } };

export default function ShippingPolicy() {
  return (
    <PolicyPage title="Shipping & Delivery">
      <p>
        Everything at SM Delights is home-made and baked to order. This page explains where we deliver, how long it
        takes and what it costs.
      </p>

      <h2>Where we deliver</h2>
      <ul>
        <li><strong>Chennai:</strong> delivery to all areas of Chennai.</li>
        <li><strong>Tamil Nadu and Bengaluru:</strong> shipping is available for travel-friendly products (such as brownies, cookies, biscuits, tea cakes and assorted gift boxes), subject to packaging and courier suitability.</li>
        <li>Mousse cakes and dream cakes are not available for long-distance or inter-district delivery.</li>
        <li><Confirm>Drinks (hot chocolate, boba shakes and sago drinks) are available in Chennai only.</Confirm></li>
      </ul>

      <h2>Order timing</h2>
      <ul>
        <li>Orders must be placed at least <strong>one day in advance</strong> for next-day delivery, subject to availability.</li>
        <li>You choose your preferred delivery or pickup date at checkout. The delivery date and timing are confirmed with you on WhatsApp.</li>
        <li><Confirm>Orders received after 9:00 PM are treated as received the next day.</Confirm></li>
      </ul>

      <h2>Delivery times</h2>
      <ul>
        <li>Chennai: on the confirmed delivery date.</li>
        <li>Tamil Nadu and Bengaluru: standard shipping takes 1–2 working days after dispatch; during holidays or exceptional delays, 2–3 working days.</li>
      </ul>

      <h2>Delivery charges</h2>
      <p>
        Delivery charges are based on the delivery partner or courier fee for your area and are shown at checkout
        before you pay. <Confirm>Pickup from our kitchen in Kolathur, Chennai is free.</Confirm> Packaging charges for
        bulk and custom orders are quoted separately.
      </p>

      <h2>Pickup</h2>
      <p>
        If you choose pickup, we&apos;ll share the pickup location and time on WhatsApp after your order is confirmed. We
        don&apos;t display a public address. Pickup orders can be paid online, or by cash or UPI at pickup.
      </p>

      <h2>When you receive your order</h2>
      <ul>
        <li>Please check your order on delivery and store it as described on the product page (room temperature or refrigerated).</li>
        <li><Confirm>If anything arrives damaged, send us a photo on WhatsApp within 2 hours of delivery so we can make it right.</Confirm></li>
        <li><Confirm>We are not responsible for delays caused by an incorrect address, or by the recipient being unavailable at the time of delivery.</Confirm></li>
      </ul>

      <h2>Questions</h2>
      <ContactBlock />
    </PolicyPage>
  );
}
