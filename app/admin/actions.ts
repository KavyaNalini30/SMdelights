"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, rupeesToPaise, slugify } from "@/lib/admin";
import { CACHE_TAGS } from "@/lib/catalog";
import { resendNotification } from "@/lib/notify";
import type { OrderStatus } from "@/lib/types";

export type AdminState = { ok?: string; error?: string } | null;

const STATUSES = ["pending", "paid", "preparing", "out_for_delivery", "delivered", "cancelled"] as const;

// ---------------- Orders ----------------

export async function updateOrderStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { supabase, user } = await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(STATUSES), note: z.string().trim().max(500).optional() })
    .safeParse({ id: formData.get("id"), status: formData.get("status"), note: formData.get("note") || undefined });
  if (!parsed.success) return { error: "Invalid status" };
  const { id, status, note } = parsed.data;

  const { data: order } = await supabase.from("orders").select("status, paid_at").eq("id", id).single();
  if (!order) return { error: "Order not found" };
  if (order.status === status && !note) return { ok: "No change" };

  const patch: { status: OrderStatus; paid_at?: string } = { status };
  if (status === "paid" && !order.paid_at) patch.paid_at = new Date().toISOString();

  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("order_status_history").insert({ order_id: id, status, note: note ?? null, changed_by: user.id });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { ok: "Status updated" };
}

/** For pay-at-pickup orders: record that the customer paid in cash/UPI. */
export async function markPaidInPerson(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const method = formData.get("method") === "upi" ? "upi" : "cash";
  const { data: order } = await supabase.from("orders").select("status, paid_at, total_paise").eq("id", id).single();
  if (!order || order.paid_at) return;

  await supabase
    .from("orders")
    .update({ paid_at: new Date().toISOString(), status: order.status === "pending" ? "paid" : order.status })
    .eq("id", id);
  await supabase.from("order_status_history").insert({
    order_id: id,
    status: order.status === "pending" ? "paid" : order.status,
    note: `Paid in person (${method})`,
    changed_by: user.id,
  });
  revalidatePath(`/admin/orders/${id}`);
}

export async function saveOrderNote(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const note = String(formData.get("admin_note") ?? "").slice(0, 2000);
  await supabase.from("orders").update({ admin_note: note || null }).eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
}

/** "Resend" on the admin order page: sends one email / WhatsApp message again. */
export async function resendOrderNotification(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), audience: z.enum(["customer", "owner"]), channel: z.enum(["email", "whatsapp"]) })
    .safeParse({ id: formData.get("id"), audience: formData.get("audience"), channel: formData.get("channel") });
  if (!parsed.success) return;
  await resendNotification(parsed.data.id, parsed.data.audience, parsed.data.channel);
  revalidatePath(`/admin/orders/${parsed.data.id}`);
}

// ---------------- Products ----------------

const productSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z.string().trim().max(80).optional(),
  category_id: z.uuid("Choose a category"),
  description: z.string().trim().max(1000).optional(),
  shelf_life: z.string().trim().max(300).optional(),
  note_prompt: z.string().trim().max(120).optional(),
  sort: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.boolean(),
  is_bestseller: z.boolean(),
  chennai_only: z.boolean(),
  allows_note: z.boolean(),
});

const variantSchema = z.object({
  id: z.uuid().optional(),
  label: z.string().trim().min(1).max(60),
  price: z.string(),
  weight: z.string().regex(/^\d{0,5}$/, "Weights are whole grams, e.g. 300").default(""),
  is_active: z.boolean(),
});

export async function saveProduct(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const blank = (k: string) => (formData.get(k) ? String(formData.get(k)) : undefined);
  const parsed = productSchema.safeParse({
    id: blank("id"),
    name: formData.get("name"),
    slug: blank("slug"),
    category_id: formData.get("category_id"),
    description: blank("description"),
    shelf_life: blank("shelf_life"),
    note_prompt: blank("note_prompt"),
    sort: formData.get("sort") || 0,
    is_active: formData.get("is_active") === "on",
    is_bestseller: formData.get("is_bestseller") === "on",
    chennai_only: formData.get("chennai_only") === "on",
    allows_note: formData.get("allows_note") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  // Variants arrive as JSON from the form's variant editor.
  let variants: z.infer<typeof variantSchema>[];
  try {
    variants = z.array(variantSchema).min(1, "Add at least one size / price").parse(JSON.parse(String(formData.get("variants") ?? "[]")));
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Check the sizes and prices" };
  }
  const priced = variants.map((v, i) => ({ ...v, price_paise: rupeesToPaise(v.price), sort: i + 1 }));
  const badPrice = priced.find((v) => !v.price_paise);
  if (badPrice) return { error: `Enter a valid price for "${badPrice.label}"` };
  if (new Set(priced.map((v) => v.label.toLowerCase())).size !== priced.length) return { error: "Each size needs a different name" };

  const slug = slugify(p.slug || p.name);
  if (!slug) return { error: "Name must contain letters or numbers" };
  const images = z.array(z.string().max(500)).max(8).parse(JSON.parse(String(formData.get("images") ?? "[]")));

  const row = {
    name: p.name,
    slug,
    category_id: p.category_id,
    description: p.description ?? null,
    shelf_life: p.shelf_life ?? null,
    note_prompt: p.allows_note ? (p.note_prompt ?? null) : null,
    sort: p.sort,
    is_active: p.is_active,
    is_bestseller: p.is_bestseller,
    chennai_only: p.chennai_only,
    allows_note: p.allows_note,
    images,
  };

  const { data: saved, error } = p.id
    ? await supabase.from("products").update(row).eq("id", p.id).select("id").single()
    : await supabase.from("products").insert(row).select("id").single();
  if (error || !saved) {
    return { error: error?.code === "23505" ? "Another product already uses this web address (slug)." : (error?.message ?? "Save failed") };
  }

  // Variants: update existing, insert new, and hide removed ones (never delete — past orders refer to them).
  const { data: existing } = await supabase.from("product_variants").select("id").eq("product_id", saved.id);
  const keep = new Set(priced.filter((v) => v.id).map((v) => v.id));
  const removed = (existing ?? []).filter((v) => !keep.has(v.id)).map((v) => v.id);
  if (removed.length) {
    // Free the label so a new variant can reuse it, then hide.
    for (const id of removed) {
      await supabase.from("product_variants").update({ is_active: false, label: `(removed) ${id.slice(0, 8)}` }).eq("id", id);
    }
  }
  for (const v of priced) {
    const vrow = {
      product_id: saved.id,
      label: v.label,
      price_paise: v.price_paise!,
      weight_grams: Number(v.weight) || null,
      sort: v.sort,
      is_active: v.is_active,
    };
    const res = v.id
      ? await supabase.from("product_variants").update(vrow).eq("id", v.id)
      : await supabase.from("product_variants").insert(vrow);
    if (res.error) return { error: `Couldn't save "${v.label}": ${res.error.message}` };
  }

  updateTag(CACHE_TAGS.catalog);
  revalidatePath("/admin/products");
  if (!p.id) redirect(`/admin/products/${saved.id}?created=1`);
  return { ok: "Saved — the shop is updated." };
}

export async function toggleProductFlag(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const field = z.enum(["is_active", "is_bestseller"]).parse(formData.get("field"));
  const value = formData.get("value") === "true";
  await supabase.from("products").update({ [field]: value }).eq("id", id);
  updateTag(CACHE_TAGS.catalog);
  revalidatePath("/admin/products");
}

// ---------------- Delivery zones ----------------

export async function saveZone(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid zone" };
  const money = (key: string) => {
    const input = String(formData.get(key) ?? "").trim();
    return { input, paise: input === "" ? null : rupeesToPaise(input) };
  };
  const base = money("base_fee");
  const step = money("step_fee");
  if ((base.input && base.paise == null) || (step.input && step.paise == null)) {
    return { error: "Enter prices in rupees, e.g. 60 (or 0 for free)" };
  }
  const grams = (key: string) => Number(String(formData.get(key) ?? "").trim());
  const baseWeight = grams("base_weight_g");
  const stepWeight = grams("step_weight_g");
  if (![baseWeight, stepWeight].every((g) => Number.isInteger(g) && g >= 50 && g <= 50000)) {
    return { error: "Weights are in grams, e.g. 500" };
  }

  const prefixes = String(formData.get("prefixes") ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!prefixes.length || prefixes.some((p) => !/^\d{1,6}$/.test(p))) return { error: "Pincode prefixes must be numbers, separated by commas" };

  const { error } = await supabase
    .from("delivery_zones")
    .update({
      base_weight_g: baseWeight,
      base_fee_paise: base.paise,
      step_weight_g: stepWeight,
      step_fee_paise: step.paise,
      pincode_prefixes: prefixes,
      description: String(formData.get("description") ?? "").slice(0, 300) || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id.data);
  if (error) return { error: error.message };
  updateTag(CACHE_TAGS.zones);
  revalidatePath("/admin/delivery-zones");
  return { ok: "Saved" };
}

// ---------------- Enquiries ----------------

export async function updateEnquiry(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const status = z.enum(["new", "contacted", "quoted", "confirmed", "closed"]).parse(formData.get("status"));
  const admin_note = String(formData.get("admin_note") ?? "").slice(0, 2000) || null;
  await supabase.from("corporate_enquiries").update({ status, admin_note }).eq("id", id);
  revalidatePath("/admin/enquiries");
}

// ---------------- Reviews ----------------

const reviewAdminSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(1, "Review text is required").max(1000),
  source: z.string().trim().max(40).optional(),
  image_url: z.string().trim().max(500).optional(),
});

export async function addReview(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const parsed = reviewAdminSchema.safeParse({
    customer_name: formData.get("customer_name"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    source: formData.get("source") || undefined,
    image_url: formData.get("image_url") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("reviews").insert({ ...parsed.data, is_approved: true });
  if (error) return { error: error.message };
  updateTag(CACHE_TAGS.reviews);
  revalidatePath("/admin/reviews");
  return { ok: "Review added and published" };
}

export async function setReviewApproved(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  await supabase.from("reviews").update({ is_approved: formData.get("approved") === "true" }).eq("id", id);
  updateTag(CACHE_TAGS.reviews);
  revalidatePath("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  await supabase.from("reviews").delete().eq("id", id);
  updateTag(CACHE_TAGS.reviews);
  revalidatePath("/admin/reviews");
}
