"use client";

import { useEffect } from "react";

/**
 * Fast-delivery orders continue on WhatsApp: right after checkout (?wa=1) this opens the
 * pre-filled chat once. The visible button on the page is the fallback if the phone blocks it.
 */
export function OpenWhatsApp({ href, storageKey }: { href: string; storageKey: string }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Storage blocked: still open it once for this page view.
    }
    window.location.href = href;
  }, [href, storageKey]);
  return null;
}
