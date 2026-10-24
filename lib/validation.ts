import { z } from "zod";
import { PINCODE_RE } from "@/lib/delivery";

/** Indian mobile: accepts "+91 98765 43210", "098765-43210" … and normalises to 10 digits. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, "").replace(/^(\+?91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((s) => (s ? s : undefined));

export const cartLineSchema = z.object({
  variantId: z.uuid(),
  qty: z.number().int().min(1).max(50),
  note: optionalText(200),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(3, "Enter your house / flat and street").max(200),
  line2: optionalText(200),
  area: optionalText(100),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Enter your state").max(80),
  pincode: z.string().trim().regex(PINCODE_RE, "Enter a valid 6-digit pincode"),
});

export const checkoutSchema = z
  .object({
    lines: z.array(cartLineSchema).min(1, "Your cart is empty").max(40),
    name: z.string().trim().min(2, "Enter your name").max(100),
    phone: phoneSchema,
    email: z.union([z.literal(""), z.email("Enter a valid email")]).optional().transform((s) => s || undefined),
    fulfilment: z.enum(["delivery", "pickup"]),
    address: addressSchema.optional(),
    deliveryDate: z.iso.date("Choose a date"),
    payment: z.enum(["online", "pay_at_pickup"]),
    note: optionalText(500),
    saveAddress: z.boolean().optional(),
    website: z.string().max(0).optional(), // honeypot — real people leave it empty
  })
  .superRefine((v, ctx) => {
    if (v.fulfilment === "delivery" && !v.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Enter a delivery address" });
    }
    if (v.fulfilment === "delivery" && v.payment === "pay_at_pickup") {
      ctx.addIssue({ code: "custom", path: ["payment"], message: "Pay at pickup is only available for pickup orders" });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: phoneSchema,
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional().transform((s) => s || undefined),
  company: optionalText(150),
  eventDate: z.union([z.literal(""), z.iso.date()]).optional().transform((s) => s || undefined),
  quantity: optionalText(100),
  items: z.array(z.string().max(60)).max(10).default([]),
  message: optionalText(2000),
  website: z.string().max(0).optional(),
});

export const reviewSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1000),
  website: z.string().max(0).optional(),
});

/** First error message per field, for showing next to form inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
