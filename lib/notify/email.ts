import "server-only";

/*
 * Email through Resend (https://resend.com), called over its REST API.
 * Not set up = RESEND_API_KEY empty: emails are skipped (and logged), checkout carries on.
 * Until a domain is verified in Resend, EMAIL_FROM must stay on onboarding@resend.dev and
 * Resend only delivers to the email address of the Resend account itself.
 */
const apiKey = process.env.RESEND_API_KEY ?? "";
const from = process.env.EMAIL_FROM || "SM Delights <onboarding@resend.dev>";

export const isEmailConfigured = Boolean(apiKey);

export async function sendEmail(message: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  if (!isEmailConfigured) throw new Error("Email is not set up (RESEND_API_KEY is empty)");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) throw new Error(`Resend ${res.status}: ${data.message ?? "request failed"}`);
  return { id: data.id ?? null };
}
