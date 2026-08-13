import "server-only";

/**
 * Email adapter (constitution: Resend). Console fallback until
 * RESEND_API_KEY exists — lead notifications still print to server logs
 * and leads are always persisted regardless (see lib/leads.ts).
 */
export interface EmailChannel {
  send(input: { subject: string; text: string }): Promise<void>;
}

const LEADS_EMAIL = process.env.LEADS_EMAIL ?? "offbeat305@gmail.com";

class ConsoleEmailChannel implements EmailChannel {
  async send({ subject, text }: { subject: string; text: string }) {
    console.log(`[email → ${LEADS_EMAIL}] ${subject}\n${text}`);
  }
}

class ResendEmailChannel implements EmailChannel {
  constructor(private apiKey: string) {}
  async send({ subject, text }: { subject: string; text: string }) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "Sofratak <onboarding@resend.dev>",
          to: [LEADS_EMAIL],
          subject,
          text,
        }),
      });
      if (!res.ok) console.error("[email] resend failed:", await res.text());
    } catch (err) {
      console.error("[email] resend unreachable", err);
    }
  }
}

export function getEmailChannel(): EmailChannel {
  const key = process.env.RESEND_API_KEY;
  return key ? new ResendEmailChannel(key) : new ConsoleEmailChannel();
}
