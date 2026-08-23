import { NextResponse } from "next/server";
import { getMembership } from "@/lib/auth/server";
import { customersForRestaurant } from "@/lib/crm/customers";
import { customersToCsv } from "@/lib/exports/csv";

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
  const csv = customersToCsv(customers);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-customers.csv"`,
    },
  });
}
