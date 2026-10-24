"use client";

import Image from "next/image";
import { useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";
const MAX_SIDE = 1600;

/** Shrinks a phone photo to ≤1600px WebP in the browser before upload (≈200–400 KB). */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/webp", 0.85));
}

export function ImageUploader({
  value,
  onChange,
  folder,
  max = 6,
  label = "Photos",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  max?: number;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, max - value.length)) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await downscale(file);
        const path = `${folder}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", upsert: false });
        if (error) throw error;
        added.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
      onChange([...value, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const move = (from: number, to: number) => {
    const next = [...value];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div>
      <p className="label">{label} <span className="font-normal text-muted">(first photo is the main one)</span></p>
      <ul className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <li key={src} className="relative size-24 overflow-hidden rounded-xl border border-line bg-cream">
            <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            <button type="button" onClick={() => onChange(value.filter((v) => v !== src))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/70 text-ivory" aria-label="Remove photo">
              <CloseIcon width={14} height={14} />
            </button>
            {i > 0 && (
              <button type="button" onClick={() => move(i, 0)} className="absolute inset-x-1 bottom-1 rounded-full bg-ink/70 py-0.5 text-[0.65rem] text-ivory">
                Make main
              </button>
            )}
          </li>
        ))}
        {value.length < max && (
          <li>
            <label className="grid size-24 cursor-pointer place-items-center rounded-xl border border-dashed border-caramel/60 bg-paper text-center text-xs text-muted hover:bg-cream">
              {busy ? "Uploading…" : "+ Add photo"}
              <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(e) => onFiles(e.target.files)} />
            </label>
          </li>
        )}
      </ul>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}
