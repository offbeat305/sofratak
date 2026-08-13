import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getMembership } from "@/lib/auth/server";
import { toCsv } from "@/lib/crm/customers";

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
  const csv = toCsv(
    orders.map((o) => ({
      number: o.number,
      created_at: o.createdAt,
      status: o.status,
      payment_status: o.paymentStatus,
      fulfillment: o.fulfillment,
      customer_name: o.customer.name,
      customer_phone: o.customer.phone,
      items: o.lines.map((l) => `${l.qty}x ${l.name.en}`).join("; "),
      subtotal_usd: (o.subtotalCents / 100).toFixed(2),
      service_fee_usd: (o.serviceFeeCents / 100).toFixed(2),
      delivery_fee_usd: (o.deliveryFeeCents / 100).toFixed(2),
      tip_usd: (o.tipCents / 100).toFixed(2),
      total_usd: (o.totalCents / 100).toFixed(2),
      refunded_usd: (o.refunds.reduce((n, r) => n + r.amountCents, 0) / 100).toFixed(2),
    })),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-orders.csv"`,
    },
  });
}
