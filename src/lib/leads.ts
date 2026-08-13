import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { getEmailChannel } from "@/lib/email";

export type LeadInput = {
  kind: "demo" | "estimate";
  name: string;
  phone: string;
  email?: string | null;
  restaurant?: string | null;
  city?: string | null;
  message?: string | null;
  data?: Record<string, unknown>;
  locale: "en" | "ar";
};

const BACKUP_FILE = path.join(process.cwd(), ".data", "leads-backup.jsonl");

/**
 * "Never a lost lead" (website spec): try Supabase, but ANY failure falls
 * back to an append-only local file, and the email notification goes out
 * regardless. A database hiccup must never eat a sales lead.
 */
export async function captureLead(lead: LeadInput): Promise<void> {
  const record = { ...lead, createdAt: new Date().toISOString() };

  let stored = false;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const client = createClient(url, key, { auth: { persistSession: false } });
      const { error } = await client.from("leads").insert({
        kind: lead.kind,
        name: lead.name,
        phone: lead.phone,
        email: lead.email ?? null,
        restaurant: lead.restaurant ?? null,
        city: lead.city ?? null,
        message: lead.message ?? null,
        data: lead.data ?? {},
        locale: lead.locale,
      });
      stored = !error;
      if (error) console.error("[leads] supabase insert failed:", error.message);
    } catch (err) {
      console.error("[leads] supabase unreachable", err);
    }
  }

  if (!stored) {
    await fs.mkdir(path.dirname(BACKUP_FILE), { recursive: true });
    await fs.appendFile(BACKUP_FILE, JSON.stringify(record) + "\n", "utf8");
  }

  const lines = [
    `Kind: ${lead.kind}`,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    lead.email && `Email: ${lead.email}`,
    lead.restaurant && `Restaurant: ${lead.restaurant}`,
    lead.city && `City: ${lead.city}`,
    lead.message && `Message: ${lead.message}`,
    lead.data && Object.keys(lead.data).length > 0 && `Data: ${JSON.stringify(lead.data)}`,
    `Locale: ${lead.locale}`,
    stored ? "(stored in Supabase)" : "(WARNING: stored in local backup only)",
  ].filter(Boolean);

  await getEmailChannel().send({
    subject: `Sofratak lead — ${lead.kind}: ${lead.name}`,
    text: lines.join("\n"),
  });
}
