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
import { getApprovedReviews, getBestsellers, getCategories, getDeliveryZones } from "@/lib/catalog";

export default async function HomePage() {
  const [categories, bestsellers, reviews, zones] = await Promise.all([
    getCategories(),
    getBestsellers(),
    getApprovedReviews(6),
    getDeliveryZones(),
  ]);

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
      <DeliveryInfo zones={zones} />
      <SocialCta />
    </>
  );
}
