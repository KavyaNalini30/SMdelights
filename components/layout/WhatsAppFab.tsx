"use client";

import { m } from "motion/react";
import { whatsappLink } from "@/config/site";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Floating WhatsApp button: opens a chat with the shop straight away. */
export function WhatsAppFab() {
  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6 print:hidden">
      <m.a
        href={whatsappLink(undefined, "Hi SM Delights! I'd like to place an order.")}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="grid size-14 place-items-center rounded-full bg-[#1f8f4c] text-white shadow-lift"
      >
        <WhatsAppIcon width={28} height={28} />
      </m.a>
    </div>
  );
}
