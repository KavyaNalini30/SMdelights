import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Shown in place of the menu until Supabase is connected (see SETUP.md, step 2). */
export function SetupNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div role="status" className="rounded-[var(--radius-card)] border border-dashed border-caramel/60 bg-paper p-6 text-sm">
      <p className="font-serif text-xl">The menu isn&apos;t connected yet</p>
      <p className="mt-1 text-muted">
        Add the Supabase keys to <code>.env.local</code> and run the SQL files in <code>supabase/</code> — see SETUP.md.
      </p>
    </div>
  );
}
