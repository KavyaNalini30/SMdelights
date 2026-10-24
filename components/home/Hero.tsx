import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/config/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-page grid items-center gap-8 pb-12 pt-8 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pb-20 md:pt-14">
        <div className="animate-rise order-2 md:order-1">
          <p className="eyebrow">Home-made in {site.locality}</p>
          <h1 className="mt-4 text-[2.9rem] leading-[1.02] sm:text-6xl lg:text-7xl">
            Brownies &amp; bakes,
            <span className="block italic text-cocoa">where every bite delights.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Fudgy brownies, tea cakes, cookies and drinks — baked to order and delivered across Chennai.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/shop" size="lg">
              Shop the menu
            </ButtonLink>
            <ButtonLink href="/shop/gift-boxes" variant="secondary" size="lg">
              Gift boxes
            </ButtonLink>
          </div>
        </div>

        <div className="animate-rise order-1 [animation-delay:120ms] md:order-2">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] shadow-lift max-md:aspect-[5/4]">
            <Image
              src="/images/bg/hero-parchment.webp"
              alt="Three fudgy brownies on crinkled parchment paper"
              fill
              priority
              sizes="(min-width: 768px) 28rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
