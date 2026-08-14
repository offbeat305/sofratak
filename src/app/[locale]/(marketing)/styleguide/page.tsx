import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { ModalDemo } from "./demos";

// Internal dev reference, not a customer-facing page — never index it.
export const metadata: Metadata = { title: "Styleguide", robots: { index: false, follow: false } };

const swatches = [
  { name: "olive", hex: "#2F4A3C", usage: "primary — nav, headings, icons", cls: "bg-olive" },
  { name: "sand", hex: "#D8C19A", usage: "secondary — accents, badges", cls: "bg-sand" },
  { name: "brass", hex: "#A9792B", usage: "accent — CTAs, money numbers (≤8%)", cls: "bg-brass" },
  { name: "ivory", hex: "#F7F2E8", usage: "main background", cls: "bg-ivory border border-olive/15" },
  { name: "charcoal", hex: "#1F1F1F", usage: "body text", cls: "bg-charcoal" },
  { name: "stone", hex: "#6B6B6B", usage: "secondary text", cls: "bg-stone" },
  { name: "clay", hex: "#A56B52", usage: "warnings, rare warm accent (≤2%)", cls: "bg-clay" },
  { name: "positive", hex: "#1B7A4A", usage: "positive deltas", cls: "bg-positive" },
  { name: "error", hex: "#D92D20", usage: "errors", cls: "bg-error" },
];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-20">
      <div>
        <h2 className="text-2xl font-bold text-olive">{title}</h2>
        {note && <p className="mt-1 text-sm text-stone">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** Renders the same component twice: English LTR and Arabic RTL, side by side. */
function Duo({ en, ar }: { en: React.ReactNode; ar: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card dir="ltr" className="flex flex-col items-start gap-4">
        <Badge variant="olive">EN · LTR</Badge>
        <div className="w-full">{en}</div>
      </Card>
      <Card dir="rtl" lang="ar" className="flex flex-col items-start gap-4">
        <Badge variant="olive">AR · RTL</Badge>
        <div className="w-full">{ar}</div>
      </Card>
    </div>
  );
}

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold text-olive sm:text-5xl">
          Sofratak Styleguide
        </h1>
        <p className="max-w-2xl text-stone">
          Every core component in English (LTR) and Arabic (RTL). Toggle the
          site locale in the navbar to see the full page mirror.
        </p>
      </header>

      <Section
        title="Colors"
        note="Target ratio: 45% ivory/neutral · 25% olive · 15% sand · 8% brass · 5% charcoal/stone · 2% clay."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {swatches.map((s) => (
            <Card key={s.name} className="flex flex-col gap-3 p-4 sm:p-4">
              <div className={`h-16 rounded-field ${s.cls}`} />
              <div>
                <p className="text-sm font-bold text-charcoal">{s.name}</p>
                <p className="text-xs text-stone uppercase" dir="ltr">
                  {s.hex}
                </p>
                <p className="mt-1 text-xs text-stone">{s.usage}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Typography"
        note="Cormorant Garamond: marketing hero + major headlines only. Manrope: all UI. IBM Plex Sans Arabic: Arabic UI."
      >
        <Duo
          en={
            <div className="flex flex-col gap-3">
              <p className="font-display text-4xl font-bold text-olive">
                Take Control. Own Your Growth.
              </p>
              <p className="text-lg font-semibold text-charcoal">
                Manrope Semibold — section titles, table headers
              </p>
              <p className="text-[15px] text-charcoal">
                Manrope Regular — body copy. Sofratak helps restaurant owners
                save time and keep more of what they earn.
              </p>
              <p className="text-sm text-stone">
                Manrope secondary text in stone.
              </p>
              <p className="text-3xl font-bold text-brass tabular-nums">
                $12,480
              </p>
            </div>
          }
          ar={
            <div className="flex flex-col gap-3">
              <p className="font-display text-4xl font-bold text-olive">
                شغلك تحت سيطرتك
              </p>
              <p className="text-lg font-semibold text-charcoal">
                IBM Plex Sans Arabic — عناوين الأقسام
              </p>
              <p className="text-[15px] text-charcoal">
                نص أساسي — سفرتك تساعد أصحاب المطاعم على توفير الوقت والاحتفاظ
                بأرباحهم.
              </p>
              <p className="text-sm text-stone">نص ثانوي بلون ستون.</p>
              <p className="text-3xl font-bold text-brass tabular-nums" dir="ltr">
                $12,480
              </p>
            </div>
          }
        />
      </Section>

      <Section
        title="Buttons"
        note="Primary: brass. Secondary: olive outline. Dark: olive fill. 14px radius, visible focus ring."
      >
        <Duo
          en={
            <div className="flex flex-wrap items-center gap-3">
              <Button>Calculate Your Savings</Button>
              <Button variant="secondary">Book a Demo</Button>
              <Button variant="dark">View Orders</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>
          }
          ar={
            <div className="flex flex-wrap items-center gap-3">
              <Button>احسب توفيرك</Button>
              <Button variant="secondary">احجز عرضًا تجريبيًا</Button>
              <Button variant="dark">عرض الطلبات</Button>
              <Button disabled>معطّل</Button>
              <Button size="sm">صغير</Button>
              <Button size="lg">كبير</Button>
            </div>
          }
        />
      </Section>

      <Section title="Badges" note="Order states, plan tags, deltas.">
        <Duo
          en={
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Featured</Badge>
              <Badge variant="olive">Active</Badge>
              <Badge variant="brass">Savings</Badge>
              <Badge variant="clay">Attention</Badge>
              <Badge variant="success">Order ready</Badge>
              <Badge variant="error">Payment failed</Badge>
            </div>
          }
          ar={
            <div className="flex flex-wrap items-center gap-2">
              <Badge>مميز</Badge>
              <Badge variant="olive">نشط</Badge>
              <Badge variant="brass">توفير</Badge>
              <Badge variant="clay">انتباه</Badge>
              <Badge variant="success">الطلب جاهز</Badge>
              <Badge variant="error">فشل الدفع</Badge>
            </div>
          }
        />
      </Section>

      <Section
        title="Cards"
        note="24px radius, subtle border + shadow, generous padding. Interactive cards lift on hover."
      >
        <Duo
          en={
            <Card tone="ivory" interactive className="p-6">
              <h3 className="text-lg font-bold text-olive">
                Direct Online Ordering
              </h3>
              <p className="mt-2 text-sm text-charcoal">
                Your own branded ordering site. No marketplace commissions —
                every order goes straight to you.
              </p>
            </Card>
          }
          ar={
            <Card tone="ivory" interactive className="p-6">
              <h3 className="text-lg font-bold text-olive">طلب مباشر أونلاين</h3>
              <p className="mt-2 text-sm text-charcoal">
                موقع طلبات بهوية مطعمك. بدون عمولات تطبيقات — كل طلب يصلك
                مباشرة.
              </p>
            </Card>
          }
        />
      </Section>

      <Section
        title="Inputs & Select"
        note="14px radius, olive focus ring, real red for errors. Chevrons and padding flip in RTL."
      >
        <Duo
          en={
            <div className="flex flex-col gap-4">
              <Input label="Restaurant name" placeholder="e.g. Zaytoon Grill" />
              <Input
                label="Email"
                type="email"
                placeholder="you@restaurant.com"
                error="Email is required."
              />
              <Select label="Cuisine" hint="Used to tailor your storefront.">
                <option>Middle Eastern</option>
                <option>Mediterranean</option>
                <option>Halal American</option>
              </Select>
            </div>
          }
          ar={
            <div className="flex flex-col gap-4">
              <Input label="اسم المطعم" placeholder="مثال: مشاوي الزيتون" />
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="you@restaurant.com"
                error="البريد الإلكتروني مطلوب."
              />
              <Select label="نوع المطبخ" hint="يُستخدم لتخصيص واجهة متجرك.">
                <option>شرق أوسطي</option>
                <option>متوسطي</option>
                <option>أمريكي حلال</option>
              </Select>
            </div>
          }
        />
      </Section>

      <Section
        title="Modal"
        note="24px radius, dimmed overlay, Escape to close, reduced motion respected."
      >
        <Duo en={<ModalDemo dir="ltr" />} ar={<ModalDemo dir="rtl" />} />
      </Section>

      <Section
        title="StatCard"
        note="Money numbers in brass Manrope Bold with count-up on scroll. Deltas use restrained green / real red."
      >
        <Duo
          en={
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Potential Monthly Savings"
                value={2350}
                format="currency"
                delta={12}
                deltaLabel="vs last month"
              />
              <StatCard
                label="Orders this week"
                value={418}
                delta={-4}
                deltaLabel="vs last week"
              />
            </div>
          }
          ar={
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="التوفير الشهري المحتمل"
                value={2350}
                format="currency"
                delta={12}
                deltaLabel="مقارنة بالشهر الماضي"
              />
              <StatCard
                label="طلبات هذا الأسبوع"
                value={418}
                delta={-4}
                deltaLabel="مقارنة بالأسبوع الماضي"
              />
            </div>
          }
        />
      </Section>

      <Section
        title="Navbar & Footer"
        note="Rendered live on this page — the navbar above and footer below. Use the language toggle to see them fully mirrored in Arabic RTL."
      >
        <Card className="p-6">
          <p className="text-sm text-stone">
            Sticky ivory navbar with olive links and one brass CTA · olive
            footer with sand section labels and the EN/AR toggle.
          </p>
        </Card>
      </Section>
    </div>
  );
}
