import { site, siteUrl } from "@/config/site";
import { formatDate, formatPrice } from "@/lib/format";
import { FULFILMENT_LABEL, type Order, type OrderItem } from "@/lib/types";

/*
 * The words of every order notification, in one place: the customer's confirmation
 * email, the owner's alert email, and the variables for the two WhatsApp templates
 * (template texts are in SETUP.md, section 11).
 */
export type NotifyOrder = Order & { items: OrderItem[] };

const phones = site.whatsapp.display;

export function orderLink(o: Pick<Order, "id" | "access_token">) {
  return `${siteUrl}/order/${o.id}?t=${o.access_token}`;
}

export function adminLink(o: Pick<Order, "id">) {
  return `${siteUrl}/admin/orders/${o.id}`;
}

export function itemsSummary(items: OrderItem[], withNotes = false) {
  return items
    .map((i) => `${i.quantity} × ${i.product_name} (${i.variant_label})${withNotes && i.note ? ` — "${i.note}"` : ""}`)
    .join(", ");
}

export function addressLine(o: Order) {
  return [o.address_line1, o.address_line2, o.area, o.city, o.state, o.pincode].filter(Boolean).join(", ");
}

/** What happens next, in one sentence. */
export function fulfilmentSummary(o: Order) {
  if (o.fulfilment === "pickup") {
    return `Pickup${o.delivery_date ? ` on ${formatDate(o.delivery_date)}` : ""} from ${site.locality} — we'll share the location and time on WhatsApp.`;
  }
  if (o.fulfilment === "fast_whatsapp") {
    return `Fast delivery to ${o.area || o.city} ${o.pincode} — we'll confirm the time and delivery charge with you on WhatsApp.`;
  }
  return `Courier to ${o.city} ${o.pincode}. ${site.delivery.dispatch}, then delivered in 2–3 days.`;
}

export function paymentSummary(o: Order) {
  if (o.paid_at) return o.is_demo ? "Demo payment (no money taken)" : "Paid online";
  if (o.payment_method === "pay_at_pickup") return "Pay by cash or UPI at pickup";
  if (o.payment_method === "whatsapp") return "Payment to be arranged on WhatsApp";
  return "Payment pending";
}

// ---------- WhatsApp template variables (order must match the approved templates) ----------

/** smd_order_confirmation: {{1}} name {{2}} order no. {{3}} items {{4}} total {{5}} fulfilment {{6}} link {{7}} phone */
export function customerWhatsAppParams(o: NotifyOrder) {
  return [
    o.customer_name.split(" ")[0],
    o.order_number,
    itemsSummary(o.items),
    `${formatPrice(o.total_paise)} (${paymentSummary(o)})`,
    fulfilmentSummary(o),
    orderLink(o),
    phones,
  ];
}

/** smd_new_order_alert: {{1}} order no. {{2}} name {{3}} phone {{4}} items {{5}} total {{6}} type {{7}} address {{8}} link */
export function ownerWhatsAppParams(o: NotifyOrder) {
  return [
    o.order_number,
    o.customer_name,
    `+91 ${o.customer_phone}`,
    itemsSummary(o.items, true),
    `${formatPrice(o.total_paise)} (${paymentSummary(o)})`,
    FULFILMENT_LABEL[o.fulfilment],
    o.fulfilment === "pickup" ? `Pickup ${o.delivery_date ? formatDate(o.delivery_date) : ""}` : addressLine(o),
    adminLink(o),
  ];
}

// ---------- Emails ----------

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const C = { chocolate: "#3b2416", ivory: "#f8f2e7", paper: "#fffaf2", line: "#e6d8c3", muted: "#6e5a4b", caramel: "#8a5c32" };

function itemsTable(o: NotifyOrder) {
  const rows = o.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid ${C.line}">${i.quantity} × ${esc(i.product_name)} <span style="color:${C.muted}">(${esc(i.variant_label)})</span>${
          i.note ? `<br><span style="font-size:13px;color:${C.muted}">“${esc(i.note)}”</span>` : ""
        }</td>
        <td style="padding:8px 0;border-bottom:1px solid ${C.line};text-align:right;white-space:nowrap">${formatPrice(i.line_total_paise)}</td>
      </tr>`,
    )
    .join("");
  const delivery =
    o.fulfilment === "pickup" ? "Free" : o.fulfilment === "fast_whatsapp" ? "Confirmed on WhatsApp" : formatPrice(o.delivery_fee_paise);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">
    ${rows}
    <tr><td style="padding:8px 0">Subtotal</td><td style="padding:8px 0;text-align:right">${formatPrice(o.subtotal_paise)}</td></tr>
    <tr><td style="padding:4px 0">${FULFILMENT_LABEL[o.fulfilment]}</td><td style="padding:4px 0;text-align:right">${delivery}</td></tr>
    <tr><td style="padding:10px 0;font-size:18px;font-weight:bold;border-top:1px solid ${C.line}">Total</td>
        <td style="padding:10px 0;font-size:18px;font-weight:bold;text-align:right;border-top:1px solid ${C.line}">${formatPrice(o.total_paise)}</td></tr>
  </table>`;
}

function layout(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:${C.ivory};font-family:Georgia,'Times New Roman',serif;color:${C.chocolate}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ivory}"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.paper};border:1px solid ${C.line};border-radius:16px">
      <tr><td style="padding:28px 28px 8px;text-align:center">
        <div style="font-size:28px;font-weight:bold;letter-spacing:.5px">${esc(site.name)}</div>
        <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.muted};margin-top:4px">${esc(site.tagline)}</div>
      </td></tr>
      <tr><td style="padding:16px 28px 28px;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">${body}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.muted};margin:16px 0 0">${esc(site.name)} · ${esc(site.locality)}</p>
  </td></tr></table>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${C.chocolate};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">${esc(label)}</a>`;

export function customerEmail(o: NotifyOrder) {
  const subject = `Your SM Delights order ${o.order_number}`;
  const first = o.customer_name.split(" ")[0];
  const contact = `<a href="https://wa.me/${site.whatsapp.e164}" style="color:${C.chocolate};font-weight:bold">${site.whatsapp.display}</a>`;
  const html = layout(
    subject,
    `<p style="font-size:20px;font-family:Georgia,serif;margin:0 0 8px">Thank you, ${esc(first)}!</p>
     <p style="margin:0 0 16px">We've received your order <strong>${esc(o.order_number)}</strong>.</p>
     <p style="margin:0 0 16px;padding:12px 14px;background:${C.ivory};border-radius:12px">${esc(fulfilmentSummary(o))}<br><strong>${esc(paymentSummary(o))}</strong></p>
     ${itemsTable(o)}
     ${o.fulfilment !== "pickup" ? `<p style="margin:16px 0 0;color:${C.muted};font-size:14px">Delivering to: ${esc(addressLine(o))}</p>` : ""}
     <p style="text-align:center;margin:24px 0">${button(orderLink(o), "View your order")}</p>
     <p style="margin:0;padding:14px;border:1px solid ${C.line};border-radius:12px;text-align:center">
       Questions or changes? WhatsApp us on<br>${contact}<br><span style="font-size:13px;color:${C.muted}">${esc(site.hours)}</span>
     </p>`,
  );
  const text = [
    `Thank you, ${first}! We've received your SM Delights order ${o.order_number}.`,
    "",
    fulfilmentSummary(o),
    paymentSummary(o),
    "",
    ...o.items.map((i) => `${i.quantity} x ${i.product_name} (${i.variant_label}) — ${formatPrice(i.line_total_paise)}${i.note ? ` — "${i.note}"` : ""}`),
    `Subtotal: ${formatPrice(o.subtotal_paise)}`,
    `${FULFILMENT_LABEL[o.fulfilment]}: ${o.fulfilment === "fast_whatsapp" ? "confirmed on WhatsApp" : formatPrice(o.delivery_fee_paise)}`,
    `Total: ${formatPrice(o.total_paise)}`,
    o.fulfilment !== "pickup" ? `\nDelivering to: ${addressLine(o)}` : "",
    "",
    `View your order: ${orderLink(o)}`,
    "",
    `Questions or changes? WhatsApp us on ${phones} (${site.hours}).`,
  ].join("\n");
  return { subject, html, text };
}

export function ownerEmail(o: NotifyOrder) {
  const subject = `New order ${o.order_number} — ${formatPrice(o.total_paise)} · ${FULFILMENT_LABEL[o.fulfilment]}`;
  const details = `<p style="margin:0 0 16px"><strong>${esc(o.customer_name)}</strong> · <a href="tel:+91${esc(o.customer_phone)}">+91 ${esc(o.customer_phone)}</a> · ${esc(o.customer_email ?? "")}</p>
     <p style="margin:0 0 16px;padding:12px 14px;background:${C.ivory};border-radius:12px">${esc(FULFILMENT_LABEL[o.fulfilment])} — ${esc(o.fulfilment === "pickup" ? fulfilmentSummary(o) : addressLine(o))}<br><strong>${esc(paymentSummary(o))}</strong></p>`;
  const html = layout(
    subject,
    `<p style="font-size:20px;font-family:Georgia,serif;margin:0 0 12px">New order ${esc(o.order_number)}</p>
     ${details}
     ${itemsTable(o)}
     ${o.customer_note ? `<p style="margin:16px 0 0;padding:12px;background:${C.ivory};border-radius:12px"><strong>Customer note:</strong> ${esc(o.customer_note)}</p>` : ""}
     <p style="text-align:center;margin:24px 0 0">${button(adminLink(o), "Open in admin")}</p>`,
  );
  const text = [
    `New order ${o.order_number}`,
    `${o.customer_name} · +91 ${o.customer_phone} · ${o.customer_email ?? ""}`,
    `${FULFILMENT_LABEL[o.fulfilment]} — ${o.fulfilment === "pickup" ? fulfilmentSummary(o) : addressLine(o)}`,
    paymentSummary(o),
    "",
    ...o.items.map((i) => `${i.quantity} x ${i.product_name} (${i.variant_label})${i.note ? ` — "${i.note}"` : ""}`),
    `Total: ${formatPrice(o.total_paise)}`,
    o.customer_note ? `Customer note: ${o.customer_note}` : "",
    "",
    `Open in admin: ${adminLink(o)}`,
  ].join("\n");
  return { subject, html, text };
}

/** Pre-filled WhatsApp message a fast-delivery customer sends to the shop. */
export function fastDeliveryWhatsAppText(o: NotifyOrder) {
  return [
    `Hi SM Delights! I'd like fast delivery for order ${o.order_number}.`,
    "",
    ...o.items.map((i) => `• ${i.quantity} × ${i.product_name} (${i.variant_label})${i.note ? ` — ${i.note}` : ""}`),
    `Subtotal: ${formatPrice(o.subtotal_paise)}`,
    "",
    `Name: ${o.customer_name}`,
    `Phone: +91 ${o.customer_phone}`,
    `Email: ${o.customer_email ?? ""}`,
    `Address: ${addressLine(o)}`,
    o.customer_note ? `Note: ${o.customer_note}` : "",
  ]
    .filter((l, i, all) => l !== "" || all[i - 1] !== "")
    .join("\n");
}
