import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Category, DeliveryZone, Product, Review, Variant } from "@/lib/types";

/*
 * Public catalogue reads. Cached ("use cache") so shop pages are fast and cheap;
 * admin edits call revalidateTag(CACHE_TAGS.x) so changes show up within seconds.
 */
export const CACHE_TAGS = { catalog: "catalog", reviews: "reviews", zones: "zones" } as const;

const PRODUCT_FIELDS = `
  id, slug, name, description, images, shelf_life, is_bestseller, chennai_only,
  allows_note, note_prompt, sort,
  category:categories!inner(slug, name, is_active),
  variants:product_variants(id, label, price_paise, sort, is_active)
`;

type ProductRow = Omit<Product, "variants" | "category"> & {
  category: { slug: string; name: string; is_active: boolean };
  variants: (Variant & { is_active: boolean })[];
};

function toProduct(row: ProductRow): Product {
  return {
    ...row,
    category: { slug: row.category.slug, name: row.category.name },
    variants: row.variants
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort - b.sort)
      .map(({ id, label, price_paise, sort }) => ({ id, label, price_paise, sort })),
  };
}

/** Products that can actually be bought: active, in an active category, with at least one price. */
function sellable(rows: ProductRow[] | null) {
  return (rows ?? [])
    .filter((r) => r.category.is_active)
    .map(toProduct)
    .filter((p) => p.variants.length > 0);
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(CACHE_TAGS.catalog);
  if (!isSupabaseConfigured) {
    cacheLife("seconds");
    return [];
  }

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, slug, name, description, image, sort, is_enquiry_only")
    .eq("is_active", true)
    .order("sort");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  // Never hold on to an empty menu: retry within seconds instead of hours.
  if (data?.length) cacheLife("hours");
  else cacheLife("seconds");
  return data ?? [];
}

export async function getCategory(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getAllProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(CACHE_TAGS.catalog);
  if (!isSupabaseConfigured) {
    cacheLife("seconds");
    return [];
  }

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("is_active", true)
    .order("sort");
  if (error) throw new Error(`Could not load products: ${error.message}`);
  // Never hold on to an empty menu: retry within seconds instead of hours.
  if (data?.length) cacheLife("hours");
  else cacheLife("seconds");

  const categories = await getCategories();
  const categoryOrder = new Map(categories.map((c) => [c.slug, c.sort]));
  return sellable(data as unknown as ProductRow[]).sort(
    (a, b) =>
      (categoryOrder.get(a.category.slug) ?? 99) - (categoryOrder.get(b.category.slug) ?? 99) || a.sort - b.sort,
  );
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.category.slug === categorySlug);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Products the admin marked as bestsellers; falls back to the signature brownies until any are marked. */
export async function getBestsellers(limit = 8): Promise<Product[]> {
  const products = await getAllProducts();
  const marked = products.filter((p) => p.is_bestseller);
  return (marked.length ? marked : products.filter((p) => p.category.slug === "brownies")).slice(0, limit);
}

export async function getApprovedReviews(limit = 12): Promise<Review[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.reviews);
  if (!isSupabaseConfigured) return [];

  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, customer_name, rating, body, image_url, source, created_at")
    .eq("is_approved", true)
    .order("sort")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load reviews: ${error.message}`);
  return data ?? [];
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  "use cache";
  cacheTag(CACHE_TAGS.zones);
  if (!isSupabaseConfigured) {
    cacheLife("seconds");
    return [];
  }

  const { data, error } = await createPublicClient()
    .from("delivery_zones")
    .select("id, name, description, pincode_prefixes, fee_paise, is_local, sort")
    .eq("is_active", true)
    .order("sort");
  if (error) throw new Error(`Could not load delivery zones: ${error.message}`);
  // Never hold on to an empty menu: retry within seconds instead of hours.
  if (data?.length) cacheLife("hours");
  else cacheLife("seconds");
  return data ?? [];
}
