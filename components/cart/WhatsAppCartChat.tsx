import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/config/site";
import { cn, formatPrice } from "@/lib/format";
import type { CartLine } from "@/store/cart";

/** The cart as a WhatsApp message, for customers who want to ask or customise before ordering. */
export function cartWhatsAppText(lines: CartLine[], subtotal: number) {
  return [
    "Hi SM Delights! I have a question / would like to customise this order before placing it:",
    "",
    ...lines.map((l) => `• ${l.qty} × ${l.name} (${l.variantLabel})${l.note ? ` — ${l.note}` : ""}`),
    `Subtotal: ${formatPrice(subtotal)}`,
  ].join("\n");
}

export function WhatsAppCartChat({ lines, subtotal, className }: { lines: CartLine[]; subtotal: number; className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="text-sm text-muted">Have questions or want to customise?</p>
      <a
        href={whatsappLink(undefined, cartWhatsAppText(lines, subtotal))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#1f8f4c] px-5 py-2.5 text-sm font-medium text-[#1f7a43] transition-colors hover:bg-[#1f8f4c]/10"
      >
        <WhatsAppIcon width={18} height={18} /> Chat with us on WhatsApp
      </a>
    </div>
  );
}
