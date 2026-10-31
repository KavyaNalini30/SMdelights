import Image from "next/image";
import Link from "next/link";
import { site, whatsappLink } from "@/config/site";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";

const shop = [
  { href: "/shop/brownies", label: "Brownies" },
  { href: "/shop/tea-cakes", label: "Tea Cakes" },
  { href: "/shop/cookies-biscuits", label: "Cookies & Biscuits" },
  { href: "/shop/drinks", label: "Drinks" },
  { href: "/shop/gift-boxes", label: "Gift Boxes" },
  { href: "/corporate", label: "Bulk & Corporate Orders" },
];

const help = [
  { href: "/contact", label: "Contact us" },
  { href: "/account", label: "My account" },
  { href: "/policies/shipping", label: "Shipping & Delivery" },
  { href: "/policies/refund", label: "Refunds & Cancellation" },
  { href: "/policies/terms", label: "Terms & Conditions" },
  { href: "/policies/privacy", label: "Privacy Policy" },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ivory/85">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="inline-block rounded-2xl bg-ivory p-2">
            <Image src="/images/brand/logo.webp" alt={site.name} width={120} height={120} className="size-24" />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/70">
            Home-made brownies, tea cakes and treats from {site.locality}.
          </p>
        </div>

        <FooterList title="Shop" links={shop} />
        <FooterList title="Help" links={help} />

        <div>
          <h2 className="eyebrow !text-caramel-soft">Order on WhatsApp</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={whatsappLink(undefined, "Hi SM Delights!")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-ivory"
              >
                <WhatsAppIcon width={18} height={18} /> Chat with us on WhatsApp
              </a>
            </li>
            <li className="text-ivory/60">Open daily {site.hours}</li>
            {site.instagramUrl && (
              <li>
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-ivory"
                >
                  <InstagramIcon width={18} height={18} /> Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <p className="container-page py-5 text-xs text-ivory/50">
          © {site.name}. Made with love in Chennai.
        </p>
      </div>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow !text-caramel-soft">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
