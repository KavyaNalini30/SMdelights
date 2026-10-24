"use client";

import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { site, whatsappLink } from "@/config/site";
import { CloseIcon, WhatsAppIcon } from "@/components/ui/icons";

/** Floating WhatsApp button. Opens a small card with both order numbers (shown equally). */
export function WhatsAppFab() {
  const [open, setOpen] = useState(false);
  const message = "Hi SM Delights! I'd like to place an order.";

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 print:hidden">
      <AnimatePresence>
        {open && (
          <m.div
            id="whatsapp-card"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-64 rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-lift"
          >
            <p className="font-serif text-xl">Order on WhatsApp</p>
            <p className="mt-0.5 text-xs text-muted">Open {site.hours}</p>
            <div className="mt-3 grid gap-2">
              {site.whatsappNumbers.map((n) => (
                <a
                  key={n.e164}
                  href={whatsappLink(n.e164, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#1f8f4c] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#187a40]"
                >
                  <WhatsAppIcon width={18} height={18} /> {n.display}
                </a>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <m.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={open}
        aria-controls="whatsapp-card"
        aria-label={open ? "Close WhatsApp options" : "Order on WhatsApp"}
        className="grid size-14 place-items-center rounded-full bg-[#1f8f4c] text-white shadow-lift"
      >
        {open ? <CloseIcon /> : <WhatsAppIcon width={28} height={28} />}
      </m.button>
    </div>
  );
}
