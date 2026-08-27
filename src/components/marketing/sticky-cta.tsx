"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { Button } from "@/components/marketing/button";

/**
 * Mobile-only sticky CTA bar (the Zay-OS "call/text" pattern, done our
 * way): estimator + WhatsApp, appearing after the hero so it never
 * competes with the hero's own CTAs. Hidden on the pages it points to.
 */
export function StickyCta({ whatsappNumber }: { whatsappNumber: string | null }) {
  const t = useTranslations("site.nav");
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/calculator" || pathname === "/demo") return null;
  if (!show) return null;

  return (
    <div className="animate-rise-in fixed inset-x-0 bottom-0 z-40 border-t border-olive/15 bg-ivory/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg gap-2">
        <Button href="/calculator" className="flex-1">
          {t("estimator")}
        </Button>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="flex size-12 items-center justify-center rounded-btn bg-[#25D366] text-white"
          >
            <MessageCircle className="size-6" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}
