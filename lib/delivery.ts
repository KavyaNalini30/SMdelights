import type { DeliveryZone } from "@/lib/types";

export const PINCODE_RE = /^[1-9][0-9]{5}$/;

/** The zone whose prefix matches the pincode most specifically ("600" beats "60"). */
export function zoneForPincode(pincode: string, zones: DeliveryZone[]): DeliveryZone | null {
  if (!PINCODE_RE.test(pincode)) return null;
  let best: { zone: DeliveryZone; len: number } | null = null;
  for (const zone of zones) {
    for (const prefix of zone.pincode_prefixes) {
      if (pincode.startsWith(prefix) && (!best || prefix.length > best.len)) {
        best = { zone, len: prefix.length };
      }
    }
  }
  return best?.zone ?? null;
}

/** Earliest delivery/pickup date: tomorrow in India (orders need a day's notice). YYYY-MM-DD. */
export function earliestDeliveryDate(now = new Date()): string {
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  ist.setDate(ist.getDate() + 1);
  return toISODate(ist);
}

export function latestDeliveryDate(now = new Date()): string {
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  ist.setDate(ist.getDate() + 60);
  return toISODate(ist);
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
