import type { LocalizedText } from "@/lib/db/types";

/**
 * Knowledge base for the site assistant. Deliberately NOT an LLM: every
 * answer below is curated from copy already published on the site, so the
 * bot can never invent pricing, guarantees, or features (branding.md).
 * Anything unmatched hands off to WhatsApp / the demo form.
 *
 * Arabic answers pending Zizo's review, same as the rest of the site.
 */
export type KbEntry = {
  id: string;
  /** lowercase keywords, EN + AR, matched against the user's message */
  keywords: string[];
  /** shown as a quick-reply chip */
  quick?: LocalizedText;
  question: LocalizedText;
  answer: LocalizedText;
};

export const ASSISTANT_KB: KbEntry[] = [
  {
    id: "pricing",
    keywords: ["price", "pricing", "cost", "monthly", "subscription", "plan", "tier", "how much", "سعر", "اسعار", "الأسعار", "تكلفة", "اشتراك", "شهري", "كم"],
    quick: { en: "How much does it cost?", ar: "كم التكلفة؟" },
    question: { en: "How much does it cost?", ar: "كم التكلفة؟" },
    answer: {
      en: "Three plans, per location, month-to-month: Starter $249/mo, Growth $349/mo, Partner $499/mo. No setup fee for founding restaurants, and you can cancel anytime — your data leaves with you.",
      ar: "ثلاث باقات، لكل فرع، شهر بشهر: ستارتر 249$، غروث 349$، بارتنر 499$. بدون رسوم تأسيس للمطاعم المؤسِّسة، وتقدر تلغي وقت ما تشاء — وبياناتك تخرج معك.",
    },
  },
  {
    id: "commission",
    keywords: ["commission", "percent", "cut", "take", "fee per order", "79", "service fee", "عمولة", "نسبة", "رسوم", "خدمة"],
    quick: { en: "Do you take a commission?", ar: "هل تأخذون عمولة؟" },
    question: { en: "Do you take a commission?", ar: "هل تأخذون عمولة؟" },
    answer: {
      en: "No — $0 commission on food. The diner pays a flat 79¢ service fee per order (shown at checkout), and card processing (2.9% + 30¢) passes through at cost. Food revenue and tips settle directly to your bank through Stripe.",
      ar: "لا — صفر عمولة على الطعام. الزبون يدفع رسم خدمة ثابتًا 79¢ لكل طلب (يظهر عند الدفع)، ورسوم البطاقات (2.9% + 30¢) تمر بالتكلفة. إيراد الطعام والبقشيش يصلان مباشرة إلى حسابك البنكي عبر سترايب.",
    },
  },
  {
    id: "speed",
    keywords: ["how fast", "how long", "launch", "live", "start", "onboard", "setup", "weeks", "days", "متى", "كم يوم", "أسبوع", "اسبوع", "نبدأ", "الانطلاق", "بسرعة"],
    quick: { en: "How fast can we launch?", ar: "متى ننطلق؟" },
    question: { en: "How fast can we launch?", ar: "متى ننطلق؟" },
    answer: {
      en: "About two weeks from menu to first order. A photo of your paper menu is enough to start — we build the site, you approve everything, and orders ring on the tablet you already have.",
      ar: "حوالي أسبوعين من القائمة إلى أول طلب. صورة عن المنيو الورقي تكفي — نبني الموقع، أنت توافق على كل شيء، والطلبات ترن على الجهاز الموجود عندك.",
    },
  },
  {
    id: "arabic",
    keywords: ["arabic", "rtl", "language", "bilingual", "عربي", "عربية", "بالعربي", "لغة", "الانجليزية"],
    quick: { en: "Does it work in Arabic?", ar: "هل يعمل بالعربية؟" },
    question: { en: "Does it work in Arabic?", ar: "هل يعمل بالعربية؟" },
    answer: {
      en: "Fully. Diners order in Arabic or English with true right-to-left layout — menus, checkout, and order texts included. Try the live demo on the homepage and tap “See it in Arabic.”",
      ar: "تمامًا. يطلب الزبائن بالعربية أو الإنجليزية باتجاه صحيح من اليمين لليسار — القوائم والدفع ورسائل الطلب كلها. جرّب الديمو الحي في الصفحة الرئيسية.",
    },
  },
  {
    id: "keep-apps",
    keywords: ["doordash", "uber", "ubereats", "grubhub", "delivery apps", "keep", "marketplace", "دورداش", "اوبر", "أوبر", "تطبيقات"],
    quick: { en: "Can I keep DoorDash?", ar: "هل أبقي دورداش؟" },
    question: { en: "Can I keep DoorDash and Uber Eats?", ar: "هل أستطيع الإبقاء على دورداش وأوبر إيتس؟" },
    answer: {
      en: "Yes. Sofratak runs alongside the apps — most restaurants keep them for discovery and move regulars to direct ordering, where every order costs less.",
      ar: "نعم. سفرتك تعمل بجانب التطبيقات — معظم المطاعم تبقيها للاكتشاف وتحوّل زبائنها الدائمين إلى الطلب المباشر، حيث كل طلب يكلف أقل.",
    },
  },
  {
    id: "hardware",
    keywords: ["hardware", "tablet", "printer", "device", "pos", "equipment", "kitchen", "تابلت", "جهاز", "أجهزة", "طابعة", "مطبخ"],
    quick: { en: "Do I need new hardware?", ar: "هل أحتاج أجهزة؟" },
    question: { en: "Do I need new hardware?", ar: "هل أحتاج أجهزة جديدة؟" },
    answer: {
      en: "No. Orders ring on any tablet or phone with a browser, with a loud new-order alert and printable tickets. Your staff learns nothing new.",
      ar: "لا. الطلبات ترن على أي تابلت أو هاتف فيه متصفح، مع تنبيه صوتي وتذاكر للطباعة. موظفوك لا يتعلمون شيئًا جديدًا.",
    },
  },
  {
    id: "data",
    keywords: ["data", "customer list", "export", "csv", "own", "phone numbers", "cancel", "leave", "lock", "بيانات", "زبائن", "تصدير", "إلغاء", "الغاء", "ملكية"],
    quick: { en: "Who owns my data?", ar: "من يملك بياناتي؟" },
    question: { en: "Who owns my customer data?", ar: "من يملك بيانات زبائني؟" },
    answer: {
      en: "You do. Every customer and every order is exportable to CSV in one click — even if you cancel. Month-to-month, no lock-in; on cancellation we email you your complete data export automatically.",
      ar: "أنت. كل زبون وكل طلب قابل للتصدير CSV بضغطة واحدة — حتى لو ألغيت. شهر بشهر، بلا قيود؛ وعند الإلغاء نرسل لك تصدير بياناتك كاملة تلقائيًا.",
    },
  },
  {
    id: "cities",
    keywords: ["city", "cities", "area", "where", "tampa", "miami", "orlando", "dearborn", "detroit", "michigan", "florida", "serve", "مدينة", "مدن", "أين", "وين", "فلوريدا", "ميشيغان"],
    question: { en: "Which cities do you serve?", ar: "أي مدن تخدمون؟" },
    answer: {
      en: "We're starting across Florida (Tampa, St. Petersburg, Orlando, Jacksonville, Miami, Fort Lauderdale, Hollywood, West Palm Beach) and metro Detroit (Dearborn, Dearborn Heights, Detroit, Hamtramck) — and onboarding is fully remote, so if you're elsewhere, message us anyway.",
      ar: "نبدأ في فلوريدا (تامبا، سانت بطرسبرغ، أورلاندو، جاكسونفيل، ميامي، فورت لودرديل، هوليوود، وست بالم بيتش) ومنطقة ديترويت (ديربورن، ديربورن هايتس، ديترويت، هامترامك) — والانطلاق كله عن بُعد، فإذا كنت في مكان آخر راسلنا أيضًا.",
    },
  },
  {
    id: "savings",
    keywords: ["save", "savings", "estimate", "calculator", "worth", "much money", "توفير", "وفر", "حاسبة", "احسب"],
    question: { en: "How much could I save?", ar: "كم ممكن أوفر؟" },
    answer: {
      en: "Depends on your app volume — the calculator on our homepage gives you an instant estimate from three numbers, no signup. As a reference point: 500 app orders/month at a 25% blended rate is roughly $3,750/month. Illustrative estimate — actual results may vary.",
      ar: "يعتمد على حجم طلباتك — الحاسبة في صفحتنا الرئيسية تعطيك تقديرًا فوريًا من ثلاثة أرقام، بدون تسجيل. كمرجع: 500 طلب شهريًا بعمولة 25% يعني حوالي 3,750$ شهريًا. تقدير توضيحي — النتائج الفعلية قد تختلف.",
    },
  },
  {
    id: "refunds",
    keywords: ["refund", "refunds", "partial", "mistake", "wrong order", "استرجاع", "استرداد", "خطأ"],
    question: { en: "How do refunds work?", ar: "كيف تعمل الاستردادات؟" },
    answer: {
      en: "From your dashboard, on your phone: refund a whole order or individual items (partial, per line). The diner gets their money back on their card and an automatic text.",
      ar: "من لوحة التحكم، على هاتفك: استرجع طلبًا كاملًا أو أصنافًا محددة (جزئيًا، بالصنف). يعود المبلغ لبطاقة الزبون ويصله إشعار نصي تلقائي.",
    },
  },
  {
    id: "halal",
    keywords: ["halal", "badge", "حلال", "شارة"],
    question: { en: "Do you support halal restaurants?", ar: "هل تدعمون مطاعم الحلال؟" },
    answer: {
      en: "Built for them. Halal badge included on your storefront, Arabic + English ordering, and a team that already works inside the Arab hospitality community.",
      ar: "مبني لأجلهم. شارة الحلال موجودة في واجهتك، والطلب بالعربية والإنجليزية، وفريق يعمل أصلًا داخل مجتمع الضيافة العربي.",
    },
  },
  {
    id: "demo",
    keywords: ["demo", "try", "test", "see it", "meeting", "call", "talk", "ديمو", "تجربة", "جرب", "عرض", "اجتماع"],
    quick: { en: "Can I see a demo?", ar: "أشوف ديمو؟" },
    question: { en: "Can I see a demo?", ar: "هل أستطيع رؤية ديمو؟" },
    answer: {
      en: "Two ways: tap around the live demo storefront on our homepage right now (it's the real product), or book a 15-minute demo and you'll be talking to Zizo (Ahmad Zeidan) directly — not a call center.",
      ar: "طريقتان: جرّب واجهة الديمو الحية في صفحتنا الرئيسية الآن (إنها المنتج الحقيقي)، أو احجز عرضًا في 15 دقيقة وستتحدث مع زيزو (أحمد زيدان) مباشرة — لا مع مركز اتصال.",
    },
  },
  {
    id: "who-behind",
    keywords: ["who", "company", "founder", "zizo", "offbeat", "behind", "about", "من", "شركة", "مؤسس", "زيزو"],
    question: { en: "Who's behind Sofratak?", ar: "من وراء سفرتك؟" },
    answer: {
      en: "Zizo (Ahmad Zeidan), founder of Offbeat Creative — a team that spent years growing Arab restaurants across the US before building Sofratak. Read the full story on our About page.",
      ar: "زيزو (أحمد زيدان)، مؤسس Offbeat Creative — فريق قضى سنوات في تنمية المطاعم العربية عبر أمريكا قبل بناء سفرتك. اقرأ القصة كاملة في صفحة «من نحن».",
    },
  },
];
