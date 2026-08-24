/**
 * Directory metros (docs/directory-spec.md). A metro is one /eat/[city]
 * screen — it can span multiple municipalities (Dearborn covers the
 * Detroit metro Arab corridor).
 */
export type EatMetro = {
  slug: string;
  name: { en: string; ar: string };
  blurb: { en: string; ar: string };
  /** map center + zoom for the metro view */
  center: { lat: number; lng: number };
  zoom: number;
  /** for "Open now" on unclaimed listings that have hours */
  timezone: string;
};

export const EAT_METROS: EatMetro[] = [
  {
    slug: "tampa",
    name: { en: "Tampa Bay", ar: "تامبا باي" },
    blurb: {
      en: "Shawarma, mansaf, knafeh — the Arab kitchens of Tampa, St. Pete, and Clearwater.",
      ar: "شاورما ومنسف وكنافة — مطابخ العرب في تامبا وسانت بيت وكليرووتر.",
    },
    center: { lat: 27.9506, lng: -82.4572 },
    zoom: 11,
    timezone: "America/New_York",
  },
  {
    slug: "dearborn",
    name: { en: "Dearborn & Detroit", ar: "ديربورن وديترويت" },
    blurb: {
      en: "The capital of Arab food in America — Dearborn, Dearborn Heights, and Metro Detroit.",
      ar: "عاصمة الأكل العربي في أمريكا — ديربورن وديربورن هايتس وديترويت الكبرى.",
    },
    center: { lat: 42.3223, lng: -83.1763 },
    zoom: 12,
    timezone: "America/Detroit",
  },
];

export function getMetro(slug: string): EatMetro | undefined {
  return EAT_METROS.find((m) => m.slug === slug);
}

/** Canonical cuisine keys — the filter chips. Labels live in messages. */
export const EAT_CUISINES = [
  "lebanese",
  "palestinian",
  "yemeni",
  "iraqi",
  "egyptian",
  "syrian",
  "jordanian",
  "mediterranean",
] as const;
export type EatCuisine = (typeof EAT_CUISINES)[number];
