"use client";

import { useActionState, useState } from "react";
import { saveProduct, type AdminState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import { ImageUploader } from "./ImageUploader";

export type ProductFormValue = {
  id?: string;
  name: string;
  slug: string;
  category_id: string;
  description: string;
  shelf_life: string;
  note_prompt: string;
  sort: number;
  is_active: boolean;
  is_bestseller: boolean;
  chennai_only: boolean;
  allows_note: boolean;
  images: string[];
  variants: { id?: string; label: string; price: string; is_active: boolean }[];
};

export function ProductForm({ value, categories }: { value: ProductFormValue; categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveProduct, null);
  const [variants, setVariants] = useState(value.variants.length ? value.variants : [{ label: "", price: "", is_active: true }]);
  const [images, setImages] = useState(value.images);
  const [allowsNote, setAllowsNote] = useState(value.allows_note);

  const setVariant = (i: number, patch: Partial<(typeof variants)[number]>) =>
    setVariants(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <form action={action} className="space-y-6">
      {value.id && <input type="hidden" name="id" value={value.id} />}
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">Product name</label>
          <input id="name" name="name" defaultValue={value.name} required className="field" />
        </div>
        <div>
          <label htmlFor="category_id" className="label">Category</label>
          <select id="category_id" name="category_id" defaultValue={value.category_id} required className="field">
            <option value="">Choose…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">Order in list <span className="font-normal text-muted">(smaller = first)</span></label>
          <input id="sort" name="sort" type="number" min={0} defaultValue={value.sort} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" defaultValue={value.description} maxLength={1000} className="field min-h-20" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="shelf_life" className="label">Shelf life & storage</label>
          <input id="shelf_life" name="shelf_life" defaultValue={value.shelf_life} className="field" placeholder="Room temperature: 3–7 days · Refrigerated: 1–2 weeks" />
          <p className="mt-1 text-xs text-muted">Put “ · ” between the two parts to show them on separate lines.</p>
        </div>
      </div>

      <fieldset className="rounded-2xl border border-line p-4">
        <legend className="px-1 font-medium">Sizes & prices</legend>
        <ul className="space-y-2">
          {variants.map((v, i) => (
            <li key={v.id ?? `new-${i}`} className="grid grid-cols-[1fr_7rem_auto_auto] items-center gap-2">
              <input aria-label="Size name" className="field py-2" placeholder="e.g. 250 g / Per piece" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} />
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
                <input aria-label="Price in rupees" className="field py-2 pl-7" inputMode="decimal" placeholder="149" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} />
              </div>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={v.is_active} onChange={(e) => setVariant(i, { is_active: e.target.checked })} className="accent-chocolate" /> On sale
              </label>
              <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))} disabled={variants.length === 1} className="grid size-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label="Remove size">
                <CloseIcon width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setVariants([...variants, { label: "", price: "", is_active: true }])} className="mt-3 inline-flex items-center gap-1 text-sm underline">
          <PlusIcon width={16} height={16} /> Add a size
        </button>
      </fieldset>

      <ImageUploader value={images} onChange={setImages} folder="products" />

      <fieldset className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
        <legend className="px-1 font-medium">Options</legend>
        <Check name="is_active" defaultChecked={value.is_active} label="Show in shop" hint="Untick to hide without deleting" />
        <Check name="is_bestseller" defaultChecked={value.is_bestseller} label="Bestseller" hint="Shown on the home page" />
        <Check name="chennai_only" defaultChecked={value.chennai_only} label="Chennai only" hint="Can't be shipped outside Chennai" />
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="allows_note" checked={allowsNote} onChange={(e) => setAllowsNote(e.target.checked)} className="mt-1 accent-chocolate" />
          <span><span className="font-medium">Ask the customer a question</span><span className="block text-muted">e.g. which flavours</span></span>
        </label>
        {allowsNote && (
          <div className="sm:col-span-2">
            <label htmlFor="note_prompt" className="label">Question to ask</label>
            <input id="note_prompt" name="note_prompt" defaultValue={value.note_prompt} className="field" placeholder="Which 2 flavours would you like?" />
          </div>
        )}
      </fieldset>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Advanced</summary>
        <div className="mt-3">
          <label htmlFor="slug" className="label">Web address</label>
          <div className="flex items-center gap-1"><span className="text-muted">/product/</span><input id="slug" name="slug" defaultValue={value.slug} className="field" placeholder="made from the name if left empty" /></div>
        </div>
      </details>

      <div className="sticky bottom-0 -mx-5 flex items-center gap-4 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save product"}</Button>
        {state?.ok && <p className="text-sm text-success" role="status">{state.ok}</p>}
        {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      </div>
    </form>
  );
}

function Check({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint: string }) {
  return (
    <label className="flex gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 accent-chocolate" />
      <span><span className="font-medium">{label}</span><span className="block text-muted">{hint}</span></span>
    </label>
  );
}
