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
const { zoneForPincode, earliestDeliveryDate } = await mod("lib/delivery.ts");
const { checkoutSchema, phoneSchema, enquirySchema } = await mod("lib/validation.ts");
const rz = await mod("lib/razorpay.ts");

const zones = [
  { id: "c", name: "Chennai", pincode_prefixes: ["600"], fee_paise: 6000, is_local: true, sort: 1, description: null },
  { id: "t", name: "Rest of Tamil Nadu", pincode_prefixes: ["60", "61", "62", "63", "64"], fee_paise: null, is_local: false, sort: 2, description: null },
  { id: "b", name: "Bengaluru", pincode_prefixes: ["560"], fee_paise: 12000, is_local: false, sort: 3, description: null },
];

test("pincode -> zone uses the longest matching prefix", () => {
  assert.equal(zoneForPincode("600099", zones)?.name, "Chennai"); // Kolathur
  assert.equal(zoneForPincode("603103", zones)?.name, "Rest of Tamil Nadu"); // Kelambakkam
  assert.equal(zoneForPincode("641001", zones)?.name, "Rest of Tamil Nadu"); // Coimbatore
  assert.equal(zoneForPincode("560001", zones)?.name, "Bengaluru");
  assert.equal(zoneForPincode("110001", zones), null); // Delhi
  assert.equal(zoneForPincode("60009", zones), null); // too short
  assert.equal(zoneForPincode("060099", zones), null); // can't start with 0
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
  fulfilment: "pickup",
  deliveryDate: "2026-11-01",
  payment: "online",
};

test("checkout input: valid pickup order passes", () => {
  const r = checkoutSchema.safeParse(base);
  assert.equal(r.success, true, JSON.stringify(r.error?.issues));
});

test("checkout input: prices or totals sent by the browser are ignored", () => {
  const r = checkoutSchema.parse({ ...base, total: 1, lines: [{ ...base.lines[0], unitPrice: 1 }] });
  assert.equal("total" in r, false);
  assert.equal("unitPrice" in r.lines[0], false);
});

test("checkout input: delivery needs an address; pay-at-pickup only for pickup", () => {
  assert.equal(checkoutSchema.safeParse({ ...base, fulfilment: "delivery" }).success, false);
  const r = checkoutSchema.safeParse({
    ...base,
    fulfilment: "delivery",
    payment: "pay_at_pickup",
    address: { line1: "12 Main Rd", city: "Chennai", state: "Tamil Nadu", pincode: "600099" },
  });
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

test("demo mode is off when a key id is set", () => {
  assert.equal(rz.isDemoMode, false);
  assert.equal(rz.razorpayKeyId, "rzp_test_123");
});
