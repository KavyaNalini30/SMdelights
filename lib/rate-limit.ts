import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window rate limit stored in Postgres (works across serverless instances).
 * Returns true when the request is allowed. Fails open if the database is unreachable,
 * so a hiccup never blocks a genuine customer from ordering.
 */
export async function rateLimit(bucket: string, max: number, windowSeconds: number) {
  try {
    const key = `${bucket}:${await clientIp()}`;
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("rate limit check failed", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("rate limit check failed", e);
    return true;
  }
}
