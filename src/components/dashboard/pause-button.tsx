"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { CirclePause, CirclePlay } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { setPausedAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

/** The big, obvious pause switch — owners reach for this during a rush. */
export function PauseButton({ slug, paused }: { slug: string; paused: boolean }) {
  const t = useTranslations("dash");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      await setPausedAction(slug, !paused);
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-btn px-4 text-sm font-bold transition-colors disabled:opacity-50",
        paused
          ? "bg-positive text-white"
          : "border-[1.5px] border-error/50 text-error hover:bg-error/5",
      )}
    >
      {paused ? (
        <CirclePlay className="size-4" aria-hidden />
      ) : (
        <CirclePause className="size-4" aria-hidden />
      )}
      {paused ? t("resume") : t("pause")}
    </button>
  );
}
