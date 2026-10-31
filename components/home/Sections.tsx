import Image from "next/image";
import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { ArrowRightIcon, InstagramIcon, StarIcon, TruckIcon, ClockIcon, WhatsAppIcon } from "@/components/ui/icons";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { Reveal } from "@/components/motion/Reveal";
import { site, whatsappLink } from "@/config/site";
import type { Category, Product, Review } from "@/lib/types";

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: { href: string; label: string } }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-4xl sm:text-5xl">{title}</h2>
      </div>
      {action && (
        <Link href={action.href} className="hidden shrink-0 items-center gap-1.5 text-sm font-medium hover:text-cocoa sm:inline-flex">
          {action.label} <ArrowRightIcon width={16} height={16} />
        </Link>
      )}
    </div>
  );
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-page py-16 sm:py-20">
      <SectionHeading eyebrow="Explore" title="What are you craving?" />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal as="li" key={c.id} delay={(i % 3) * 0.06}>
            <Link
              href={c.is_enquiry_only ? "/corporate" : `/shop/${c.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-paper shadow-soft transition-shadow duration-300 hover:shadow-lift"
            >
              <ProductImage
                src={c.image}
                alt=""
                sizes="(min-width: 1024px) 24rem, 50vw"
                imageClassName="transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="flex flex-1 items-end justify-between gap-2 border-t border-line/60 p-4 sm:p-5">
                <h3 className="font-serif text-xl leading-tight sm:text-2xl">{c.name}</h3>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs uppercase tracking-[0.18em] text-caramel">
                  {c.is_enquiry_only ? "Enquire" : "Shop"} <ArrowRightIcon width={14} height={14} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function Bestsellers({ products }: { products: Product[] }) {
  if (!products.length) return null;
  const anyMarked = products.some((p) => p.is_bestseller);
  return (
    <section className="container-page py-4 sm:py-8">
      <SectionHeading
        eyebrow={anyMarked ? "Customer favourites" : "Signature"}
        title={anyMarked ? "Bestsellers" : "Signature brownies"}
        action={{ href: "/shop", label: "See the full menu" }}
      />
      <Reveal>
        <ProductGrid products={products} />
      </Reveal>
      <div className="mt-6 sm:hidden">
        <ButtonLink href="/shop" variant="secondary" className="w-full">
          See the full menu
        </ButtonLink>
      </div>
    </section>
  );
}

function ImageBand({
  image,
  eyebrow,
  title,
  text,
  children,
  align = "left",
}: {
  image: string;
  eyebrow: string;
  title: string;
  text: string;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <section className="container-page py-16 sm:py-20">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-ink text-ivory shadow-lift">
        <Image src={image} alt="" fill sizes="(min-width: 1152px) 72rem, 100vw" className="object-cover opacity-55" />
        <div
          className={`absolute inset-0 from-ink via-ink/75 to-ink/10 max-sm:bg-linear-to-t ${align === "left" ? "sm:bg-linear-to-r" : "sm:bg-linear-to-l"}`}
        />
        <div className={`relative flex min-h-[26rem] flex-col justify-end p-7 sm:p-12 ${align === "right" ? "sm:items-end sm:text-right" : ""}`}>
          <p className="eyebrow !text-caramel-soft">{eyebrow}</p>
          <h2 className="mt-3 max-w-lg text-4xl text-ivory sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-ivory/80">{text}</p>
          <div className="mt-7 flex flex-wrap gap-3">{children}</div>
        </div>
      </Reveal>
    </section>
  );
}

export function GiftingBand() {
  return (
    <ImageBand
      image="/images/bg/wooden-box-cake.webp"
      eyebrow="Gifting"
      title="Boxes made for sharing"
      text="Family boxes, brownie duos and trios, and cookie boxes you can customise with your favourite flavours."
    >
      <ButtonLink href="/shop/gift-boxes" variant="light" size="lg">
        Shop gift boxes
      </ButtonLink>
    </ImageBand>
  );
}

export function CorporateBand() {
  return (
    <ImageBand
      image="/images/bg/dusted-brownies.webp"
      eyebrow="Bulk · Weddings · Birthdays · Corporate"
      title="Planning something bigger?"
      text="We take bulk party, wedding, birthday and corporate gifting orders at custom pricing. Tell us what you need and we'll get back to you."
      align="right"
    >
      <ButtonLink href="/corporate" variant="light" size="lg">
        Send an enquiry
      </ButtonLink>
    </ImageBand>
  );
}

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="reviews-title">
      <div className="mb-7">
        <p className="eyebrow">Kind words</p>
        <h2 id="reviews-title" className="mt-2 text-4xl sm:text-5xl">From our customers</h2>
      </div>
      {reviews.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal as="li" key={r.id} delay={(i % 3) * 0.06}>
              <figure className="flex h-full flex-col rounded-[var(--radius-card)] border border-line/70 bg-paper p-6 shadow-soft">
                <div className="flex gap-0.5 text-caramel" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, n) => (
                    <StarIcon key={n} filled={n < r.rating} width={18} height={18} />
                  ))}
                </div>
                {r.image_url && (
                  <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-cream">
                    <Image src={r.image_url} alt={`Review from ${r.customer_name}`} fill sizes="(min-width: 1024px) 22rem, 90vw" className="object-contain" />
                  </div>
                )}
                <blockquote className="mt-4 flex-1 font-serif text-xl leading-snug">“{r.body}”</blockquote>
                <figcaption className="mt-4 text-sm text-muted">
                  — {r.customer_name}
                  {r.source && <span className="text-muted/70"> · via {r.source}</span>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
          <div className="mx-auto flex w-fit gap-1 text-caramel/60" aria-hidden>
            {Array.from({ length: 5 }, (_, n) => <StarIcon key={n} width={22} height={22} />)}
          </div>
          <p className="mt-4 font-serif text-2xl">Reviews are on their way</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Tried our bakes? We&apos;d love to hear from you.
          </p>
          <Link href="/reviews/new" className={buttonClass("secondary", "md", "mt-6")}>
            Leave a review
          </Link>
        </div>
      )}
    </section>
  );
}

const DELIVERY_OPTIONS = [
  { name: "Pickup — free", description: `From our kitchen in ${site.locality}. Location and time shared on WhatsApp.` },
  { name: "Courier delivery", description: `Across ${site.delivery.states}. ${site.delivery.dispatch}, then 2–3 days by ST Courier. Charge based on parcel weight.` },
  { name: "Fast delivery in and around Chennai", description: site.delivery.fast },
];

export function DeliveryInfo() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="grid gap-10 rounded-[2rem] border border-line bg-paper/70 p-7 sm:p-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow">Delivery & pickup</p>
          <h2 className="mt-2 text-4xl sm:text-5xl">Fresh to your door</h2>
          <p className="mt-4 text-muted">
            Everything is baked to order. Drinks, London Cake and the combo don&apos;t travel by courier — pick them up, or
            choose fast delivery in Chennai.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <ClockIcon className="text-caramel" width={20} height={20} /> Open daily, {site.hours}
          </div>
        </div>
        <ul className="grid gap-3">
          {DELIVERY_OPTIONS.map((o) => (
            <li key={o.name} className="flex gap-4 rounded-2xl bg-ivory/70 p-4">
              <TruckIcon className="mt-0.5 shrink-0 text-caramel" />
              <div>
                <p className="font-medium">{o.name}</p>
                <p className="mt-0.5 text-sm text-muted">{o.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SocialCta() {
  return (
    <section className="container-page py-10 text-center">
      <Reveal>
        <p className="eyebrow">Say hello</p>
        <h2 className="mt-2 text-4xl sm:text-5xl">Prefer to order on WhatsApp?</h2>
        <p className="mt-3 text-muted">Message either number — we&apos;re open daily, {site.hours}.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {site.whatsappNumbers.map((n) => (
            <a
              key={n.e164}
              href={whatsappLink(n.e164, "Hi SM Delights! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "lg")}
            >
              <WhatsAppIcon width={20} height={20} /> {n.display}
            </a>
          ))}
          {site.instagramUrl && (
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg")}>
              <InstagramIcon width={20} height={20} /> Follow on Instagram
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
