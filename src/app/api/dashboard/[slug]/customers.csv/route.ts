import { NextResponse } from "next/server";
import { getMembership } from "@/lib/auth/server";
import { customersForRestaurant, toCsv } from "@/lib/crm/customers";

/** One-click CSV — the data is the restaurant's (CLAUDE.md sales promise). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const membership = await getMembership(slug);
  if (!membership)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { restaurant } = membership;

  const customers = await customersForRestaurant(restaurant.id);
  const csv = toCsv(
    customers.map((c) => ({
      name: c.name,
      phone: c.phone,
      orders: c.orderCount,
      total_spent_usd: (c.totalSpentCents / 100).toFixed(2),
      last_order: c.lastOrderAt,
      sms_opt_in: c.smsOptIn ? "yes" : "no",
      tags: c.tags.join("|"),
    })),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-customers.csv"`,
    },
  });
}
