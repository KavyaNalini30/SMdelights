"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { phoneSchema } from "@/lib/validation";

export type ActionState = { ok?: boolean; error?: string } | null;

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: phoneSchema,
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse({ full_name: formData.get("full_name"), phone: formData.get("phone") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please log in again." };

  // RLS + column privileges: customers can only change their own name and phone.
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", data.user.id);
  if (error) return { error: "Couldn't save your details. Please try again." };
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteAddress(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id.data); // RLS: only the owner's rows
  revalidatePath("/account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
