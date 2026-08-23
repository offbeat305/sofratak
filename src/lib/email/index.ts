import "server-only";

export type EmailAttachment = {
  filename: string;
  /** raw text content (e.g. CSV) — base64-encoded before sending */
  content: string;
};

/**
 * Email adapter (constitution: Resend). Console fallback until
 * RESEND_API_KEY exists — lead notifications still print to server logs
 * and leads are always persisted regardless (see lib/leads.ts).
 */
export interface EmailChannel {
  send(input: {
    subject: string;
    text: string;
    /** Branded campaign sends (Phase 5) — falls back to `text` when omitted. */
    html?: string;
    to?: string;
    attachments?: EmailAttachment[];
  }): Promise<void>;
}

const LEADS_EMAIL = process.env.LEADS_EMAIL ?? "offbeat305@gmail.com";

class ConsoleEmailChannel implements EmailChannel {
  async send({
    subject,
    text,
    html,
    to = LEADS_EMAIL,
    attachments,
  }: {
    subject: string;
    text: string;
    html?: string;
    to?: string;
    attachments?: EmailAttachment[];
  }) {
    const attachmentNote = attachments?.length
      ? `\n[attachments: ${attachments.map((a) => a.filename).join(", ")}]`
      : "";
    const htmlNote = html ? " [html]" : "";
    console.log(`[email → ${to}] ${subject}${htmlNote}\n${text}${attachmentNote}`);
  }
}

class ResendEmailChannel implements EmailChannel {
  constructor(private apiKey: string) {}
  async send({
    subject,
    text,
    html,
    to = LEADS_EMAIL,
    attachments,
  }: {
    subject: string;
    text: string;
    html?: string;
    to?: string;
    attachments?: EmailAttachment[];
  }) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "Sofratak <onboarding@resend.dev>",
          to: [to],
          subject,
          text,
          ...(html && { html }),
          ...(attachments?.length && {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content, "utf8").toString("base64"),
            })),
          }),
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
