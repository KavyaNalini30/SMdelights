import type { Metadata } from "next";
import Link from "next/link";
import { Confirm, ContactBlock, PolicyPage } from "@/components/policy/Policy";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/policies/terms" } };

export default function Terms() {
  return (
    <PolicyPage title="Terms & Conditions">
      <p>
        These terms apply when you browse or order from the {site.name} website. By placing an order you agree to them.
        {" "}<Confirm>{site.name} is run by [legal name of the owner / business], {site.locality}.</Confirm>
      </p>

      <h2>Our products</h2>
      <ul>
        <li>All products are home-made and baked to order. Photos are for illustration — handmade items may vary slightly in look, size and decoration.</li>
        <li>
          <Confirm>Our products may contain or come into contact with gluten (wheat), dairy, eggs, nuts (including pistachios, almonds and walnuts) and soy.</Confirm>{" "}
          If you have an allergy, please message us before ordering.
        </li>
        <li>Shelf life and storage guidance is shown on each product page. Please follow it for the best taste and food safety.</li>
        <li><Confirm>FSSAI registration no.: [to be added].</Confirm></li>
      </ul>

      <h2>Orders</h2>
      <ul>
        <li>Orders must be placed at least one day in advance. Delivery date, availability and delivery charges are confirmed on WhatsApp before your order is accepted.</li>
        <li>An order is confirmed once payment is received, or for pay-at-pickup orders, once we confirm it with you on WhatsApp.</li>
        <li>We may decline or cancel an order (for example if an item is unavailable or we can&apos;t deliver to your address). If you&apos;ve paid, you&apos;ll receive a full refund.</li>
        <li>Bulk, wedding, birthday and corporate orders are priced individually; packaging and delivery charges are extra.</li>
      </ul>

      <h2>Prices and payment</h2>
      <ul>
        <li>Prices are in Indian Rupees (₹). <Confirm>Prices are inclusive of all applicable taxes.</Confirm></li>
        <li>Delivery charges are shown at checkout before you pay.</li>
        <li>Online payments (UPI, cards, netbanking) are processed securely by Razorpay. We never see or store your card details. Cash on delivery is available for pickup orders only.</li>
        <li>If a price shown on the website is wrong because of an error, we&apos;ll contact you before preparing the order.</li>
      </ul>

      <h2>Delivery, cancellations and refunds</h2>
      <p>
        See our <Link href="/policies/shipping" className="underline">Shipping &amp; Delivery</Link> and{" "}
        <Link href="/policies/refund" className="underline">Refund &amp; Cancellation</Link> policies.
      </p>

      <h2>Your account</h2>
      <p>
        You can check out as a guest or create an account. Keep your password private; you&apos;re responsible for
        orders placed from your account.
      </p>

      <h2>Use of the website</h2>
      <p>
        Content on this website — including text, photos and the {site.name} name and logo — belongs to {site.name} and
        may not be copied without permission. Reviews you submit may be shown on the website after we approve them.
      </p>

      <h2>Liability</h2>
      <p>
        <Confirm>Our liability for any order is limited to the amount you paid for it.</Confirm> Nothing in these terms
        limits your rights under Indian consumer protection law.
      </p>

      <h2>Governing law</h2>
      <p><Confirm>These terms are governed by the laws of India, and the courts of Chennai, Tamil Nadu have jurisdiction.</Confirm></p>

      <h2>Contact</h2>
      <ContactBlock />
    </PolicyPage>
  );
}
