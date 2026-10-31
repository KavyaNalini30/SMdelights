import { Hero } from "@/components/home/Hero";
import { Promises } from "@/components/home/Promises";
import {
  Bestsellers,
  CategoryTiles,
  CorporateBand,
  DeliveryInfo,
  GiftingBand,
  Reviews,
  SocialCta,
} from "@/components/home/Sections";
import { SetupNotice } from "@/components/SetupNotice";
import { site, siteUrl } from "@/config/site";
import { getApprovedReviews, getBestsellers, getCategories } from "@/lib/catalog";

// Google business info. No street address — the client asked not to publish one.
const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: site.name,
  slogan: site.tagline,
  description: site.description,
  url: siteUrl,
  logo: `${siteUrl}/images/brand/logo.webp`,
  image: `${siteUrl}/opengraph-image.jpg`,
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  areaServed: ["Chennai", "Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana"],
  address: { "@type": "PostalAddress", addressLocality: "Chennai", addressRegion: "Tamil Nadu", addressCountry: "IN" },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "10:00",
    closes: "21:00",
  },
  ...(site.instagramUrl ? { sameAs: [site.instagramUrl] } : {}),
};

export default async function HomePage() {
  const [categories, bestsellers, reviews] = await Promise.all([getCategories(), getBestsellers(), getApprovedReviews(6)]);

  return (
    <>
      <Hero />
      <Promises />
      <div className="container-page mt-10 empty:hidden">
        <SetupNotice />
      </div>
      <CategoryTiles categories={categories} />
      <Bestsellers products={bestsellers} />
      <GiftingBand />
      <Reviews reviews={reviews} />
      <CorporateBand />
      <DeliveryInfo />
      <SocialCta />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
