// Business details shown across the site. Edit here — everything else reads from this file.
// Values come from the client's "Client Input" document unless marked TODO.

export const site = {
  name: "SM Delights",
  tagline: "where every bite delights",
  description:
    "Home-made brownies, tea cakes, cookies and drinks from Kolathur, Chennai. Delivery across Chennai; shipping across Tamil Nadu and Bengaluru.",
  locality: "Kolathur, Chennai",

  // Both numbers are displayed equally (client request).
  whatsappNumbers: [
    { display: "95146 70173", e164: "919514670173" },
    { display: "90923 22597", e164: "919092322597" },
  ],
  hours: "10:00 AM – 9:00 PM",

  // TODO(client): Instagram handle, contact email.
  instagramUrl: "",
  email: "",

  delivery: {
    chennai: "All areas of Chennai. Order at least one day in advance for next-day delivery.",
    shipping: "Shipping across Tamil Nadu and Bengaluru for travel-friendly products — usually 1–2 working days (2–3 during holidays).",
  },
} as const;

export const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/shop/gift-boxes", label: "Gifting" },
  { href: "/corporate", label: "Bulk & Corporate" },
  { href: "/contact", label: "Contact" },
] as const;

/** wa.me link with an optional pre-filled message. */
export function whatsappLink(e164: string = site.whatsappNumbers[0].e164, text?: string) {
  const url = `https://wa.me/${e164}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
