"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createAuthBrowserClient } from "@/lib/auth/browser";

export function LoginForm({ next }: { next: string | null }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createAuthBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(t("invalidCredentials"));
      setPending(false);
      return;
    }
    // Full navigation so the fresh auth cookies reach the server layouts.
    // `next` is constrained to same-origin paths to avoid open redirects.
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    window.location.assign(target);
  };

  const inputCls =
    "h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
      <label>
        <span className="text-sm font-bold text-olive">{t("email")}</span>
        <input
          type="email"
          dir="ltr"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputCls} mt-1`}
        />
      </label>
      <label>
        <span className="text-sm font-bold text-olive">{t("password")}</span>
        <input
          type="password"
          dir="ltr"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputCls} mt-1`}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-btn bg-olive font-bold text-ivory transition-opacity disabled:opacity-50"
      >
        {pending ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}
