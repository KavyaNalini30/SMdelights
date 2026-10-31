// Shapes of the database rows the app works with (see supabase/01_schema.sql).

export type OrderStatus = "pending" | "paid" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
/** "delivery" = standard courier; "fast_whatsapp" = same-day in Chennai, arranged on WhatsApp. */
export type Fulfilment = "delivery" | "pickup" | "fast_whatsapp";
export type PaymentMethod = "razorpay" | "pay_at_pickup" | "demo" | "whatsapp";
export type EnquiryStatus = "new" | "contacted" | "quoted" | "confirmed" | "closed";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  sort: number;
  is_enquiry_only: boolean;
};

export type Variant = {
  id: string;
  label: string;
  price_paise: number;
  weight_grams: number | null;
  sort: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  images: string[];
  shelf_life: string | null;
  is_bestseller: boolean;
  chennai_only: boolean;
  allows_note: boolean;
  note_prompt: string | null;
  sort: number;
  category: { slug: string; name: string };
  variants: Variant[];
};

export type DeliveryZone = {
  id: string;
  name: string;
  description: string | null;
  pincode_prefixes: string[];
  /** Courier slabs: base_fee for the first base_weight_g, step_fee per started step_weight_g after. NULL = not set. */
  base_weight_g: number;
  base_fee_paise: number | null;
  step_weight_g: number;
  step_fee_paise: number | null;
  is_local: boolean;
  allows_fast: boolean;
  sort: number;
};

export type Review = {
  id: string;
  customer_name: string;
  rating: number;
  body: string;
  image_url: string | null;
  source: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  product_name: string;
  variant_label: string;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
  note: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  access_token: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  fulfilment: Fulfilment;
  address_line1: string | null;
  address_line2: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  zone_name: string | null;
  delivery_date: string | null;
  courier_weight_g: number | null;
  whatsapp_opt_in: boolean;
  subtotal_paise: number;
  delivery_fee_paise: number;
  total_paise: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  paid_at: string | null;
  razorpay_order_id: string | null;
  is_demo: boolean;
  customer_note: string | null;
  admin_note: string | null;
  created_at: string;
};

export const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  pickup: "Pickup",
  delivery: "Courier delivery",
  fast_whatsapp: "Fast delivery (WhatsApp)",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
