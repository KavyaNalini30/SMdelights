// All money in the app is integer paise (₹1 = 100 paise) to avoid floating-point errors.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(paise: number) {
  return inr.format(paise / 100);
}

/** 450 -> "450 g", 1250 -> "1.25 kg". */
export function formatWeight(grams: number) {
  return grams < 1000 ? `${grams} g` : `${+(grams / 1000).toFixed(2)} kg`;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Today's date in India as YYYY-MM-DD. */
export function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** ISO timestamp `days` days ago. */
export function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString();
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
