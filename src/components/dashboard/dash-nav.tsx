"use client";

import {
  BookOpen,
  CalendarCheck,
  ConciergeBell,
  Megaphone,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const ICONS = {
  today: CalendarCheck,
  orders: ReceiptText,
  customers: Users,
  menu: BookOpen,
  marketing: Megaphone,
  requests: ConciergeBell,
  settings: Settings,
} as const;

type Tab = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  /** brass dot — a request has an update (concierge spec §1) */
  badge?: boolean;
};

export function DashNav({
  tabs,
  orientation,
}: {
  tabs: readonly Tab[];
  orientation: "side" | "bottom";
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  if (orientation === "bottom") {
    return (
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const Icon = ICONS[tab.icon];
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold",
                active ? "text-olive" : "text-stone",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="size-5" aria-hidden />
                {tab.badge && (
                  <span className="absolute -top-0.5 -end-0.5 size-2 rounded-full bg-brass" aria-hidden />
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {tabs.map((tab) => {
        const Icon = ICONS[tab.icon];
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold",
              active ? "bg-olive text-ivory" : "text-charcoal hover:bg-olive/5",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="relative">
              <Icon className="size-4" aria-hidden />
              {tab.badge && (
                <span className="absolute -top-0.5 -end-0.5 size-2 rounded-full bg-brass" aria-hidden />
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </>
  );
}
