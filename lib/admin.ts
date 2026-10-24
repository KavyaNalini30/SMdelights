import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Every admin server action and page starts with this. Returns a Supabase client acting
 * as the admin (so RLS still applies — a second, independent check), or throws.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role !== "admin") throw new Error("Not an admin");
  return { supabase, user: data.user };
}

/** "Chocolate Tea Cake!" -> "chocolate-tea-cake" */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** "149" / "149.50" / "₹1,299" -> paise (14900 / 14950 / 129900); null if invalid. */
export function rupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}
