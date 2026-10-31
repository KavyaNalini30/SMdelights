import "server-only";

/*
 * WhatsApp through the Meta WhatsApp Cloud API, using pre-approved message templates
 * (businesses may only start a conversation with a template). Swap this file to move
 * to a provider such as Interakt or AiSensy — the rest of the app only calls
 * sendWhatsAppTemplate().
 * Not set up = WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID empty: messages are skipped.
 */
const token = process.env.WHATSAPP_TOKEN ?? "";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";
const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

export const isWhatsAppConfigured = Boolean(token && phoneNumberId);

/** Template names — they must match the templates approved in WhatsApp Manager exactly. */
export const WHATSAPP_TEMPLATES = {
  customerOrder: "smd_order_confirmation",
  ownerAlert: "smd_new_order_alert",
} as const;

/** Indian number in any format -> "91XXXXXXXXXX" (what the API expects). null if not a valid mobile. */
export function toWhatsAppNumber(phone: string | undefined | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `91${local}` : null;
}

/** Template variables may not contain new lines, tabs or runs of spaces. */
function clean(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 900) || "-";
}

export async function sendWhatsAppTemplate(to: string, template: string, params: string[]) {
  if (!isWhatsAppConfigured) throw new Error("WhatsApp is not set up (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID empty)");
  const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: language },
        components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: clean(p) })) }],
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${data.error?.message ?? "request failed"}`);
  return { id: data.messages?.[0]?.id ?? null };
}
