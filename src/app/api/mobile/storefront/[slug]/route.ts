import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { menuPublicView, restaurantPublicView } from "@/lib/mobile/api";

export const revalidate = 60;

/** Everything the app needs to render one restaurant: branding + menu. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const menu = await store.getMenu(restaurant.id);
  return NextResponse.json({
    restaurant: restaurantPublicView(restaurant),
    menu: menu ? menuPublicView(menu) : { categories: [], items: [], modifierGroups: [] },
  });
}
