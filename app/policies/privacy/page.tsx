import type { Metadata } from "next";
import { Confirm, ContactBlock, PolicyPage } from "@/components/policy/Policy";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/policies/privacy" } };

export default function Privacy() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>
        This policy explains what personal information {site.name} collects through this website, why, and how we look
        after it, in line with India&apos;s Digital Personal Data Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Order details:</strong> your name, mobile number, email (optional), delivery address, delivery date and what you ordered.</li>
        <li><strong>Account details:</strong> if you create an account — your name, mobile number, email, saved addresses and a securely hashed password.</li>
        <li><strong>Enquiries and reviews:</strong> what you send us through the bulk-order or review forms.</li>
        <li><strong>Payment:</strong> online payments are handled by Razorpay. We receive the payment status and reference, but never your card, UPI PIN or bank login details.</li>
        <li><strong>Technical data:</strong> your IP address is used briefly to prevent spam and abuse.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To prepare, deliver and confirm your order — including contacting you on WhatsApp or by phone.</li>
        <li>To respond to enquiries and show approved reviews.</li>
        <li>To keep records required by law (for example, for tax and accounting).</li>
      </ul>
      <p>We don&apos;t sell your information, and we don&apos;t send marketing messages unless you ask us to.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Delivery partners and couriers</strong> — your name, phone and address, only to deliver your order.</li>
        <li><strong>Razorpay</strong> — to process payments.</li>
        <li><strong>Our service providers</strong> — Supabase (secure database and login) and Vercel (website hosting), which store data on our behalf.</li>
        <li>Authorities, if required by law.</li>
      </ul>

      <h2>Cookies and storage</h2>
      <p>
        We use only essential cookies: one that keeps you logged in, and your browser&apos;s local storage to remember your
        cart. We don&apos;t use advertising or tracking cookies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        <Confirm>Order records are kept for 8 years for tax and accounting purposes.</Confirm> You can ask us to delete
        your account at any time; enquiries and unused data are deleted when no longer needed.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete your personal information, or withdraw consent, by contacting us. You
        can update your name, phone and saved addresses yourself from <strong>My account</strong>.
      </p>

      <h2>Contact / grievance officer</h2>
      <p><Confirm>Grievance officer: [owner&apos;s name], {site.email || "[email address]"}</Confirm></p>
      <ContactBlock />
    </PolicyPage>
  );
}
