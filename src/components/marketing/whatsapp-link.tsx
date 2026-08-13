import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * WhatsApp is how this audience actually answers (website spec: on every
 * page). Number comes from NEXT_PUBLIC_WHATSAPP_NUMBER (digits only, incl.
 * country code). Renders nothing until it's configured — never ship a
 * dead contact link.
 */
export async function WhatsAppLink({
  className,
  variant = "button",
}: {
  className?: string;
  variant?: "button" | "floating";
}) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  if (!number) return null;
  const t = await getTranslations("site");

  if (variant === "floating") {
    return (
      <a
        href={`https://wa.me/${number}`}
        target="_blank"
        rel="noreferrer"
        aria-label={t("whatsapp")}
        className={cn(
          "fixed bottom-5 z-40 flex size-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(31,31,31,0.25)] transition-transform hover:scale-105 motion-reduce:transition-none",
          "end-5 h-13 w-13",
          className,
        )}
      >
        <MessageCircle className="size-6" aria-hidden />
      </a>
    );
  }

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-[#25D366] px-6 font-bold text-white transition-opacity hover:opacity-90",
        className,
      )}
    >
      <MessageCircle className="size-5" aria-hidden />
      {t("finalCta.whatsapp")}
    </a>
  );
}
