import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

/** Anonymous, cookie-free supabase-js client for public data outside "use cache" (forms, pricing). */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Read public rows straight from Supabase's REST API (PostgREST) with the anon key — RLS applies.
 * Used inside "use cache" functions: plain fetch has no auth/session machinery, which can stall
 * cached functions while Next.js prerenders pages at build time.
 *
 *   publicSelect("categories", { select: "id, name", is_active: "eq.true", order: "sort" })
 */
export async function publicSelect<T>(table: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value.replace(/\s+/g, ""));
  const res = await fetch(url, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase ${table} request failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}
