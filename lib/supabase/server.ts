import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Supabase client acting as the signed-in visitor (reads their auth cookie).
 * Row Level Security applies. Create one per request — never share it.
 */
export async function createClient() {
  // The session check compares the token expiry with the current time, so it can never be prerendered.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session cookie on every request, so this is safe to ignore.
        }
      },
    },
  });
}

/** The signed-in user (verified with Supabase), or null. */
export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** The signed-in user if they are an admin, otherwise null. Checked against the database. */
export async function getAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  return profile?.role === "admin" ? data.user : null;
}
