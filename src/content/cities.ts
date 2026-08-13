import type { LocalizedText } from "@/lib/db/types";

/**
 * Tier 1 city pages (website spec): home turf + all Florida metros +
 * Dearborn/Dearborn Heights/Detroit/Hamtramck. Each ships ONLY with a
 * genuinely local paragraph — no boilerplate (rollout rule in the spec).
 * Tier 2 cities get added here 3–4/week as content is written.
 *
 * Arabic copy: pending Zizo's review before launch (tracked in PROGRESS).
 */
export type City = {
  slug: string;
  name: LocalizedText;
  state: string;
  /** the honest local-scene paragraph — the anti-boilerplate rule */
  scene: LocalizedText;
  metaDescription: LocalizedText;
};

export const CITIES: City[] = [
  {
    slug: "tampa",
    name: { en: "Tampa", ar: "تامبا" },
    state: "FL",
    scene: {
      en: "From the halal corridor along Busch Boulevard to the family spots in Temple Terrace and the student crowd around USF, Tampa's Middle Eastern food scene runs deep — shawarma counters, Yemeni coffee houses, halal smash burgers. Most of these kitchens live and die by delivery apps that take a quarter of every ticket. Sofratak is built here, for them.",
      ar: "من شارع بوش بوليفارد بمطاعمه الحلال إلى المطاعم العائلية في تمبل تيراس وطلاب جامعة جنوب فلوريدا، مشهد الأكل الشرق أوسطي في تامبا عريق — شاورما، مقاهي يمنية، برغر حلال. معظم هذه المطابخ تعيش تحت رحمة تطبيقات التوصيل التي تأخذ ربع كل فاتورة. سفرتك انبنت هنا، ولأجلهم.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Tampa restaurants. Built for the halal, Arab, and Mediterranean kitchens of Busch Blvd, Temple Terrace, and beyond.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم تامبا. لمطابخ الحلال والعربي والمتوسطي في بوش بوليفارد وتمبل تيراس وغيرها.",
    },
  },
  {
    slug: "st-petersburg",
    name: { en: "St. Petersburg", ar: "سانت بطرسبرغ" },
    state: "FL",
    scene: {
      en: "St. Pete's food scene grew up fast along Central Avenue, and the Mediterranean and halal kitchens grew with it — gyro shops, Lebanese bakeries, hookah lounges that serve real food. A flat-rate ordering site keeps the tourist-season margin where it belongs: with the restaurant.",
      ar: "كبر مشهد الطعام في سانت بيت بسرعة على طول سنترال أفينيو، وكبرت معه المطابخ المتوسطية والحلال — محلات الجايرو، مخابز لبنانية، ومقاهي أراكيل تقدم أكلًا حقيقيًا. موقع طلبات برسوم ثابتة يبقي هامش موسم السياحة حيث يجب: عند المطعم.",
    },
    metaDescription: {
      en: "Commission-free online ordering for St. Petersburg restaurants — Mediterranean, halal, and Middle Eastern kitchens keep every dollar of food revenue.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم سانت بطرسبرغ — المطابخ المتوسطية والحلال تحتفظ بكل دولار من إيراد الطعام.",
    },
  },
  {
    slug: "orlando",
    name: { en: "Orlando", ar: "أورلاندو" },
    state: "FL",
    scene: {
      en: "West Colonial Drive and the Kirkman corridor host one of Florida's densest Middle Eastern food clusters — Palestinian bakeries, Turkish grills, halal fried chicken. Tourist traffic means app fees hit harder here than almost anywhere. Keeping direct orders direct is worth thousands a month to an Orlando kitchen.",
      ar: "يضم شارع ويست كولونيال ومحور كيركمان واحدًا من أكثف تجمعات الأكل الشرق أوسطي في فلوريدا — مخابز فلسطينية، مشاوي تركية، ودجاج حلال. حركة السياح تجعل عمولات التطبيقات أثقل هنا من أي مكان تقريبًا. إبقاء الطلبات المباشرة مباشرة يساوي آلاف الدولارات شهريًا لمطبخ في أورلاندو.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Orlando restaurants — built for the Middle Eastern and halal kitchens of West Colonial and beyond.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم أورلاندو — لمطابخ الشرق الأوسط والحلال في ويست كولونيال وغيرها.",
    },
  },
  {
    slug: "jacksonville",
    name: { en: "Jacksonville", ar: "جاكسونفيل" },
    state: "FL",
    scene: {
      en: "Jacksonville's halal scene stretches from the Southside's Baymeadows corridor to the shawarma and mandi houses near the university — a spread-out city where delivery matters and app commissions bite hardest. Your own ordering site turns that geography into an asset instead of a fee.",
      ar: "يمتد مشهد الحلال في جاكسونفيل من محور بايميدوز في الساوث سايد إلى بيوت الشاورما والمندي قرب الجامعة — مدينة مترامية يهم فيها التوصيل وتعضّ فيها عمولات التطبيقات بقوة. موقع طلباتك الخاص يحول تلك الجغرافيا إلى ميزة بدل رسوم.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Jacksonville restaurants — halal and Middle Eastern kitchens from Baymeadows to the Northside keep their delivery revenue.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم جاكسونفيل — مطابخ الحلال والشرق الأوسط من بايميدوز إلى الشمال تحتفظ بإيراد التوصيل.",
    },
  },
  {
    slug: "miami",
    name: { en: "Miami", ar: "ميامي" },
    state: "FL",
    scene: {
      en: "Miami's Middle Eastern kitchens — the Lebanese grills of Coral Way, the halal spots serving Wynwood's late crowd, the family restaurants out toward Westchester — compete in one of America's most expensive delivery markets. A $349 flat rate against 25–30% app commissions isn't a pitch here; it's arithmetic.",
      ar: "مطابخ ميامي الشرق أوسطية — مشاوي لبنانية على كورال واي، مطاعم حلال تخدم سهر وينوود، ومطاعم عائلية باتجاه وستشستر — تنافس في واحد من أغلى أسواق التوصيل في أمريكا. رسوم ثابتة 349$ مقابل عمولات 25–30% ليست عرضًا تسويقيًا هنا؛ إنها عملية حسابية.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Miami restaurants — Middle Eastern, Lebanese, and halal kitchens keep delivery revenue in-house.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم ميامي — المطابخ الشرق أوسطية واللبنانية والحلال تحتفظ بإيراد التوصيل.",
    },
  },
  {
    slug: "fort-lauderdale",
    name: { en: "Fort Lauderdale", ar: "فورت لودرديل" },
    state: "FL",
    scene: {
      en: "Between the beach crowds and the year-round locals, Fort Lauderdale's shawarma counters and Mediterranean grills run high-volume takeout — exactly the order mix where per-order app fees quietly outgrow rent. Direct ordering flips that line item back into profit.",
      ar: "بين رواد الشاطئ والسكان الدائمين، تدير عدادات الشاورما والمشاوي المتوسطية في فورت لودرديل طلبات خارجية بكثافة — وهذا بالضبط مزيج الطلبات الذي تتضخم فيه رسوم التطبيقات بصمت حتى تتجاوز الإيجار. الطلب المباشر يعيد هذا البند إلى الربح.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Fort Lauderdale restaurants — high-volume takeout without per-order app commissions.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم فورت لودرديل — طلبات خارجية بكثافة دون عمولات التطبيقات.",
    },
  },
  {
    slug: "hollywood-fl",
    name: { en: "Hollywood", ar: "هوليوود (فلوريدا)" },
    state: "FL",
    scene: {
      en: "Hollywood has quietly become one of South Florida's real Middle Eastern food towns — Lebanese and Syrian restaurants along Hollywood Boulevard and 441, bakeries that sell out of manakish on weekends. Family businesses like these are exactly who flat-rate direct ordering was built for.",
      ar: "أصبحت هوليوود بهدوء واحدة من مدن الأكل الشرق أوسطي الحقيقية في جنوب فلوريدا — مطاعم لبنانية وسورية على هوليوود بوليفارد وطريق 441، ومخابز تبيع كل المناقيش في عطلة الأسبوع. مشاريع عائلية كهذه هي بالضبط من بُني لأجلهم الطلب المباشر بالرسوم الثابتة.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Hollywood FL restaurants — built for the Lebanese and Syrian kitchens of Hollywood Blvd and 441.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم هوليوود فلوريدا — للمطابخ اللبنانية والسورية على هوليوود بوليفارد وطريق 441.",
    },
  },
  {
    slug: "west-palm-beach",
    name: { en: "West Palm Beach", ar: "وست بالم بيتش" },
    state: "FL",
    scene: {
      en: "West Palm's Mediterranean and halal kitchens serve a market that swings hard with the season. App commissions scale up with your best months; a flat rate doesn't. That difference — biggest exactly when business is best — is the whole point.",
      ar: "تخدم مطابخ وست بالم المتوسطية والحلال سوقًا يتأرجح بقوة مع المواسم. عمولات التطبيقات تكبر مع أفضل شهورك؛ الرسوم الثابتة لا. هذا الفرق — الأكبر تحديدًا حين يكون الشغل في أوجه — هو بيت القصيد.",
    },
    metaDescription: {
      en: "Commission-free online ordering for West Palm Beach restaurants — flat-rate ordering that doesn't scale up with your best season.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم وست بالم بيتش — رسوم ثابتة لا تكبر مع موسمك الأفضل.",
    },
  },
  {
    slug: "dearborn",
    name: { en: "Dearborn", ar: "ديربورن" },
    state: "MI",
    scene: {
      en: "Warren Avenue is the densest Arab-American food street in the country — Yemeni, Lebanese, Iraqi, Palestinian kitchens shoulder to shoulder, with lines out the door during Ramadan. Every one of those tickets that goes through a delivery app leaves 25–30% on the table. Dearborn doesn't need a middleman between its restaurants and its own community.",
      ar: "شارع وارن هو أكثف شارع طعام عربي-أمريكي في البلاد — مطابخ يمنية ولبنانية وعراقية وفلسطينية كتفًا بكتف، وطوابير على الأبواب في رمضان. كل فاتورة تمر عبر تطبيق توصيل تترك 25–30% على الطاولة. ديربورن لا تحتاج وسيطًا بين مطاعمها ومجتمعها.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Dearborn restaurants — built for the kitchens of Warren Ave. Keep every dollar your community spends with you.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم ديربورن — لمطابخ شارع وارن. احتفظ بكل دولار ينفقه مجتمعك عندك.",
    },
  },
  {
    slug: "dearborn-heights",
    name: { en: "Dearborn Heights", ar: "ديربورن هايتس" },
    state: "MI",
    scene: {
      en: "Dearborn Heights runs on the same kitchens and the same families as its neighbor — the bakeries on Ford Road, the grill houses on Telegraph — but with even more of the business coming from pickup and delivery. That's precisely where app fees do their damage, and precisely what a direct ordering site fixes.",
      ar: "تعيش ديربورن هايتس على نفس المطابخ ونفس العائلات مثل جارتها — المخابز على فورد رود والمشاوي على تلغراف — لكن مع حصة أكبر من الشغل تأتي من الاستلام والتوصيل. هنا بالضبط تُحدث رسوم التطبيقات ضررها، وهنا بالضبط يعالجها موقع الطلب المباشر.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Dearborn Heights restaurants — pickup and delivery without the 25–30% app cut.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم ديربورن هايتس — استلام وتوصيل دون خصم 25–30% للتطبيقات.",
    },
  },
  {
    slug: "detroit",
    name: { en: "Detroit", ar: "ديترويت" },
    state: "MI",
    scene: {
      en: "Detroit's Middle Eastern food story runs from the halal counters of the west side to the new generation of Yemeni coffee shops downtown. These are neighborhood businesses with regulars who order every week — the exact customer relationship delivery apps monetize. Owning the order means owning that relationship again.",
      ar: "قصة الأكل الشرق أوسطي في ديترويت تمتد من عدادات الحلال في الجانب الغربي إلى الجيل الجديد من المقاهي اليمنية وسط المدينة. هذه مشاريع أحياء لها زبائن دائمون يطلبون كل أسبوع — وهي بالضبط العلاقة التي تتربح منها تطبيقات التوصيل. امتلاك الطلب يعني امتلاك تلك العلاقة من جديد.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Detroit restaurants — neighborhood kitchens keep their regulars, their data, and their delivery revenue.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم ديترويت — مطابخ الأحياء تحتفظ بزبائنها وبياناتها وإيراد توصيلها.",
    },
  },
  {
    slug: "hamtramck",
    name: { en: "Hamtramck", ar: "هامترامك" },
    state: "MI",
    scene: {
      en: "Two square miles, and some of the best Yemeni and Bangladeshi food in America — the cafés and kitchens along Joseph Campau serve a community that famously shows up in person AND orders out constantly. For restaurants this size, a single app's monthly commission can equal a part-timer's wages. Keep it instead.",
      ar: "ميلان مربعان فقط، وفيهما من أفضل الأكل اليمني والبنغلاديشي في أمريكا — مقاهي ومطابخ جوزيف كامباو تخدم مجتمعًا معروفًا بحضوره شخصيًا وطلبه المستمر. لمطاعم بهذا الحجم، عمولة تطبيق واحد شهريًا قد تعادل راتب موظف جزئي. احتفظ بها بدلًا من ذلك.",
    },
    metaDescription: {
      en: "Commission-free online ordering for Hamtramck restaurants — the kitchens of Joseph Campau keep what their community spends.",
      ar: "طلبات أونلاين بدون عمولة لمطاعم هامترامك — مطابخ جوزيف كامباو تحتفظ بما ينفقه مجتمعها.",
    },
  },
];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
