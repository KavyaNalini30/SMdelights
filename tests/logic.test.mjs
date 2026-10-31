// Unit tests for the checkout's pure logic, run against the real project source.
// Run with: npm test   (uses Node's built-in test runner and TypeScript support, Node 22.18+)
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

register(pathToFileURL(path.join(import.meta.dirname, "hooks.mjs")).href);
process.env.RAZORPAY_KEY_ID = "rzp_test_123";
process.env.RAZORPAY_KEY_SECRET = "test_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "hook_secret";

const root = process.cwd();
const mod = (p) => import(pathToFileURL(path.join(root, p)).href);
const { zoneForPincode, earliestDeliveryDate, courierFeePaise, cartWeightGrams, fastDeliveryAllowed, DEFAULT_WEIGHT_G } = await mod("lib/delivery.ts");
const { checkoutSchema, phoneSchema, enquirySchema } = await mod("lib/validation.ts");
const { toWhatsAppNumber } = await mod("lib/notify/whatsapp.ts");
const rz = await mod("lib/razorpay.ts");

// Same zones as supabase/07_delivery_and_notifications.sql.
const zone = (id, name, prefixes, extra = {}) => ({
  id, name, pincode_prefixes: prefixes, description: null, sort: 0, is_local: false, allows_fast: false,
  base_weight_g: 500, base_fee_paise: null, step_weight_g: 500, step_fee_paise: null, ...extra,
});
const zones = [
  zone("c", "Chennai", ["600"], { is_local: true, allows_fast: true, base_fee_paise: 6000, step_fee_paise: 3000 }),
  zone("s", "Chennai suburbs", ["601", "602", "603"], { is_local: true, allows_fast: true }),
  zone("t", "Tamil Nadu", ["60", "61", "62", "63", "64"]),
  zone("b", "Bengaluru", ["560"]),
  zone("k", "Karnataka", ["56", "57", "58", "59"]),
  zone("e", "Kerala", ["67", "68", "69"]),
  zone("a", "Andhra Pradesh", ["51", "52", "53"]),
  zone("g", "Telangana", ["50"]),
];

test("pincode -> zone uses the longest matching prefix", () => {
  assert.equal(zoneForPincode("600099", zones)?.name, "Chennai"); // Kolathur
  assert.equal(zoneForPincode("600127", zones)?.name, "Chennai"); // Tambaram side
  assert.equal(zoneForPincode("603103", zones)?.name, "Chennai suburbs"); // Kelambakkam
  assert.equal(zoneForPincode("602105", zones)?.name, "Chennai suburbs"); // Sriperumbudur
  assert.equal(zoneForPincode("604001", zones)?.name, "Tamil Nadu"); // Tindivanam
  assert.equal(zoneForPincode("641001", zones)?.name, "Tamil Nadu"); // Coimbatore
  assert.equal(zoneForPincode("605001", zones)?.name, "Tamil Nadu"); // Puducherry -> treated as TN
  assert.equal(zoneForPincode("560001", zones)?.name, "Bengaluru");
  assert.equal(zoneForPincode("575001", zones)?.name, "Karnataka"); // Mangaluru
  assert.equal(zoneForPincode("682001", zones)?.name, "Kerala"); // Kochi
  assert.equal(zoneForPincode("695001", zones)?.name, "Kerala"); // Thiruvananthapuram
  assert.equal(zoneForPincode("520001", zones)?.name, "Andhra Pradesh"); // Vijayawada
  assert.equal(zoneForPincode("530001", zones)?.name, "Andhra Pradesh"); // Visakhapatnam
  assert.equal(zoneForPincode("500001", zones)?.name, "Telangana"); // Hyderabad
  assert.equal(zoneForPincode("110001", zones), null); // Delhi
  assert.equal(zoneForPincode("400001", zones), null); // Mumbai
  assert.equal(zoneForPincode("60009", zones), null); // too short
  assert.equal(zoneForPincode("060099", zones), null); // can't start with 0
});

test("courier charge: first slab, then every started extra slab", () => {
  const chennai = zones[0]; // ₹60 for 500 g, ₹30 per extra 500 g
  assert.equal(courierFeePaise(chennai, 120), 6000);
  assert.equal(courierFeePaise(chennai, 500), 6000); // exactly the first slab
  assert.equal(courierFeePaise(chennai, 501), 9000); // 1 g over -> one extra slab
  assert.equal(courierFeePaise(chennai, 1000), 9000);
  assert.equal(courierFeePaise(chennai, 1200), 12000); // 700 g extra -> 2 slabs
  assert.equal(courierFeePaise({ ...chennai, base_weight_g: 250, step_weight_g: 1000 }, 1300), 6000 + 2 * 3000);
  assert.equal(courierFeePaise({ ...chennai, base_fee_paise: 0, step_fee_paise: 0 }, 5000), 0); // free
  assert.equal(courierFeePaise(zones[1], 300), null); // rates not set
  assert.equal(courierFeePaise({ ...chennai, step_fee_paise: null }, 400), 6000); // within first slab
  assert.equal(courierFeePaise({ ...chennai, step_fee_paise: null }, 900), null); // needs the missing step price
});

test("cart weight uses each size's weight, with a default when missing", () => {
  assert.equal(cartWeightGrams([{ weightGrams: 120, qty: 3 }, { weightGrams: 600, qty: 1 }]), 960);
  assert.equal(cartWeightGrams([{ weightGrams: null, qty: 2 }]), 2 * DEFAULT_WEIGHT_G);
  assert.equal(cartWeightGrams([]), 0);
});

test("fast delivery only where the zone allows it (Chennai and suburbs)", () => {
  assert.equal(fastDeliveryAllowed(zoneForPincode("600099", zones)), true);
  assert.equal(fastDeliveryAllowed(zoneForPincode("603103", zones)), true);
  assert.equal(fastDeliveryAllowed(zoneForPincode("641001", zones)), false);
  assert.equal(fastDeliveryAllowed(zoneForPincode("560001", zones)), false);
  assert.equal(fastDeliveryAllowed(null), false);
});

test("WhatsApp numbers are normalised to 91XXXXXXXXXX", () => {
  assert.equal(toWhatsAppNumber("90923 22597"), "919092322597");
  assert.equal(toWhatsAppNumber("+91 90923-22597"), "919092322597");
  assert.equal(toWhatsAppNumber("09092322597"), "919092322597");
  assert.equal(toWhatsAppNumber("12345"), null);
  assert.equal(toWhatsAppNumber(undefined), null);
});

test("earliest date is tomorrow in India, even late at night UTC", () => {
  // 20:00 UTC on 24 Oct = 01:30 IST on 25 Oct -> earliest is 26 Oct.
  assert.equal(earliestDeliveryDate(new Date("2026-10-24T20:00:00Z")), "2026-10-26");
  assert.equal(earliestDeliveryDate(new Date("2026-10-24T05:00:00Z")), "2026-10-25");
});

test("phone numbers are normalised to 10 digits", () => {
  for (const input of ["9514670173", "+91 95146 70173", "+919514670173", "095146-70173", "91 9514670173"]) {
    assert.equal(phoneSchema.parse(input), "9514670173", input);
  }
  for (const bad of ["12345", "5514670173", "95146701731", "abcdefghij"]) {
    assert.equal(phoneSchema.safeParse(bad).success, false, bad);
  }
});

const base = {
  lines: [{ variantId: crypto.randomUUID(), qty: 2 }],
  name: "Asha",
  phone: "9514670173",
  email: "asha@example.com",
  fulfilment: "pickup",
  deliveryDate: "2026-11-01",
  payment: "online",
};
const address = { line1: "12 Main Rd", city: "Chennai", state: "Tamil Nadu", pincode: "600099" };

test("checkout input: valid pickup order passes", () => {
  const r = checkoutSchema.safeParse(base);
  assert.equal(r.success, true, JSON.stringify(r.error?.issues));
  assert.equal(r.data.whatsappUpdates, true); // opted in unless unticked
});

test("checkout input: email is required", () => {
  const { email, ...noEmail } = base;
  assert.ok(email);
  assert.equal(checkoutSchema.safeParse(noEmail).success, false);
  assert.equal(checkoutSchema.safeParse({ ...base, email: "" }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...base, email: "not-an-email" }).success, false);
  assert.equal(checkoutSchema.parse({ ...base, email: " Asha@Example.com " }).email, "asha@example.com");
});

test("checkout input: courier and fast delivery need an address but no date; pickup needs a date", () => {
  for (const fulfilment of ["delivery", "fast_whatsapp"]) {
    assert.equal(checkoutSchema.safeParse({ ...base, fulfilment, deliveryDate: undefined }).success, false, `${fulfilment} without address`);
    const r = checkoutSchema.safeParse({ ...base, fulfilment, deliveryDate: undefined, address });
    assert.equal(r.success, true, `${fulfilment}: ${JSON.stringify(r.error?.issues)}`);
  }
  assert.equal(checkoutSchema.safeParse({ ...base, deliveryDate: "" }).success, false); // pickup without date
});

test("checkout input: prices or totals sent by the browser are ignored", () => {
  const r = checkoutSchema.parse({ ...base, total: 1, lines: [{ ...base.lines[0], unitPrice: 1 }] });
  assert.equal("total" in r, false);
  assert.equal("unitPrice" in r.lines[0], false);
});

test("checkout input: delivery needs an address; pay-at-pickup only for pickup", () => {
  assert.equal(checkoutSchema.safeParse({ ...base, fulfilment: "delivery" }).success, false);
  const r = checkoutSchema.safeParse({ ...base, fulfilment: "delivery", payment: "pay_at_pickup", address });
  assert.equal(r.success, false);
  assert.ok(r.error.issues.some((i) => i.path[0] === "payment"));
});

test("checkout input: rejects bad quantities, empty carts, honeypot", () => {
  assert.equal(checkoutSchema.safeParse({ ...base, lines: [] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...base, lines: [{ ...base.lines[0], qty: 0 }] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...base, lines: [{ ...base.lines[0], qty: 51 }] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...base, lines: [{ variantId: "not-a-uuid", qty: 1 }] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...base, website: "spam.example" }).success, false);
});

test("enquiry input: optional fields may be blank", () => {
  const r = enquirySchema.parse({ name: "Corp Ltd", phone: "9876543210", email: "", eventDate: "", items: ["Brownies"] });
  assert.equal(r.email, undefined);
  assert.equal(r.eventDate, undefined);
});

test("Razorpay payment signature: genuine passes, tampered fails", () => {
  const sig = crypto.createHmac("sha256", "test_secret").update("order_ABC|pay_XYZ").digest("hex");
  assert.equal(rz.verifyPaymentSignature("order_ABC", "pay_XYZ", sig), true);
  assert.equal(rz.verifyPaymentSignature("order_ABC", "pay_OTHER", sig), false);
  assert.equal(rz.verifyPaymentSignature("order_ABC", "pay_XYZ", sig.slice(0, -1) + "0"), false);
  assert.equal(rz.verifyPaymentSignature("order_ABC", "pay_XYZ", "short"), false);
});

test("Razorpay webhook signature: computed over the raw body", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount: 14900 } } } });
  const sig = crypto.createHmac("sha256", "hook_secret").update(body).digest("hex");
  assert.equal(rz.verifyWebhookSignature(body, sig), true);
  assert.equal(rz.verifyWebhookSignature(body.replace("14900", "100"), sig), false);
  assert.equal(rz.verifyWebhookSignature(body, ""), false);
});

test("order emails: customer text is escaped, owner phone numbers are included", async () => {
  const { customerEmail, ownerEmail, customerWhatsAppParams } = await mod("lib/notify/messages.ts");
  const order = {
    id: crypto.randomUUID(), access_token: crypto.randomUUID(), order_number: "SMD-1042",
    customer_name: "<script>Asha Kumar", customer_phone: "9876543210", customer_email: "asha@example.com",
    fulfilment: "delivery", address_line1: "12 Main Rd", address_line2: null, area: null, city: "Kochi", state: "Kerala", pincode: "682001",
    delivery_date: null, subtotal_paise: 29800, delivery_fee_paise: 9000, total_paise: 38800, payment_method: "razorpay",
    paid_at: "2026-11-01T10:00:00Z", is_demo: false, customer_note: "<b>hi</b>", whatsapp_opt_in: true,
    items: [{ id: "1", product_name: "KitKat Brownie", variant_label: "Per piece", unit_price_paise: 10000, quantity: 2, line_total_paise: 20000, note: "<img>" }],
  };
  const c = customerEmail(order);
  assert.ok(!c.html.includes("<script>") && c.html.includes("&lt;script&gt;"));
  assert.ok(!c.html.includes("<img>"));
  assert.ok(c.html.includes("95146 70173") && c.html.includes("90923 22597"));
  assert.ok(c.text.includes("95146 70173"));
  assert.ok(c.html.includes(`/order/${order.id}?t=${order.access_token}`));
  assert.ok(!ownerEmail(order).html.includes("<b>hi</b>"));
  const params = customerWhatsAppParams(order);
  assert.equal(params.length, 7); // must match the {{1}}–{{7}} of the approved template
  assert.equal(params[1], "SMD-1042");
});

test("demo mode is off when a key id is set", () => {
  assert.equal(rz.isDemoMode, false);
  assert.equal(rz.razorpayKeyId, "rzp_test_123");
});
