import Link from "next/link";
import { ProductForm, type ProductFormValue } from "@/components/admin/ProductForm";
import { Card } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";

/** Edit a product, or create one at /admin/products/new. */
// Every admin page checks the login before rendering anything, so navigations wait for the server.
export const instant = false;

export default async function AdminProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const { data: categories } = await supabase.from("categories").select("id, name").eq("is_enquiry_only", false).order("sort");

  let value: ProductFormValue = {
    name: "",
    slug: "",
    category_id: "",
    description: "",
    shelf_life: "",
    note_prompt: "",
    sort: 99,
    is_active: true,
    is_bestseller: false,
    chennai_only: false,
    allows_note: false,
    images: [],
    variants: [],
  };

  if (id !== "new") {
    const { data: p } = await supabase
      .from("products")
      .select("*, variants:product_variants(id, label, price_paise, weight_grams, is_active, sort)")
      .eq("id", id)
      .maybeSingle();
    if (!p) return <p>Product not found. <Link href="/admin/products" className="underline">Back</Link></p>;
    value = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category_id: p.category_id,
      description: p.description ?? "",
      shelf_life: p.shelf_life ?? "",
      note_prompt: p.note_prompt ?? "",
      sort: p.sort,
      is_active: p.is_active,
      is_bestseller: p.is_bestseller,
      chennai_only: p.chennai_only,
      allows_note: p.allows_note,
      images: p.images ?? [],
      variants: (p.variants as { id: string; label: string; price_paise: number; weight_grams: number | null; is_active: boolean; sort: number }[])
        .filter((v) => !v.label.startsWith("(removed)"))
        .sort((a, b) => a.sort - b.sort)
        .map((v) => ({
          id: v.id,
          label: v.label,
          price: String(v.price_paise / 100),
          weight: v.weight_grams == null ? "" : String(v.weight_grams),
          is_active: v.is_active,
        })),
    };
  }

  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="text-sm text-muted">← All products</Link>
      <h2 className="text-3xl">{value.id ? value.name : "New product"}</h2>
      {created && <p className="text-sm text-success" role="status">Product created.</p>}
      <Card>
        <ProductForm value={value} categories={categories ?? []} />
      </Card>
    </div>
  );
}
