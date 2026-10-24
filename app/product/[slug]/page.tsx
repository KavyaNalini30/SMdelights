import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/product/AddToCart";
import { ProductGrid, priceLabel } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { ClockIcon, SnowflakeIcon, TruckIcon } from "@/components/ui/icons";
import { site, siteUrl } from "@/config/site";
import { getAllProducts, getProduct, getProductsByCategory } from "@/lib/catalog";

export async function generateStaticParams() {
  const products = await getAllProducts();
  // Cache Components needs at least one entry; before the database is seeded, use a known slug.
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "classic-melo-brownie" }];
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not found" };
  const description = `${product.description ?? product.name} — ${priceLabel(product)}. ${site.name}, Chennai.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: product.images[0] ? { images: [{ url: product.images[0] }] } : undefined,
  };
}

export default function ProductPage(props: PageProps<"/product/[slug]">) {
  return (
    <div className="container-page pb-32 pt-6 sm:pt-10 md:pb-10">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails params={props.params} />
      </Suspense>
    </div>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = (await getProductsByCategory(product.category.slug)).filter((p) => p.id !== product.id).slice(0, 4);
  const [room, fridge] = splitShelfLife(product.shelf_life);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((i) => (i.startsWith("http") ? i : `${siteUrl}${i}`)),
    brand: { "@type": "Brand", name: site.name },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      name: v.label,
      price: (v.price_paise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/product/${product.slug}`,
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/shop" className="hover:text-chocolate">Shop</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/shop/${product.category.slug}`} className="hover:text-chocolate">{product.category.name}</Link></li>
        </ol>
      </nav>

      <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="space-y-3">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="rounded-[1.75rem] shadow-soft"
          />
          {product.images.length > 1 && (
            <ul className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((src) => (
                <li key={src}>
                  <ProductImage src={src} alt="" sizes="25vw" className="rounded-xl" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl">{product.name}</h1>
          <p className="mt-3 font-serif text-2xl text-caramel">{priceLabel(product)}</p>
          {product.description && <p className="mt-4 text-lg leading-relaxed text-muted">{product.description}</p>}

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <dl className="mt-10 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper/70 text-sm">
            {product.shelf_life && (
              <div className="flex gap-3 p-4">
                <SnowflakeIcon className="mt-0.5 shrink-0 text-caramel" width={20} height={20} />
                <div>
                  <dt className="font-medium">Shelf life & storage</dt>
                  <dd className="mt-0.5 text-muted">
                    {room}
                    {fridge && <><br />{fridge}</>}
                  </dd>
                </div>
              </div>
            )}
            <div className="flex gap-3 p-4">
              <ClockIcon className="mt-0.5 shrink-0 text-caramel" width={20} height={20} />
              <div>
                <dt className="font-medium">Order a day ahead</dt>
                <dd className="mt-0.5 text-muted">Baked to order — place your order at least one day in advance.</dd>
              </div>
            </div>
            <div className="flex gap-3 p-4">
              <TruckIcon className="mt-0.5 shrink-0 text-caramel" width={20} height={20} />
              <div>
                <dt className="font-medium">Delivery</dt>
                <dd className="mt-0.5 text-muted">
                  {product.chennai_only
                    ? "Available in Chennai only (delivery or pickup)."
                    : "Delivery across Chennai, or shipping to Tamil Nadu and Bengaluru."}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-3xl">More {product.category.name.toLowerCase()}</h2>
          <ProductGrid products={related} />
        </section>
      )}

      <script
        type="application/ld+json"
        // JSON-LD for Google rich results. JSON.stringify output with "<" escaped is safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}

/** "Room temperature: 3–7 days · Refrigerated: 1–2 weeks" -> two lines. */
function splitShelfLife(text: string | null): [string, string | null] {
  if (!text) return ["", null];
  const [a, b] = text.split(" · ");
  return [a, b ?? null];
}

function ProductSkeleton() {
  return (
    <div aria-hidden className="mt-9 grid animate-pulse gap-8 md:grid-cols-2 md:gap-12">
      <div className="aspect-square rounded-[1.75rem] bg-cream" />
      <div className="space-y-4">
        <div className="h-12 w-3/4 rounded bg-cream" />
        <div className="h-7 w-24 rounded bg-cream" />
        <div className="h-20 rounded bg-cream" />
        <div className="h-12 w-48 rounded-full bg-cream" />
      </div>
    </div>
  );
}
