import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <Image src="/images/brand/monogram.webp" alt="" width={117} height={80} className="opacity-70" />
      <p className="eyebrow mt-6">Page not found</p>
      <h1 className="mt-3 text-5xl">This page has been eaten</h1>
      <p className="mt-3 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved. The brownies, however, are still here.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop">Browse the menu</ButtonLink>
        <ButtonLink href="/" variant="secondary">Go home</ButtonLink>
      </div>
    </div>
  );
}
