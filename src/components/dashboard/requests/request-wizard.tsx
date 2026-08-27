"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Camera,
  Check,
  CircleCheck,
  LayoutGrid,
  Lightbulb,
  Megaphone,
  Mic,
  ReceiptText,
  Square,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createServiceRequestAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

const CATEGORIES = [
  { key: "storefront", icon: Store },
  { key: "menu", icon: UtensilsCrossed },
  { key: "dashboard", icon: LayoutGrid },
  { key: "orders", icon: ReceiptText },
  { key: "marketing", icon: Megaphone },
  { key: "idea", icon: Lightbulb },
  { key: "other", icon: Check },
] as const;

const KINDS = ["fix", "change", "add", "teach", "other"] as const;

/** storefront hotspot regions over the scaled live iframe (fractions) */
const STOREFRONT_SECTIONS = [
  { key: "hero", top: 0, height: 0.22 },
  { key: "menuSection", top: 0.22, height: 0.4 },
  { key: "photos", top: 0.62, height: 0.14 },
  { key: "hours", top: 0.76, height: 0.12 },
  { key: "footer", top: 0.88, height: 0.12 },
] as const;

const DASHBOARD_AREAS = ["today", "orders", "menuManager", "marketing", "settings", "reports"] as const;

const MAX_VOICE_SECONDS = 60;

export type WizardMenuItem = { id: string; name: string };

type Step = 1 | 2 | 3 | "sent";

/**
 * The 3-tap concierge flow (docs/concierge-requests-spec.md §2):
 * category → point at the exact thing (their REAL storefront/menu) →
 * fix/change/add chips + optional note, voice note (MediaRecorder →
 * private bucket), or photo. Tapping advances — no Next buttons.
 */
export function RequestWizard({
  slug,
  storefrontUrl,
  menuItems,
  onClose,
  onSubmitted,
}: {
  slug: string;
  storefrontUrl: string;
  menuItems: WizardMenuItem[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const t = useTranslations("dash.requests");
  const locale = useLocale() as "en" | "ar";

  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // voice note
  const [recording, setRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState(false);

  useEffect(
    () => () => {
      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [voiceUrl],
  );

  const startRecording = async () => {
    setVoiceError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
      setVoiceSeconds(0);
      timerRef.current = setInterval(() => {
        setVoiceSeconds((s) => {
          if (s + 1 >= MAX_VOICE_SECONDS) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch {
      setVoiceError(true);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const discardVoice = () => {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setVoiceSeconds(0);
  };

  const pickCategory = (key: string) => {
    setCategory(key);
    // marketing / idea / other skip straight to step 3 (spec)
    setStep(key === "storefront" || key === "menu" || key === "dashboard" ? 2 : 3);
  };

  const target = (): Record<string, unknown> => {
    if (category === "storefront" && section) return { page: "storefront", section };
    if (category === "menu" && itemIds.length) return { menuItemIds: itemIds };
    if (category === "dashboard" && area) return { area };
    return {};
  };

  const submit = async () => {
    if (!category || !kind || sending) return;
    setSending(true);
    setError(null);
    const form = new FormData();
    form.set("category", category);
    form.set("kind", kind);
    form.set("target", JSON.stringify(target()));
    form.set("note", note);
    form.set("noteLocale", locale);
    if (voiceBlob) {
      form.set("voice", new File([voiceBlob], "voice-note", { type: voiceBlob.type || "audio/webm" }));
    }
    if (photo) form.set("photo", photo);
    const res = await createServiceRequestAction(slug, form);
    setSending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setStep("sent");
    onSubmitted();
  };

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(itemQuery.trim().toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-ivory" role="dialog" aria-modal>
      {/* header */}
      <div className="glass-olive flex h-14 shrink-0 items-center justify-between px-4 text-ivory">
        <button
          type="button"
          onClick={() => {
            if (step === 2) setStep(1);
            else if (step === 3) setStep(category === "marketing" || category === "idea" || category === "other" ? 1 : 2);
            else onClose();
          }}
          className="press flex items-center gap-1.5 rounded-btn px-2 py-1.5 text-sm font-semibold hover:bg-ivory/10"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {step === 1 || step === "sent" ? t("close") : t("back")}
        </button>
        <p className="text-sm font-bold">{t("promiseShort")}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="press rounded-btn p-2 hover:bg-ivory/10"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-lg">
          {/* Step 1 — what's it about? */}
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl font-bold text-olive">{t("step1Title")}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {CATEGORIES.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pickCategory(key)}
                    className="press glow-hover card-crisp flex h-28 flex-col items-start justify-between rounded-card bg-white p-4 text-start transition-colors hover:bg-olive/[0.04]"
                  >
                    <Icon className="size-6 text-brass" aria-hidden />
                    <span className="text-sm font-bold text-charcoal">{t(`categories.${key}`)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2 — show us where (fix 4: the visual iframe picker
              was cramped and its zones were invisible until hover,
              which doesn't exist on touch. Desktop keeps a wider,
              always-labeled picker with a real hover/tap ring; mobile
              swaps to a clean full-width card list — same real
              storefront, no overlay to fight with on a small screen. */}
          {step === 2 && category === "storefront" && (
            <>
              <h2 className="font-display text-2xl font-bold text-olive">{t("step2Title")}</h2>
              <p className="mt-1 text-sm text-stone">{t("step2StorefrontHint")}</p>

              {/* mobile: labeled card list, no overlay */}
              <div className="mt-4 flex flex-col gap-2.5 sm:hidden">
                {STOREFRONT_SECTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setSection(s.key);
                      setStep(3);
                    }}
                    className={cn(
                      "press card-crisp flex min-h-11 items-center justify-between gap-2 rounded-card bg-white px-4 py-3.5 text-start transition-colors",
                      section === s.key ? "ring-2 ring-brass" : "hover:bg-olive/[0.04]",
                    )}
                  >
                    <span className="font-bold text-charcoal">{t(`sections.${s.key}`)}</span>
                    <ArrowLeft className="size-4 shrink-0 rotate-180 text-stone rtl:rotate-0" aria-hidden />
                  </button>
                ))}
              </div>

              {/* desktop: the real storefront with always-labeled,
                  always-separated hotspot bands */}
              <div className="hidden sm:block">
                <div className="card-crisp relative mx-auto mt-4 h-[32rem] w-full max-w-sm overflow-hidden rounded-card bg-white">
                  <iframe
                    src={storefrontUrl}
                    title=""
                    tabIndex={-1}
                    aria-hidden
                    className="pointer-events-none origin-top-left"
                    style={{ width: "200%", height: "200%", transform: "scale(0.5)" }}
                  />
                  {STOREFRONT_SECTIONS.map((s, i) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        setSection(s.key);
                        setStep(3);
                      }}
                      style={{ top: `${s.top * 100}%`, height: `${s.height * 100}%` }}
                      className={cn(
                        "group absolute inset-x-0 flex items-center justify-center transition-colors",
                        // a visible seam between every band, even at rest —
                        // this is what makes 5 stacked zones read as 5
                        // distinct regions instead of one blank overlay
                        i > 0 && "border-t-2 border-ivory/80",
                        section === s.key
                          ? "z-10 bg-brass/20 ring-2 ring-brass ring-inset"
                          : "hover:bg-brass/10 focus-visible:bg-brass/10",
                      )}
                    >
                      <span
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-colors",
                          section === s.key
                            ? "bg-brass text-ivory"
                            : "bg-olive/80 text-ivory group-hover:bg-olive",
                        )}
                      >
                        {t(`sections.${s.key}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setStep(3)} className="mt-4 text-sm font-semibold text-stone underline-offset-4 hover:underline">
                {t("skipStep")}
              </button>
            </>
          )}

          {step === 2 && category === "menu" && (
            <>
              <h2 className="font-display text-2xl font-bold text-olive">{t("step2Title")}</h2>
              <p className="mt-1 text-sm text-stone">{t("step2MenuHint")}</p>
              <input
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                placeholder={t("menuSearch")}
                className="mt-4 h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
              <ul className="card-crisp mt-3 max-h-72 divide-y divide-olive/8 overflow-y-auto rounded-card bg-white">
                {filteredItems.map((item) => {
                  const selected = itemIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setItemIds(selected ? itemIds.filter((id) => id !== item.id) : [...itemIds, item.id])
                        }
                        className="flex w-full items-center justify-between px-4 py-3 text-start text-[15px] text-charcoal hover:bg-olive/[0.04]"
                      >
                        {item.name}
                        {selected && <Check className="size-4.5 text-brass" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
                {filteredItems.length === 0 && (
                  <li className="px-4 py-3 text-sm text-stone">{t("noItems")}</li>
                )}
              </ul>
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={itemIds.length === 0}
                  className="press btn-shine h-11 rounded-btn bg-brass px-6 font-bold text-ivory disabled:opacity-40"
                >
                  {t("continueWith", { count: itemIds.length })}
                </button>
                <button type="button" onClick={() => setStep(3)} className="text-sm font-semibold text-stone underline-offset-4 hover:underline">
                  {t("skipStep")}
                </button>
              </div>
            </>
          )}

          {step === 2 && category === "dashboard" && (
            <>
              <h2 className="font-display text-2xl font-bold text-olive">{t("step2Title")}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {DASHBOARD_AREAS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setArea(key);
                      setStep(3);
                    }}
                    className="press card-crisp flex h-20 items-center justify-center rounded-card bg-white p-4 text-sm font-bold text-charcoal hover:bg-olive/[0.04]"
                  >
                    {t(`areas.${key}`)}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep(3)} className="mt-4 text-sm font-semibold text-stone underline-offset-4 hover:underline">
                {t("skipStep")}
              </button>
            </>
          )}

          {/* Step 3 — what do you need? */}
          {step === 3 && (
            <>
              <h2 className="font-display text-2xl font-bold text-olive">{t("step3Title")}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {KINDS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKind(key)}
                    className={cn(
                      "press rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      kind === key
                        ? "chip-pop border-olive bg-olive text-ivory"
                        : "border-olive/20 bg-white text-charcoal hover:border-olive/50",
                    )}
                  >
                    {t(`kinds.${key}`)}
                  </button>
                ))}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t("notePlaceholder")}
                className="mt-4 w-full rounded-field border border-olive/20 bg-white p-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />

              {/* voice note — the killer input */}
              <div className="card-crisp mt-3 rounded-card bg-white p-4">
                {!voiceBlob && !recording && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="press flex items-center gap-2.5 font-semibold text-olive"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-brass text-ivory">
                      <Mic className="size-5" aria-hidden />
                    </span>
                    {t("recordVoice")}
                  </button>
                )}
                {recording && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={stopRecording}
                      aria-label={t("stopRecording")}
                      className="press flex size-10 items-center justify-center rounded-full bg-error text-white"
                    >
                      <Square className="size-4 fill-current" aria-hidden />
                    </button>
                    <span className="size-2.5 animate-pulse rounded-full bg-error" aria-hidden />
                    <span className="font-semibold text-charcoal tabular-nums" dir="ltr">
                      0:{String(voiceSeconds).padStart(2, "0")} / 1:00
                    </span>
                  </div>
                )}
                {voiceBlob && voiceUrl && (
                  <div className="flex items-center gap-3">
                    { }
                    <audio src={voiceUrl} controls className="h-10 min-w-0 flex-1" />
                    <button
                      type="button"
                      onClick={discardVoice}
                      aria-label={t("reRecord")}
                      className="press flex size-9 shrink-0 items-center justify-center rounded-full bg-olive/8 text-stone hover:text-error"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
                {voiceError && <p className="mt-2 text-sm font-semibold text-error">{t("micDenied")}</p>}
              </div>

              {/* photo attach */}
              <label className="card-crisp mt-3 flex cursor-pointer items-center gap-2.5 rounded-card bg-white p-4 font-semibold text-olive">
                <span className="flex size-10 items-center justify-center rounded-full bg-olive/8 text-olive">
                  <Camera className="size-5" aria-hidden />
                </span>
                {photo ? photo.name : t("attachPhoto")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </label>

              {error && (
                <p role="alert" className="mt-3 text-sm font-semibold text-error">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={!kind || sending}
                className="press btn-shine glow-brass mt-5 h-13 w-full rounded-btn bg-brass text-lg font-bold text-ivory disabled:opacity-40"
              >
                {sending ? t("sending") : t("send")}
              </button>
            </>
          )}

          {/* confirmation */}
          {step === "sent" && (
            <div className="flex flex-col items-center pt-16 text-center">
              <span className="animate-rise-in flex size-20 items-center justify-center rounded-full bg-positive/10">
                <CircleCheck className="size-11 text-positive" aria-hidden />
              </span>
              <h2 className="font-display mt-5 text-2xl font-bold text-olive">{t("sentTitle")}</h2>
              <p className="mt-2 max-w-sm text-stone">{t("sentBody")}</p>
              <button
                type="button"
                onClick={onClose}
                className="press mt-7 h-12 rounded-btn bg-olive px-8 font-bold text-ivory"
              >
                {t("done")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
