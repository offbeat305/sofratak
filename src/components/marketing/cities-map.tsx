"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cityBySlug } from "@/content/cities";
import { cn } from "@/lib/cn";

/**
 * Low-poly silhouettes, not literal cartography — a stylized brand
 * illustration in the same geometric-arch language as the rest of the
 * site, not an attempt at survey-accurate coastlines.
 */
const FLORIDA_PATH =
  "M18,44 L108,36 L124,54 L142,70 L172,90 L192,130 L206,180 L216,228 L221,268 " +
  "L209,300 L192,320 L178,308 L166,278 L152,238 L140,190 L124,150 L98,120 " +
  "L72,100 L46,80 L22,60 Z";

const MICHIGAN_PATH =
  "M62,10 L112,14 L142,30 L151,58 L186,53 L182,90 L151,101 L157,140 L151,180 " +
  "L140,220 L110,246 L80,240 L55,210 L35,170 L24,130 L20,90 L30,50 Z";

type Region = "florida" | "michigan";

type Pin = { slug: string; x: number; y: number };

const FLORIDA_PINS: Pin[] = [
  { slug: "jacksonville", x: 176, y: 96 },
  { slug: "orlando", x: 176, y: 166 },
  { slug: "tampa", x: 134, y: 176 },
  { slug: "st-petersburg", x: 140, y: 198 },
  { slug: "west-palm-beach", x: 206, y: 240 },
  { slug: "fort-lauderdale", x: 206, y: 264 },
  { slug: "hollywood-fl", x: 203, y: 276 },
  { slug: "miami", x: 199, y: 288 },
];

const MICHIGAN_PINS: Pin[] = [
  { slug: "detroit", x: 152, y: 158 },
  { slug: "hamtramck", x: 142, y: 148 },
  { slug: "dearborn", x: 128, y: 164 },
  { slug: "dearborn-heights", x: 112, y: 160 },
];

const REGIONS: Array<{
  id: Region;
  path: string;
  viewBox: string;
  pins: Pin[];
  label: string;
}> = [
  { id: "florida", path: FLORIDA_PATH, viewBox: "0 0 240 340", pins: FLORIDA_PINS, label: "Florida" },
  { id: "michigan", path: MICHIGAN_PATH, viewBox: "0 0 200 260", pins: MICHIGAN_PINS, label: "Metro Detroit" },
];

export function CitiesMap() {
  const t = useTranslations("site.citiesPage");
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);

  const goTo = (slug: string) => router.push(`/cities/${slug}`);

  return (
    // Geography doesn't mirror for RTL — force LTR for the map itself,
    // labels/tooltips still render each city's own script correctly.
    <div dir="ltr" className="grid gap-8 sm:grid-cols-2">
      {REGIONS.map((region) => (
        <div
          key={region.id}
          className="rounded-card border border-olive/10 bg-white p-5 shadow-[0_1px_3px_rgba(31,31,31,0.05)] sm:p-6"
        >
          <p className="mb-3 text-xs font-bold tracking-[0.14em] text-stone uppercase">
            {region.id === "florida" ? t("florida") : t("michigan")}
          </p>
          <div className="relative">
            <svg
              viewBox={region.viewBox}
              className="w-full"
              role="img"
              aria-label={region.id === "florida" ? t("florida") : t("michigan")}
            >
              <path
                d={region.path}
                fill="var(--color-sand-soft)"
                stroke="var(--color-olive)"
                strokeOpacity="0.35"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {region.pins.map((pin) => {
                const city = cityBySlug(pin.slug);
                if (!city) return null;
                const isActive = active === pin.slug;
                return (
                  <g
                    key={pin.slug}
                    className="cursor-pointer outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={city.name[locale]}
                    onMouseEnter={() => setActive(pin.slug)}
                    onMouseLeave={() => setActive((s) => (s === pin.slug ? null : s))}
                    onFocus={() => setActive(pin.slug)}
                    onBlur={() => setActive((s) => (s === pin.slug ? null : s))}
                    onClick={() => goTo(pin.slug)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goTo(pin.slug);
                      }
                    }}
                  >
                    {/* pulse ring — pure CSS animation, opacity/scale only */}
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r="6"
                      fill="var(--color-brass)"
                      className={cn(
                        "origin-center motion-safe:animate-ping",
                        !isActive && "opacity-40",
                        isActive && "opacity-0",
                      )}
                      style={{ transformBox: "fill-box" }}
                    />
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={isActive ? 7 : 5.5}
                      fill={isActive ? "var(--color-olive)" : "var(--color-brass)"}
                      stroke="var(--color-ivory)"
                      strokeWidth="2"
                      className="transition-[r,fill] duration-150"
                    />
                  </g>
                );
              })}
            </svg>

            {/* tooltip card */}
            {region.pins.map((pin) => {
              if (active !== pin.slug) return null;
              const city = cityBySlug(pin.slug);
              if (!city) return null;
              const leftPct = (pin.x / Number(region.viewBox.split(" ")[2])) * 100;
              const topPct = (pin.y / Number(region.viewBox.split(" ")[3])) * 100;
              return (
                <div
                  key={pin.slug}
                  className="animate-fade-in pointer-events-none absolute z-10 w-48 -translate-x-1/2 rounded-field border border-olive/10 bg-white p-3 text-start shadow-[0_14px_34px_rgba(31,31,31,0.18)]"
                  style={{
                    left: `${leftPct}%`,
                    top: `${Math.min(topPct, 78)}%`,
                  }}
                >
                  <p className="font-bold text-charcoal">{city.name[locale]}</p>
                  <p className="mt-0.5 text-xs text-stone">{city.knownFor[0][locale]}</p>
                  <p className="mt-1.5 text-xs font-bold text-brass-deep">{t("view")} →</p>
                </div>
              );
            })}
          </div>

          {/* always-visible list under the map — keeps it usable without hover */}
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-olive/8 pt-3">
            {region.pins.map((pin) => {
              const city = cityBySlug(pin.slug);
              if (!city) return null;
              return (
                <li key={pin.slug}>
                  <button
                    type="button"
                    onClick={() => goTo(pin.slug)}
                    onMouseEnter={() => setActive(pin.slug)}
                    onMouseLeave={() => setActive((s) => (s === pin.slug ? null : s))}
                    className={cn(
                      "text-sm font-semibold underline-offset-4 hover:underline",
                      active === pin.slug ? "text-olive" : "text-stone",
                    )}
                  >
                    {city.name[locale]}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
