"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { site, whatsappLink } from "@/config/site";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-5xl">Sorry, that didn&apos;t bake properly</h1>
      <p className="mt-3 max-w-md text-muted">
        Please try again. If it keeps happening, you can always order on WhatsApp.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href={whatsappLink(site.whatsappNumbers[0].e164, "Hi! I had trouble with the website.")} variant="secondary" target="_blank" rel="noopener noreferrer">
          WhatsApp us
        </ButtonLink>
      </div>
      {error.digest && <p className="mt-6 text-xs text-muted">Error reference: {error.digest}</p>}
    </div>
  );
}
