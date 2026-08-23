import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";
import { runAutomationsForRestaurant } from "@/lib/marketing/automations";

/**
 * Daily marketing automations (win-back, welcome, review-request,
 * birthday) across every tenant — see vercel.json for the schedule.
 * Vercel Cron sends its own bearer token automatically when CRON_SECRET
 * is set in the project's env; this route just has to check it matches.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const restaurants = await getStore().listAllRestaurants();
  let totalSent = 0;
  for (const restaurant of restaurants) {
    try {
      const { sent } = await runAutomationsForRestaurant(restaurant);
      totalSent += sent;
    } catch (err) {
      console.error(`[cron/automations] failed for ${restaurant.slug}`, err);
    }
  }

  return NextResponse.json({ ok: true, restaurants: restaurants.length, sent: totalSent });
}
