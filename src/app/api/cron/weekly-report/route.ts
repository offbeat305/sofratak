import { NextResponse, type NextRequest } from "next/server";
import { sendWeeklyReports } from "@/lib/reports/weekly";

/**
 * Monday-morning owner reports across every tenant (Phase 6) — schedule
 * in vercel.json. Same CRON_SECRET bearer check as /api/cron/automations.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const result = await sendWeeklyReports(origin);
  return NextResponse.json({ ok: true, ...result });
}
