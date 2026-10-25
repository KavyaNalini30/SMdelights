import Image from "next/image";
import { deleteReview, setReviewApproved } from "@/app/admin/actions";
import { AddReviewForm } from "@/components/admin/AddReviewForm";
import { Card, Pill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

type Row = { id: string; customer_name: string; rating: number; body: string; image_url: string | null; source: string | null; is_approved: boolean; created_at: string };

export default async function AdminReviews() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("reviews").select("*").order("is_approved").order("created_at", { ascending: false });
  const reviews = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 font-serif text-2xl">Add a review</h2>
        <AddReviewForm />
      </Card>

      <section>
        <h2 className="mb-3 font-serif text-2xl">All reviews</h2>
        {!reviews.length ? (
          <p className="text-sm text-muted">No reviews yet. Reviews customers submit on the website appear here for you to approve.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id}>
                <Card className="flex h-full flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{r.customer_name} <span className="text-caramel">{"★".repeat(r.rating)}</span></p>
                    {r.is_approved ? <Pill tone="good">Published</Pill> : <Pill tone="warn">Waiting for approval</Pill>}
                  </div>
                  {r.image_url && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cream">
                      <Image src={r.image_url} alt="" fill sizes="20rem" className="object-contain" />
                    </div>
                  )}
                  <p className="flex-1 text-sm">{r.body}</p>
                  <p className="text-xs text-muted">{r.source ?? "Website"} · {formatDate(r.created_at)}</p>
                  <div className="flex gap-2">
                    <form action={setReviewApproved}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="approved" value={String(!r.is_approved)} />
                      <button className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-cream">{r.is_approved ? "Unpublish" : "Approve & publish"}</button>
                    </form>
                    <form action={deleteReview}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-full px-3 py-1.5 text-sm text-danger hover:bg-danger/10">Delete</button>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
