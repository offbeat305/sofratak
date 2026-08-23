import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getMembership } from "@/lib/auth/server";
import { ordersToCsv } from "@/lib/exports/csv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const membership = await getMembership(slug);
  if (!membership)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { restaurant } = membership;
  const store = getStore();

  const orders = await store.listOrders(restaurant.id);
  const csv = ordersToCsv(orders);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-orders.csv"`,
    },
  });
}
