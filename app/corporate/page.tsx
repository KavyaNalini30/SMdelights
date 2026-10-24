import type { Metadata } from "next";
import Image from "next/image";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { GiftIcon, HeartIcon, WhatsAppIcon } from "@/components/ui/icons";
import { site, whatsappLink } from "@/config/site";
import { getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Bulk Party & Corporate Orders",
  description: "Bulk, wedding, birthday and corporate gifting orders from SM Delights, Chennai — custom pricing on brownies, cookies and gift boxes.",
  alternates: { canonical: "/corporate" },
};

const FALLBACK_INTERESTS = ["Brownies", "Tea Cakes", "Cookies & Biscuits", "Drinks", "Gift Boxes"];

export default async function CorporatePage() {
  const categories = await getCategories();
  const interests = categories.length ? categories.filter((c) => !c.is_enquiry_only).map((c) => c.name) : FALLBACK_INTERESTS;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-ivory">
        <Image src="/images/bg/dusted-brownies.webp" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/70 to-ink/30" />
        <div className="container-page animate-rise py-20 sm:py-28">
          <p className="eyebrow !text-caramel-soft">Bulk · Weddings · Birthdays · Corporate</p>
          <h1 className="mt-4 max-w-2xl text-5xl text-ivory sm:text-6xl">Treats for every guest on your list</h1>
          <p className="mt-5 max-w-xl text-lg text-ivory/80">
            Bulk party, wedding, birthday and corporate gifting orders at custom pricing. Tell us what you&apos;re planning
            and we&apos;ll put together a quote.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8">
          <h2 className="text-3xl">Send us an enquiry</h2>
          <p className="mt-1 text-sm text-muted">We usually reply on WhatsApp during business hours ({site.hours}).</p>
          <div className="mt-6">
            <EnquiryForm interests={interests} />
          </div>
        </section>
        <aside className="space-y-5 text-sm">
          <div className="rounded-[var(--radius-card)] bg-cream p-5">
            <GiftIcon className="text-caramel" />
            <p className="mt-2 font-serif text-xl">Gift boxes & hampers</p>
            <p className="mt-1 text-muted">Family boxes, brownie boxes and cookie tins — customisable with your choice of flavours.</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-cream p-5">
            <HeartIcon className="text-caramel" />
            <p className="mt-2 font-serif text-xl">Custom pricing</p>
            <p className="mt-1 text-muted">Pricing for bulk orders depends on quantity and items. Packaging and delivery charges are extra.</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-line p-5">
            <p className="font-medium">Prefer to talk?</p>
            {site.whatsappNumbers.map((n) => (
              <a key={n.e164} href={whatsappLink(n.e164, "Hi SM Delights! I'd like to discuss a bulk order.")} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 underline">
                <WhatsAppIcon width={18} height={18} className="text-[#1f8f4c]" /> {n.display}
              </a>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
