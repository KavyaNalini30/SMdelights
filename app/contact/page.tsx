import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon, InstagramIcon, TruckIcon, WhatsAppIcon } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/Button";
import { site, whatsappLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions or orders? Chat with us on WhatsApp. Open daily ${site.hours}. ${site.locality}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">We&apos;d love to hear from you</h1>
      <p className="mt-4 max-w-xl text-muted">
        The quickest way to reach us is WhatsApp — for orders, custom requests, pickup details or anything else.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[site.whatsapp].map((n) => (
          <a
            key={n.e164}
            href={whatsappLink(n.e164, "Hi SM Delights!")}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-soft transition-shadow hover:shadow-lift"
          >
            <span className="grid size-12 place-items-center rounded-full bg-[#1f8f4c] text-white"><WhatsAppIcon /></span>
            <span>
              <span className="block text-xs uppercase tracking-[0.18em] text-muted">Orders & questions</span>
              <span className="font-serif text-3xl">Chat with us on WhatsApp</span>
            </span>
          </a>
        ))}
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
