"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";

/** Supabase client for the browser (auth forms, admin uploads). Uses the public anon key; RLS applies. */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
