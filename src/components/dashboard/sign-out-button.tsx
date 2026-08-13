"use client";

import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { createAuthBrowserClient } from "@/lib/auth/browser";

export function SignOutButton() {
  const t = useTranslations("auth");
  const signOut = async () => {
    await createAuthBrowserClient().auth.signOut();
    window.location.assign("/");
  };
  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-stone hover:bg-olive/5 hover:text-olive"
    >
      <LogOut className="size-4" aria-hidden />
      {t("signOut")}
    </button>
  );
}
