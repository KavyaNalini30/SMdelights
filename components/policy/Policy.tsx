import type { ReactNode } from "react";
import { site } from "@/config/site";

/**
 * Wraps policy text the client hasn't confirmed yet. Highlighted on the site until
 * `site.policiesReviewed` is set to true in config/site.ts.
 */
export function Confirm({ children }: { children: ReactNode }) {
  if (site.policiesReviewed) return <>{children}</>;
  return (
    <mark className="rounded bg-caramel/20 px-1 text-inherit underline decoration-caramel decoration-dashed underline-offset-4" title="To be confirmed by SM Delights">
      {children}
    </mark>
  );
}

export function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Policies</p>
      <h1 className="mt-3 text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {site.policiesUpdated}</p>
      {!site.policiesReviewed && (
        <p className="mt-6 rounded-xl border border-caramel/50 bg-caramel/10 px-4 py-3 text-sm">
          Draft — <mark className="rounded bg-caramel/20 px-1">highlighted text</mark> is awaiting confirmation from SM Delights.
        </p>
      )}
      <div className="mt-8 space-y-6 leading-relaxed text-chocolate/90 [&_h2]:mt-10 [&_h2]:text-3xl [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function ContactBlock() {
  return (
    <ul>
      <li>WhatsApp / phone: {site.whatsappNumbers.map((n) => `+91 ${n.display}`).join(" or ")}</li>
      {site.email && <li>Email: {site.email}</li>}
      <li>Hours: every day, {site.hours}</li>
      <li>Location: {site.locality}</li>
    </ul>
  );
}
