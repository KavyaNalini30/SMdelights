import type { Metadata } from "next";
import { Confirm, ContactBlock, PolicyPage } from "@/components/policy/Policy";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Shipping & Delivery Policy", alternates: { canonical: "/policies/shipping" } };

export default function ShippingPolicy() {
  return (
    <PolicyPage title="Shipping & Delivery">
      <p>
        Everything at SM Delights is home-made and baked to order. This page explains where we deliver, how long it
        takes and what it costs.
      </p>

      <h2>Where we deliver</h2>
      <p>
        We deliver across <strong>{site.delivery.states}</strong>, including Chennai. There are three ways to get your
        order:
      </p>
      <ul>
        <li><strong>Pickup (free):</strong> from our kitchen in {site.locality}.</li>
        <li><strong>Courier delivery:</strong> by ST Courier to any pincode in the states above, for travel-friendly products (such as brownies, cookies, biscuits, tea cakes and gift boxes).</li>
        <li><strong>Fast delivery (Chennai and nearby areas):</strong> same-day delivery is possible. You place the order on the website and we arrange the delivery time and charge with you on WhatsApp.</li>
      </ul>
      <ul>
        <li><Confirm>Drinks (hot chocolate, boba shakes and sago drinks), London Cake and the brownie + hot chocolate combo don&apos;t travel by courier. They are available for pickup or fast delivery in and around Chennai only.</Confirm></li>
        <li>Mousse cakes and dream cakes are not available for long-distance or inter-district delivery.</li>
      </ul>

      <h2>Order timing</h2>
      <ul>
        <li>Pickup orders need at least <strong>one day&apos;s notice</strong>. You choose the pickup date at checkout and we confirm the time on WhatsApp.</li>
        <li>Courier orders are <strong>{site.delivery.dispatch.toLowerCase()}</strong> of your order.</li>
        <li>Fast delivery depends on availability on the day — we confirm on WhatsApp before you pay.</li>
        <li><Confirm>Orders received after 9:00 PM are treated as received the next day.</Confirm></li>
      </ul>

      <h2>Delivery times</h2>
      <ul>
        <li>Courier: usually <strong>2–3 days after dispatch</strong>; longer during holidays or exceptional courier delays.</li>
        <li>Fast delivery in and around Chennai: same day where possible, at the time agreed on WhatsApp.</li>
      </ul>

      <h2>Delivery charges</h2>
      <ul>
        <li>Courier charges are based on ST Courier&apos;s rates for your state and the packed weight of your order. They are shown at checkout before you pay. There is no separate packaging charge.</li>
        <li>Fast delivery charges depend on the distance and are agreed with you on WhatsApp before you pay.</li>
        <li><Confirm>Pickup from our kitchen in Kolathur, Chennai is free.</Confirm> Bulk and custom orders are quoted separately.</li>
      </ul>

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
