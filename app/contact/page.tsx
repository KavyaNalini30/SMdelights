import type { Metadata } from "next";
import Link from "next/link";
import { AskTheBaker } from "@/components/contact/AskTheBaker";
import { ClockIcon, InstagramIcon, TruckIcon } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/Button";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions or orders? Chat with us on WhatsApp. Open daily ${site.hours}. ${site.locality}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">Questions? Just ask the baker.</h1>
      <p className="mt-4 max-w-xl text-muted">
        Flavours, availability, a custom box or pickup timing — type your question and send it to us on WhatsApp.
      </p>

      <div className="mt-10 max-w-xl">
        <AskTheBaker />
        <p className="mt-4 text-sm text-muted">
          Planning a party, wedding or corporate order?{" "}
          <Link href="/corporate" className="underline">Send a bulk enquiry →</Link>
        </p>
      </div>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="flex gap-3">
          <ClockIcon className="mt-1 shrink-0 text-caramel" />
          <div><dt className="font-medium">Business hours</dt><dd className="text-muted">Every day, {site.hours}</dd></div>
        </div>
        <div className="flex gap-3">
          <TruckIcon className="mt-1 shrink-0 text-caramel" />
          <div>
            <dt className="font-medium">Pickup & delivery</dt>
            <dd className="text-muted">
              We&apos;re based in {site.locality}. Pickup location and timing are shared on WhatsApp once your order is
              confirmed. <Link href="/policies/shipping" className="underline">Delivery details</Link>
            </dd>
          </div>
        </div>
        {site.instagramUrl && (
          <div className="flex gap-3">
            <InstagramIcon className="mt-1 shrink-0 text-caramel" />
            <div><dt className="font-medium">Instagram</dt><dd><a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline">Follow us</a></dd></div>
          </div>
        )}
        {site.email && (
          <div className="flex gap-3">
            <span className="mt-1 shrink-0 text-caramel" aria-hidden>@</span>
            <div><dt className="font-medium">Email</dt><dd><a href={`mailto:${site.email}`} className="underline">{site.email}</a></dd></div>
          </div>
        )}
      </dl>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/shop" className={buttonClass("primary", "lg")}>Order online</Link>
        <Link href="/corporate" className={buttonClass("secondary", "lg")}>Bulk & corporate enquiry</Link>
      </div>
    </div>
  );
}
