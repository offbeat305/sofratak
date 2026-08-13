import { getTranslations } from "next-intl/server";
import { CircleCheck, CircleDashed } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

type Item = { name: string; status: "live" | "soon" };

/**
 * Depth like Toast, honesty unlike anyone: every capability in one grid,
 * labeled "Live now" vs "Rolling out" (founder-story rule: never phrase
 * roadmap items as shipped).
 */
export async function FeatureGrid() {
  const t = await getTranslations("site.grid");
  const items = t.raw("items") as Item[];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => {
        const live = item.status === "live";
        return (
          <Reveal key={item.name} delay={(i % 6) * 60}>
            <div
              className={cn(
                "hover-lift flex items-center justify-between gap-3 rounded-field border bg-white px-4 py-3.5",
                live ? "border-olive/10" : "border-olive/10 opacity-80",
              )}
            >
              <span className="flex items-center gap-2.5 text-[15px] font-semibold text-charcoal">
                {live ? (
                  <CircleCheck className="size-4 shrink-0 text-positive" aria-hidden />
                ) : (
                  <CircleDashed className="size-4 shrink-0 text-brass" aria-hidden />
                )}
                {item.name}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  live ? "bg-positive/10 text-positive" : "bg-brass/10 text-brass-deep",
                )}
              >
                {live ? t("live") : t("soon")}
              </span>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
