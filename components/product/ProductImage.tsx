import Image from "next/image";
import { cn } from "@/lib/format";

/**
 * Product photo in a square ivory frame. The whole photo is always visible (object-contain),
 * centred both ways — photos of any proportion line up neatly and the product is never cropped.
 * Shows a branded placeholder when the client hasn't supplied a photo yet.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
  imageClassName,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("relative aspect-square overflow-hidden bg-paper", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-contain object-center", imageClassName)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--color-paper),var(--color-cream))]">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <Image src="/images/brand/monogram.webp" alt="" width={88} height={60} className="opacity-60" />
            <span className="text-[0.65rem] uppercase tracking-[0.22em] text-muted">Photo coming soon</span>
          </div>
        </div>
      )}
    </div>
  );
}
