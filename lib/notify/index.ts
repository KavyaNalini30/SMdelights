import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailConfigured, sendEmail } from "./email";
import { customerEmail, customerWhatsAppParams, ownerEmail, ownerWhatsAppParams, type NotifyOrder } from "./messages";
import { isWhatsAppConfigured, sendWhatsAppTemplate, toWhatsAppNumber, WHATSAPP_TEMPLATES } from "./whatsapp";

/*
 * Order notifications: confirmation to the customer and an alert to the owner, each by
 * email and WhatsApp. Every attempt is recorded in order_notifications (one row per
 * order / audience / channel), which also makes sending idempotent: the payment check,
 * the webhook and a retry can all call notifyOrderPlaced() and each message goes once.
 * Never throws — a notification problem must not break checkout.
 */
export type Audience = "customer" | "owner";
export type Channel = "email" | "whatsapp";

const ownerEmailAddress = process.env.OWNER_EMAIL ?? "";
const ownerWhatsApp = toWhatsAppNumber(process.env.OWNER_WHATSAPP);

const ALL: [Audience, Channel][] = [
  ["customer", "email"],
  ["customer", "whatsapp"],
  ["owner", "email"],
  ["owner", "whatsapp"],
];

async function loadOrder(orderId: string) {
  const { data } = await createAdminClient().from("orders").select("*, items:order_items(*)").eq("id", orderId).maybeSingle();
  return (data as NotifyOrder | null) ?? null;
}

/** Why a message can't be sent (not set up, no opt-in…), or null if it can. */
function skipReason(order: NotifyOrder, audience: Audience, channel: Channel): string | null {
  if (channel === "email") {
    if (!isEmailConfigured) return "Email not set up (RESEND_API_KEY)";
    if (audience === "owner" && !ownerEmailAddress) return "OWNER_EMAIL not set";
    if (audience === "customer" && !order.customer_email) return "No customer email";
  } else {
    if (!isWhatsAppConfigured) return "WhatsApp not set up (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)";
    if (audience === "owner" && !ownerWhatsApp) return "OWNER_WHATSAPP not set";
    if (audience === "customer" && !order.whatsapp_opt_in) return "Customer didn't opt in to WhatsApp updates";
  }
  return null;
}

async function deliver(order: NotifyOrder, audience: Audience, channel: Channel) {
  if (channel === "email") {
    const message = audience === "customer" ? customerEmail(order) : ownerEmail(order);
    const to = audience === "customer" ? order.customer_email! : ownerEmailAddress;
    // Customers who reply to the confirmation reach the owner.
    return sendEmail({ to, ...message, replyTo: audience === "customer" ? ownerEmailAddress || undefined : order.customer_email ?? undefined });
  }
  return audience === "customer"
    ? sendWhatsAppTemplate(toWhatsAppNumber(order.customer_phone)!, WHATSAPP_TEMPLATES.customerOrder, customerWhatsAppParams(order))
    : sendWhatsAppTemplate(ownerWhatsApp!, WHATSAPP_TEMPLATES.ownerAlert, ownerWhatsAppParams(order));
}

async function sendOne(order: NotifyOrder, audience: Audience, channel: Channel, retry: boolean) {
  const db = createAdminClient();
  const key = { order_id: order.id, audience, channel };

  if (retry) {
    const { data: row } = await db.from("order_notifications").select("attempts").match(key).maybeSingle();
    if (row) await db.from("order_notifications").update({ status: "sending", attempts: row.attempts + 1, detail: null }).match(key);
    else await db.from("order_notifications").insert(key);
  } else {
    // Claim the slot; if a row already exists, this message was already handled.
    const { data: claimed, error } = await db
      .from("order_notifications")
      .upsert(key, { onConflict: "order_id,audience,channel", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error(`notification claim failed (${audience}/${channel})`, error.message);
      return;
    }
    if (!claimed?.length) return;
  }

  const reason = skipReason(order, audience, channel);
  if (reason) {
    await db.from("order_notifications").update({ status: "skipped", detail: reason }).match(key);
    return;
  }
  try {
    const { id } = await deliver(order, audience, channel);
    await db.from("order_notifications").update({ status: "sent", provider_id: id, detail: null }).match(key);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`notification failed (${order.order_number} ${audience}/${channel}):`, detail);
    await db.from("order_notifications").update({ status: "failed", detail: detail.slice(0, 500) }).match(key);
  }
}

/** Sends every order notification that hasn't been sent yet. Safe to call more than once. */
export async function notifyOrderPlaced(orderId: string) {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;
    await Promise.all(ALL.map(([audience, channel]) => sendOne(order, audience, channel, false)));
  } catch (e) {
    console.error("notifyOrderPlaced failed", e);
  }
}

/** Admin "Resend" button: sends one message again, whatever happened before. */
export async function resendNotification(orderId: string, audience: Audience, channel: Channel) {
  const order = await loadOrder(orderId);
  if (!order) throw new Error("Order not found");
  await sendOne(order, audience, channel, true);
}
