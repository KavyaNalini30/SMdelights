"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { nav, site, whatsappLink } from "@/config/site";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/icons";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Lock page scroll and allow Esc to close while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-full hover:bg-cream"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <MenuIcon />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.nav
              id="mobile-menu"
              aria-label="Main"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-ivory p-6 shadow-lift"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                onClick={close}
                className="-mr-2 self-end grid size-11 place-items-center rounded-full hover:bg-cream"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
              <ul className="mt-4 space-y-1">
                {[{ href: "/", label: "Home" }, ...nav, { href: "/account", label: "My account" }].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block rounded-xl px-3 py-3 font-serif text-2xl hover:bg-cream"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-2 border-t border-line pt-5 text-sm">
                <p className="eyebrow">Order on WhatsApp</p>
                {site.whatsappNumbers.map((n) => (
                  <a
                    key={n.e164}
                    href={whatsappLink(n.e164, "Hi SM Delights! I'd like to place an order.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1.5 text-base"
                  >
                    <WhatsAppIcon className="text-[#25D366]" /> {n.display}
                  </a>
                ))}
                <p className="text-muted">Open {site.hours}</p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
