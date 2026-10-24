"use server";

import { rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { enquirySchema, fieldErrors, reviewSchema } from "@/lib/validation";

export type PublicFormState = { ok?: boolean; error?: string; fields?: Record<string, string> } | null;

/** Bulk / corporate enquiry. Inserted as the anonymous role — RLS only allows new, unreviewed rows. */
export async function submitEnquiry(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  if (!isSupabaseConfigured) return { error: "Enquiries aren't set up yet — please message us on WhatsApp." };
  const parsed = enquirySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    company: formData.get("company") || undefined,
    eventDate: formData.get("eventDate") ?? "",
    quantity: formData.get("quantity") || undefined,
    items: formData.getAll("items").map(String),
    message: formData.get("message") || undefined,
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) };
  if (!(await rateLimit("enquiry", 5, 3600))) return { error: "Too many enquiries from this connection — please WhatsApp us instead." };

  const e = parsed.data;
  const { error } = await createPublicClient().from("corporate_enquiries").insert({
    name: e.name,
    phone: e.phone,
    email: e.email ?? null,
    company: e.company ?? null,
    event_date: e.eventDate ?? null,
    quantity: e.quantity ?? null,
    items_of_interest: e.items,
    message: e.message ?? null,
  });
  if (error) {
    console.error("enquiry insert failed", error.message);
    return { error: "Couldn't send your enquiry. Please try again or WhatsApp us." };
  }
  return { ok: true };
}

/** Public review — saved unapproved; the admin approves it before it appears. */
export async function submitReview(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  if (!isSupabaseConfigured) return { error: "Reviews aren't set up yet." };
  const parsed = reviewSchema.safeParse({
    name: formData.get("name"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) };
  if (!(await rateLimit("review", 3, 3600))) return { error: "Thanks! You've already sent a few reviews — we'll read them soon." };

  const { error } = await createPublicClient().from("reviews").insert({
    customer_name: parsed.data.name,
    rating: parsed.data.rating,
    body: parsed.data.body,
    source: "Website",
  });
  if (error) {
    console.error("review insert failed", error.message);
    return { error: "Couldn't send your review. Please try again." };
  }
  return { ok: true };
}
