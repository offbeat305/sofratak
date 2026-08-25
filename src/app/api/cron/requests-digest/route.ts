import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";
import { getEmailChannel } from "@/lib/email";

/**
 * Daily 9am concierge digest (docs/concierge-requests-spec.md §4):
 * every open request past (or approaching) the 24-hour promise, emailed
 * to LEADS_EMAIL. Schedule in vercel.json; same CRON_SECRET bearer
 * check as the other cron routes. The system's job is to make missing
 * an SLA impossible to do quietly.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const store = getStore();
  const [requests, restaurants] = await Promise.all([
    store.listAllServiceRequests(),
    store.listAllRestaurants(),
  ]);
  const nameOf = new Map(restaurants.map((r) => [r.id, r.name.en]));

  const open = requests.filter((r) => r.status !== "done");
  const line = (r: (typeof open)[number]) => {
    const hours = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 3_600_000);
    return `- [${hours}h] ${nameOf.get(r.restaurantId) ?? r.restaurantId} — ${r.category}/${r.kind}${r.pricingFlag ? " ⚠ PRICING" : ""}${r.note ? ` — "${r.note.slice(0, 80)}"` : ""}`;
  };
  const overdue = open.filter(
    (r) => Date.now() - new Date(r.createdAt).getTime() > 24 * 3_600_000,
  );

  if (open.length > 0) {
    await getEmailChannel().send({
      subject: `[Sofratak requests] ${overdue.length} overdue · ${open.length} open`,
      text: [
        overdue.length ? "OVERDUE (24h promise blown — fix these first):" : "Nothing overdue. 👌",
        ...overdue.map(line),
        "",
        "All open:",
        ...open.map(line),
        "",
        "Queue: /admin/requests",
      ].join("\n"),
    });
  }

  return NextResponse.json({ ok: true, open: open.length, overdue: overdue.length });
}
