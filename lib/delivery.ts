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

/** Used for any product size whose packed weight hasn't been entered yet. */
export const DEFAULT_WEIGHT_G = 500;

/** Total packed weight of a cart in grams. */
export function cartWeightGrams(lines: { weightGrams: number | null | undefined; qty: number }[]): number {
  return lines.reduce((sum, l) => sum + (l.weightGrams || DEFAULT_WEIGHT_G) * l.qty, 0);
}

/**
 * Courier charge for a parcel: the base fee covers the first base_weight_g, then
 * step_fee for every started step_weight_g above that. null = rates not set for the zone.
 */
export function courierFeePaise(
  zone: Pick<DeliveryZone, "base_weight_g" | "base_fee_paise" | "step_weight_g" | "step_fee_paise">,
  weightGrams: number,
): number | null {
  if (zone.base_fee_paise == null) return null;
  const extra = Math.max(0, weightGrams - zone.base_weight_g);
  if (!extra) return zone.base_fee_paise;
  if (zone.step_fee_paise == null) return null;
  return zone.base_fee_paise + Math.ceil(extra / zone.step_weight_g) * zone.step_fee_paise;
}

/** Same-day fast delivery (arranged on WhatsApp) is only offered where the zone allows it — Chennai. */
export function fastDeliveryAllowed(zone: DeliveryZone | null): boolean {
  return Boolean(zone?.allows_fast);
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
