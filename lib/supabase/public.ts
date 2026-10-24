import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Anonymous, cookie-free client for public data (menu, zones, approved reviews).
 * Because it never reads cookies it can be used inside "use cache" functions,
 * so the shop pages are prerendered and served from the cache.
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
