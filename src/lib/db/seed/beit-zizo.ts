import type {
  Menu,
  MenuItem,
  Restaurant,
} from "../types";

/**
 * Demo restaurant for every phase's "done when" test.
 * All contact details are fictional (555 number, placeholder links).
 */
export const beitZizo: Restaurant = {
  id: "rest-beitzizo",
  slug: "beitzizo",
  name: { en: "Beit Zizo Shawarma", ar: "بيت زيزو شاورما" },
  tagline: {
    en: "Family recipes, charcoal fire, fresh saj — Tampa's home for shawarma.",
    ar: "وصفات العيلة، نار الفحم، وصاج طازة — بيت الشاورما في تامبا.",
  },
  logoUrl: null,
  coverUrl: "/demo/cover-beitzizo.svg",
  brand: { primary: "#6E2B2B", accent: "#C9922A" },
  halal: true,
  phone: "(813) 555-0142",
  address: {
    line1: "4212 W Kennedy Blvd",
    city: "Tampa",
    state: "FL",
    zip: "33609",
  },
  timezone: "America/New_York",
  hours: [
    { day: 0, open: "11:00", close: "21:00" },
    { day: 1, open: "11:00", close: "21:00" },
    { day: 2, open: "11:00", close: "21:00" },
    { day: 3, open: "11:00", close: "21:00" },
    { day: 4, open: "11:00", close: "21:00" },
    { day: 5, open: "11:00", close: "22:00" },
    { day: 6, open: "11:00", close: "22:00" },
  ],
  instagramUrl: "https://instagram.com/beitzizo.tampa",
  googleReviewsUrl: "https://g.page/beitzizo-tampa/review",
  ordering: {
    pickup: true,
    delivery: true,
    deliveryFeeCents: 399,
    deliveryMinimumCents: 1500,
    prepMinutes: 20,
    paused: false,
  },
  stripe: { accountId: null, chargesEnabled: false },
  billing: {
    stripeCustomerId: null,
    subscriptionId: null,
    tier: null,
    status: "none",
    periodEnd: null,
    canceledAt: null,
  },
};

const groups: Menu["modifierGroups"] = [
  {
    id: "grp-bread",
    name: { en: "Bread", ar: "الخبز" },
    min: 1,
    max: 1,
    options: [
      { id: "opt-saj", name: { en: "Saj wrap", ar: "صاج" }, priceDeltaCents: 0 },
      { id: "opt-pita", name: { en: "Pita", ar: "خبز عربي" }, priceDeltaCents: 0 },
    ],
  },
  {
    id: "grp-spice",
    name: { en: "Spice level", ar: "مستوى الحار" },
    min: 1,
    max: 1,
    options: [
      { id: "opt-mild", name: { en: "Mild", ar: "خفيف" }, priceDeltaCents: 0 },
      { id: "opt-medium", name: { en: "Medium", ar: "وسط" }, priceDeltaCents: 0 },
      { id: "opt-hot", name: { en: "Hot", ar: "حار" }, priceDeltaCents: 0 },
    ],
  },
  {
    id: "grp-extras",
    name: { en: "Add-ons", ar: "إضافات" },
    min: 0,
    max: 4,
    options: [
      {
        id: "opt-garlic",
        name: { en: "Extra garlic sauce", ar: "ثومية إضافية" },
        priceDeltaCents: 75,
      },
      {
        id: "opt-pickles",
        name: { en: "Extra pickles", ar: "مخلل إضافي" },
        priceDeltaCents: 50,
      },
      {
        id: "opt-fries-in",
        name: { en: "Fries inside", ar: "بطاطا داخل اللفة" },
        priceDeltaCents: 150,
      },
      {
        id: "opt-extra-meat",
        name: { en: "Extra meat", ar: "لحمة إضافية" },
        priceDeltaCents: 300,
      },
    ],
  },
  {
    id: "grp-side",
    name: { en: "Choose your side", ar: "اختر الطبق الجانبي" },
    min: 1,
    max: 1,
    options: [
      {
        id: "opt-rice",
        name: { en: "Rice with vermicelli", ar: "رز بالشعيرية" },
        priceDeltaCents: 0,
      },
      { id: "opt-fries", name: { en: "Fries", ar: "بطاطا مقلية" }, priceDeltaCents: 0 },
      { id: "opt-salad", name: { en: "House salad", ar: "سلطة البيت" }, priceDeltaCents: 0 },
    ],
  },
  {
    id: "grp-size",
    name: { en: "Size", ar: "الحجم" },
    min: 1,
    max: 1,
    options: [
      { id: "opt-regular", name: { en: "Regular", ar: "عادي" }, priceDeltaCents: 0 },
      { id: "opt-large", name: { en: "Large", ar: "كبير" }, priceDeltaCents: 300 },
    ],
  },
];

const categories: Menu["categories"] = [
  { id: "cat-shawarma", name: { en: "Shawarma & Wraps", ar: "شاورما ولفائف" }, sort: 1 },
  { id: "cat-grill", name: { en: "Off the Grill", ar: "مشاوي" }, sort: 2 },
  { id: "cat-mezze", name: { en: "Mezze & Salads", ar: "مقبلات وسلطات" }, sort: 3 },
  { id: "cat-manakish", name: { en: "Manakish & Sides", ar: "مناقيش وجانبيات" }, sort: 4 },
  { id: "cat-dessert", name: { en: "Desserts", ar: "حلويات" }, sort: 5 },
  { id: "cat-drinks", name: { en: "Drinks", ar: "مشروبات" }, sort: 6 },
];

let sortCounter = 0;
function item(
  id: string,
  categoryId: string,
  name: MenuItem["name"],
  description: MenuItem["description"],
  priceCents: number,
  modifierGroupIds: string[] = [],
): MenuItem {
  return {
    id,
    categoryId,
    name,
    description,
    priceCents,
    imageUrl: `/demo/${categoryId}.svg`,
    soldOut: false,
    modifierGroupIds,
    sort: ++sortCounter,
  };
}

const items: MenuItem[] = [
  // Shawarma & Wraps
  item(
    "itm-chicken-shawarma-wrap",
    "cat-shawarma",
    { en: "Chicken Shawarma Wrap", ar: "لفة شاورما دجاج" },
    {
      en: "Marinated chicken off the spit, garlic sauce, pickles, hand-rolled to order.",
      ar: "دجاج متبل من السيخ مع ثومية ومخلل، تُلف طازجة عند الطلب.",
    },
    949,
    ["grp-bread", "grp-spice", "grp-extras"],
  ),
  item(
    "itm-beef-shawarma-wrap",
    "cat-shawarma",
    { en: "Beef Shawarma Wrap", ar: "لفة شاورما لحم" },
    {
      en: "Thin-sliced beef shawarma, tahini, onion, parsley, and tomato.",
      ar: "شرائح لحم شاورما مع طحينة وبصل وبقدونس وبندورة.",
    },
    1049,
    ["grp-bread", "grp-spice", "grp-extras"],
  ),
  item(
    "itm-chicken-shawarma-plate",
    "cat-shawarma",
    { en: "Chicken Shawarma Plate", ar: "صحن شاورما دجاج" },
    {
      en: "A generous cut of chicken shawarma with your choice of side and garlic sauce.",
      ar: "كمية سخية من شاورما الدجاج مع طبق جانبي من اختيارك وثومية.",
    },
    1499,
    ["grp-side", "grp-spice"],
  ),
  item(
    "itm-beef-shawarma-plate",
    "cat-shawarma",
    { en: "Beef Shawarma Plate", ar: "صحن شاورما لحم" },
    {
      en: "Beef shawarma over your choice of side with tahini and grilled tomato.",
      ar: "شاورما لحم مع طبق جانبي من اختيارك وطحينة وبندورة مشوية.",
    },
    1599,
    ["grp-side", "grp-spice"],
  ),
  item(
    "itm-mixed-shawarma-plate",
    "cat-shawarma",
    { en: "Mixed Shawarma Plate", ar: "صحن شاورما مشكل" },
    {
      en: "Half chicken, half beef — the best of both spits with one side.",
      ar: "نص دجاج ونص لحم — أطيب ما في السيخين مع طبق جانبي.",
    },
    1699,
    ["grp-side", "grp-spice"],
  ),
  item(
    "itm-shawarma-fries",
    "cat-shawarma",
    { en: "Shawarma Fries", ar: "بطاطا شاورما" },
    {
      en: "Crispy fries loaded with chicken shawarma, garlic sauce, and pickles.",
      ar: "بطاطا مقرمشة مغطاة بشاورما الدجاج والثومية والمخلل.",
    },
    1299,
    ["grp-spice", "grp-extras"],
  ),

  // Off the Grill
  item(
    "itm-shish-tawook",
    "cat-grill",
    { en: "Shish Tawook (2 skewers)", ar: "شيش طاووق (سيخان)" },
    {
      en: "Charcoal-grilled marinated chicken skewers with garlic sauce and one side.",
      ar: "أسياخ دجاج متبلة مشوية على الفحم مع ثومية وطبق جانبي.",
    },
    1549,
    ["grp-side"],
  ),
  item(
    "itm-kafta-kabob",
    "cat-grill",
    { en: "Kafta Kabob (2 skewers)", ar: "كفتة مشوية (سيخان)" },
    {
      en: "Hand-mixed beef and lamb kafta with parsley and onion, grilled over charcoal.",
      ar: "كفتة لحم بقر وغنم بالبقدونس والبصل، مشوية على الفحم.",
    },
    1549,
    ["grp-side"],
  ),
  item(
    "itm-lamb-chops",
    "cat-grill",
    { en: "Lamb Chops (4 pc)", ar: "ريش غنم (٤ قطع)" },
    {
      en: "Frenched lamb chops, charcoal-grilled, served with one side.",
      ar: "ريش غنم مشوية على الفحم مع طبق جانبي.",
    },
    2499,
    ["grp-side"],
  ),
  item(
    "itm-mixed-grill",
    "cat-grill",
    { en: "Mixed Grill", ar: "مشاوي مشكلة" },
    {
      en: "Tawook, kafta, and lamb on one plate with grilled vegetables and a side.",
      ar: "طاووق وكفتة ولحم غنم في صحن واحد مع خضار مشوية وطبق جانبي.",
    },
    2299,
    ["grp-side"],
  ),
  item(
    "itm-half-chicken",
    "cat-grill",
    { en: "Grilled Half Chicken", ar: "نص دجاجة مشوية" },
    {
      en: "Marinated half chicken, flame-grilled, with garlic sauce and one side.",
      ar: "نص دجاجة متبلة مشوية على النار مع ثومية وطبق جانبي.",
    },
    1399,
    ["grp-side"],
  ),

  // Mezze & Salads
  item(
    "itm-hummus",
    "cat-mezze",
    { en: "Hummus", ar: "حمص" },
    {
      en: "Silky chickpea and tahini dip with olive oil and warm pita.",
      ar: "حمص ناعم بالطحينة وزيت الزيتون مع خبز دافئ.",
    },
    699,
    ["grp-size"],
  ),
  item(
    "itm-baba-ghanouj",
    "cat-mezze",
    { en: "Baba Ghanouj", ar: "بابا غنوج" },
    {
      en: "Fire-roasted eggplant with tahini, lemon, and olive oil.",
      ar: "باذنجان مشوي على النار مع طحينة وليمون وزيت زيتون.",
    },
    749,
    ["grp-size"],
  ),
  item(
    "itm-falafel",
    "cat-mezze",
    { en: "Falafel (6 pc)", ar: "فلافل (٦ قطع)" },
    {
      en: "Crispy herb falafel fried to order, with tahini sauce.",
      ar: "فلافل مقرمشة بالأعشاب تُقلى عند الطلب مع صلصة طحينة.",
    },
    649,
  ),
  item(
    "itm-fattoush",
    "cat-mezze",
    { en: "Fattoush", ar: "فتوش" },
    {
      en: "Crisp greens, tomato, cucumber, radish, sumac dressing, toasted pita chips.",
      ar: "خضار طازجة وبندورة وخيار وفجل مع دبس رمان وسماق وخبز محمص.",
    },
    849,
  ),
  item(
    "itm-tabbouleh",
    "cat-mezze",
    { en: "Tabbouleh", ar: "تبولة" },
    {
      en: "Fresh parsley, bulgur, tomato, mint, lemon, and olive oil.",
      ar: "بقدونس طازج وبرغل وبندورة ونعناع وليمون وزيت زيتون.",
    },
    849,
  ),
  item(
    "itm-grape-leaves",
    "cat-mezze",
    { en: "Stuffed Grape Leaves (6 pc)", ar: "ورق عنب (٦ قطع)" },
    {
      en: "Hand-rolled grape leaves with rice, tomato, and herbs. Served cold.",
      ar: "ورق عنب ملفوف يدويًا بالرز والبندورة والأعشاب، يُقدم باردًا.",
    },
    799,
  ),

  // Manakish & Sides
  item(
    "itm-zaatar-manoushe",
    "cat-manakish",
    { en: "Za'atar Manoushe", ar: "منقوشة زعتر" },
    {
      en: "Fresh-baked flatbread brushed with za'atar and olive oil.",
      ar: "عجينة طازجة من الفرن بالزعتر وزيت الزيتون.",
    },
    499,
  ),
  item(
    "itm-cheese-manoushe",
    "cat-manakish",
    { en: "Cheese Manoushe", ar: "منقوشة جبنة" },
    {
      en: "Melted akkawi cheese on fresh-baked flatbread.",
      ar: "جبنة عكاوي ذائبة على عجينة طازجة من الفرن.",
    },
    649,
  ),
  item(
    "itm-batata-harra",
    "cat-manakish",
    { en: "Batata Harra", ar: "بطاطا حرة" },
    {
      en: "Spicy skillet potatoes with garlic, cilantro, and chili.",
      ar: "بطاطا حارة بالثوم والكزبرة والفليفلة.",
    },
    699,
  ),
  item(
    "itm-rice-side",
    "cat-manakish",
    { en: "Rice with Vermicelli", ar: "رز بالشعيرية" },
    {
      en: "Buttery rice with toasted vermicelli — the classic side.",
      ar: "رز بالزبدة مع شعيرية محمصة — الطبق الجانبي الكلاسيكي.",
    },
    399,
  ),

  // Desserts
  item(
    "itm-baklava",
    "cat-dessert",
    { en: "Baklava (3 pc)", ar: "بقلاوة (٣ قطع)" },
    {
      en: "Layered phyllo with pistachio and orange-blossom syrup.",
      ar: "رقائق محشوة بالفستق الحلبي مع قطر ماء الزهر.",
    },
    549,
  ),
  item(
    "itm-knafeh",
    "cat-dessert",
    { en: "Knafeh", ar: "كنافة" },
    {
      en: "Warm cheese knafeh with crunchy kataifi and syrup, made to order.",
      ar: "كنافة بالجبنة الساخنة مع عجينة مقرمشة وقطر، تُحضّر عند الطلب.",
    },
    799,
  ),

  // Drinks
  item(
    "itm-mint-lemonade",
    "cat-drinks",
    { en: "Fresh Mint Lemonade", ar: "ليموناضة بالنعناع" },
    {
      en: "Fresh-squeezed lemonade blended with mint.",
      ar: "ليمون طبيعي معصور طازجًا مع نعناع.",
    },
    449,
  ),
  item(
    "itm-ayran",
    "cat-drinks",
    { en: "Ayran", ar: "عيران" },
    {
      en: "Chilled salted yogurt drink.",
      ar: "لبن عيران بارد.",
    },
    299,
  ),
];

export const beitZizoMenu: Menu = {
  categories,
  items,
  modifierGroups: groups,
};
