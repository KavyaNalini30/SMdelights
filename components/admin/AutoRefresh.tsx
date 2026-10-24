"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the page data every `seconds` while the tab is visible, so new orders appear on their own. */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
