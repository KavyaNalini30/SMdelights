import type { Metadata } from "next";
import { CategoryChips } from "@/components/shop/CategoryChips";
import { ProductGrid } from "@/components/product/ProductCard";
import { SetupNotice } from "@/components/SetupNotice";
import { Reveal } from "@/components/motion/Reveal";
import { getAllProducts, getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Brownies, tea cakes, cookies & biscuits, drinks and gift boxes from SM Delights, Chennai.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  const shopCategories = categories.filter((c) => !c.is_enquiry_only);

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">The menu</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Shop</h1>
        <p className="mt-3 text-muted">Everything is baked to order — please order at least a day in advance.</p>
      </header>

      <div className="mt-8">
        <CategoryChips categories={categories} />
      </div>

      <div className="mt-6">
        <SetupNotice />
      </div>

      <div className="mt-6 space-y-14">
        {shopCategories.map((category) => {
          const items = products.filter((p) => p.category.slug === category.slug);
          if (!items.length) return null;
          return (
            <Reveal as="section" key={category.id} className="scroll-mt-24">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl">{category.name}</h2>
                  {category.description && <p className="mt-1 text-sm text-muted">{category.description}</p>}
                </div>
              </div>
              <ProductGrid products={items} />
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
