import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CategoryChips } from "@/components/shop/CategoryChips";
import { ProductGrid } from "@/components/product/ProductCard";
import { getCategories, getCategory, getProductsByCategory } from "@/lib/catalog";

export async function generateStaticParams() {
  const categories = await getCategories();
  const params = categories.filter((c) => !c.is_enquiry_only).map((c) => ({ category: c.slug }));
  // Cache Components needs at least one entry; before the database is seeded, use a known slug.
  return params.length ? params : [{ category: "brownies" }];
}

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Not found" };
  return {
    title: category.name,
    description: category.description ?? undefined,
    alternates: { canonical: `/shop/${slug}` },
  };
}

export default function CategoryPage(props: PageProps<"/shop/[category]">) {
  return (
    <div className="container-page py-10 sm:py-14">
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params }: Pick<PageProps<"/shop/[category]">, "params">) {
  const { category: slug } = await params;
  const [categories, category, products] = await Promise.all([
    getCategories(),
    getCategory(slug),
    getProductsByCategory(slug),
  ]);
  if (!category) notFound();
  if (category.is_enquiry_only) redirect("/corporate");

  return (
    <>
      <header className="max-w-2xl">
        <p className="eyebrow">Shop</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">{category.name}</h1>
        {category.description && <p className="mt-3 text-muted">{category.description}</p>}
      </header>
      <div className="mt-8">
        <CategoryChips categories={categories} active={slug} />
      </div>
      <div className="mt-8">
        {products.length ? (
          <ProductGrid products={products} priorityCount={4} />
        ) : (
          <p className="text-muted">Nothing here just yet — check back soon.</p>
        )}
      </div>
    </>
  );
}

function CategorySkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="h-4 w-16 rounded bg-cream" />
      <div className="mt-4 h-12 w-64 rounded bg-cream" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-[var(--radius-card)] bg-cream" />
        ))}
      </div>
    </div>
  );
}
