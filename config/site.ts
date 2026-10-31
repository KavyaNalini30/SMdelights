// Business details shown across the site. Edit here — everything else reads from this file.
// Values come from the client's "Client Input" document unless marked TODO.

export const site = {
  name: "SM Delights",
  tagline: "where every bite delights",
  description:
    "Home-made brownies, tea cakes, cookies and drinks from Kolathur, Chennai. Courier delivery across Tamil Nadu, Karnataka, Kerala, Andhra Pradesh and Telangana; same-day delivery in Chennai.",
  locality: "Kolathur, Chennai",

  // The one WhatsApp number for orders and questions. Not shown as text on the site (client request),
  // except in the policy pages' contact details, which Razorpay requires.
  whatsapp: { display: "90923 22597", e164: "919092322597" },
  hours: "10:00 AM – 9:00 PM",

  // TODO(client): Instagram handle, contact email.
  instagramUrl: "",
  email: "",

  // Policy pages highlight every statement the client still has to confirm.
  // Set to true once the client has reviewed /policies/* and the <Confirm> text is final.
  policiesReviewed: false,
  policiesUpdated: "24 October 2026",

  delivery: {
    states: "Tamil Nadu, Karnataka, Kerala, Andhra Pradesh and Telangana",
    dispatch: "Dispatched within 1–2 days",
    courier: "Delivered by ST Courier in 2–3 days",
    fast: "Same-day delivery is possible in Chennai and nearby areas — arranged with us on WhatsApp.",
    perishables: "Drinks, London Cake and the combo don't travel by courier — choose pickup or fast delivery in Chennai.",
  },
} as const;

export const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/shop/gift-boxes", label: "Gifting" },
  { href: "/corporate", label: "Bulk & Corporate" },
  { href: "/contact", label: "Contact" },
] as const;

/** wa.me link with an optional pre-filled message. */
export function whatsappLink(e164: string = site.whatsapp.e164, text?: string) {
  const url = `https://wa.me/${e164}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
