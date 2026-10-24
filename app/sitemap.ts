import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { getAllProducts, getCategories } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${siteUrl}${path}`, priority });

  return [
    page("/", 1),
    page("/shop", 0.9),
    ...categories.filter((c) => !c.is_enquiry_only).map((c) => page(`/shop/${c.slug}`, 0.8)),
    ...products.map((p) => page(`/product/${p.slug}`, 0.7)),
    page("/corporate", 0.7),
    page("/contact", 0.6),
    page("/reviews/new", 0.3),
    ...["shipping", "refund", "terms", "privacy"].map((p) => page(`/policies/${p}`, 0.3)),
  ];
}
