import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import type { Locale, Localized } from "./types";

/**
 * EN/AR with logical RTL (docs/mobile-app-spec.md §2). RTL is driven by
 * locale state — row direction, text alignment, chevrons — instead of the
 * native I18nManager flag, so the in-app language toggle applies instantly
 * without an app restart, matching how the web storefront flips.
 */

const STRINGS = {
  // picker
  pickerTitle: { en: "Order from", ar: "اطلب من" },
  pickerSub: {
    en: "Choose your restaurant. We'll remember it.",
    ar: "اختر مطعمك، وسنتذكره لك.",
  },
  halal: { en: "Halal", ar: "حلال" },
  pickerError: { en: "Couldn't load restaurants. Pull to retry.", ar: "تعذر تحميل المطاعم. اسحب للمحاولة مجددًا." },
  // menu
  menuPaused: {
    en: "Ordering is paused right now — check back soon.",
    ar: "الطلب متوقف مؤقتًا، عد قريبًا.",
  },
  soldOut: { en: "Sold out", ar: "نفدت الكمية" },
  viewCart: { en: "View cart", ar: "عرض السلة" },
  switchRestaurant: { en: "Switch restaurant", ar: "تغيير المطعم" },
  menuError: { en: "Couldn't load the menu.", ar: "تعذر تحميل القائمة." },
  retry: { en: "Retry", ar: "إعادة المحاولة" },
  // item
  required: { en: "Required", ar: "مطلوب" },
  chooseUpTo: { en: "Choose up to {n}", ar: "اختر حتى {n}" },
  itemNotes: { en: "Notes (optional)", ar: "ملاحظات (اختياري)" },
  itemNotesPlaceholder: { en: "e.g. no onions", ar: "مثال: بدون بصل" },
  addToCart: { en: "Add to cart", ar: "أضف إلى السلة" },
  quantity: { en: "Quantity", ar: "الكمية" },
  // cart
  cartTitle: { en: "Your cart", ar: "سلتك" },
  cartEmpty: { en: "Your cart is empty.", ar: "سلتك فارغة." },
  browseMenu: { en: "Browse the menu", ar: "تصفح القائمة" },
  remove: { en: "Remove", ar: "إزالة" },
  subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  goToCheckout: { en: "Go to checkout", ar: "إتمام الطلب" },
  // checkout
  checkoutTitle: { en: "Checkout", ar: "إتمام الطلب" },
  pickup: { en: "Pickup", ar: "استلام" },
  delivery: { en: "Delivery", ar: "توصيل" },
  whenAsap: { en: "ASAP (~{n} min)", ar: "في أقرب وقت (~{n} دقيقة)" },
  whenSchedule: { en: "Schedule", ar: "جدولة" },
  scheduleHint: {
    en: "Within the next 7 days",
    ar: "خلال الأيام السبعة القادمة",
  },
  yourName: { en: "Your name", ar: "اسمك" },
  yourPhone: { en: "Phone number", ar: "رقم الهاتف" },
  phoneHint: {
    en: "Order updates go to this number by text.",
    ar: "تصلك تحديثات الطلب على هذا الرقم برسالة نصية.",
  },
  smsOptIn: { en: "Text me offers from this restaurant", ar: "أرسلوا لي عروض هذا المطعم" },
  deliveryAddress: { en: "Delivery address", ar: "عنوان التوصيل" },
  deliveryMinimum: { en: "Delivery minimum is {x}", ar: "الحد الأدنى للتوصيل {x}" },
  tip: { en: "Tip (100% to the restaurant)", ar: "بقشيش (يذهب كاملًا للمطعم)" },
  tipNone: { en: "None", ar: "بدون" },
  offerCode: { en: "Offer code (optional)", ar: "رمز العرض (اختياري)" },
  serviceFee: { en: "Service fee", ar: "رسوم الخدمة" },
  deliveryFee: { en: "Delivery fee", ar: "رسوم التوصيل" },
  discount: { en: "Discount", ar: "الخصم" },
  total: { en: "Total", ar: "الإجمالي" },
  payNow: { en: "Pay {x}", ar: "ادفع {x}" },
  placing: { en: "Placing order…", ar: "جارٍ إرسال الطلب…" },
  paymentCanceled: { en: "Payment canceled.", ar: "تم إلغاء الدفع." },
  checkoutError: {
    en: "Something went wrong — please try again.",
    ar: "حدث خطأ ما، حاول مرة أخرى.",
  },
  // status
  statusTitle: { en: "Order {n}", ar: "الطلب {n}" },
  statusThanks: { en: "Thank you, {name}!", ar: "شكرًا لك يا {name}!" },
  status_received: { en: "Order received", ar: "تم استلام الطلب" },
  status_preparing: { en: "Being prepared", ar: "قيد التحضير" },
  status_ready: { en: "Ready for pickup", ar: "جاهز للاستلام" },
  status_out_for_delivery: { en: "Out for delivery", ar: "في الطريق إليك" },
  status_completed: { en: "Completed", ar: "مكتمل" },
  status_canceled: { en: "Canceled — you will be refunded", ar: "أُلغي الطلب وسيُرد المبلغ" },
  paymentPending: {
    en: "Waiting for payment confirmation…",
    ar: "بانتظار تأكيد الدفع…",
  },
  newOrder: { en: "Start a new order", ar: "ابدأ طلبًا جديدًا" },
  receipt: { en: "Receipt", ar: "الإيصال" },
  // shared
  language: { en: "العربية", ar: "English" },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof STRINGS;

type I18n = {
  locale: Locale;
  isRTL: boolean;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Pick the localized side of an API Localized field. */
  l: (text: Localized) => string;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18n | null>(null);
const LOCALE_KEY = "sofratak.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LOCALE_KEY);
      if (saved === "en" || saved === "ar") {
        setLocale(saved);
      } else {
        const device = getLocales()[0]?.languageCode;
        if (device === "ar") setLocale("ar");
      }
    })();
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "en" ? "ar" : "en";
      AsyncStorage.setItem(LOCALE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<I18n>(
    () => ({
      locale,
      isRTL: locale === "ar",
      t: (key, vars) => {
        let out: string = STRINGS[key][locale];
        for (const [k, v] of Object.entries(vars ?? {})) {
          out = out.replace(`{${k}}`, String(v));
        }
        return out;
      },
      l: (text) => text[locale] || text.en,
      toggleLocale,
    }),
    [locale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  return ctx;
}

/** $12.34 for en, Arabic-formatted for ar — mirrors web formatCents. */
export function formatCents(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
