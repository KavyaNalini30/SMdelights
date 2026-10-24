"use client";

import { useActionState, useState } from "react";
import { addReview, type AdminState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "./ImageUploader";

export function AddReviewForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(addReview, null);
  const [images, setImages] = useState<string[]>([]);
  return (
    <form
      action={async (fd) => {
        await action(fd);
        setImages([]);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="image_url" value={images[0] ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="customer_name" className="label">Customer name</label>
          <input id="customer_name" name="customer_name" required className="field" />
        </div>
        <div>
          <label htmlFor="rating" className="label">Stars</label>
          <select id="rating" name="rating" defaultValue="5" className="field">
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="source" className="label">Where from</label>
          <select id="source" name="source" className="field" defaultValue="Instagram">
            <option>Instagram</option>
            <option>WhatsApp</option>
            <option>Google</option>
            <option value="">—</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="body" className="label">What they said</label>
        <textarea id="body" name="body" required maxLength={1000} className="field min-h-24" />
      </div>
      <ImageUploader value={images} onChange={setImages} folder="reviews" max={1} label="Screenshot (optional)" />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add & publish review"}</Button>
        {state?.ok && <span className="text-sm text-success" role="status">{state.ok}</span>}
        {state?.error && <span className="text-sm text-danger" role="alert">{state.error}</span>}
      </div>
    </form>
  );
}
