"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Clock, ImageIcon, Plus, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { replyServiceRequestAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";
import { RequestWizard, type WizardMenuItem } from "./request-wizard";

export type RequestView = {
  id: string;
  category: string;
  kind: string;
  targetLabel: string | null;
  note: string | null;
  status: "received" | "in_progress" | "waiting" | "done";
  reply: string | null;
  ownerReply: string | null;
  /** signed URLs (1h) — minted server-side from the private bucket */
  voiceUrl: string | null;
  photoUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

const STATUS_STYLE: Record<RequestView["status"], string> = {
  received: "bg-olive/8 text-stone",
  in_progress: "bg-brass/15 text-brass-deep",
  waiting: "bg-clay/15 text-clay",
  done: "bg-positive/10 text-positive",
};

function hoursBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 3_600_000));
}

/**
 * The Requests tab (docs/concierge-requests-spec.md §1/§3): the 24-hour
 * promise up top, the 3-tap wizard behind one brass button, and every
 * request tracked like an order card — Done cards show "Completed in
 * Nh" so the SLA becomes visible proof.
 */
export function RequestsView({
  slug,
  requests,
  storefrontUrl,
  menuItems,
}: {
  slug: string;
  requests: RequestView[];
  storefrontUrl: string;
  menuItems: WizardMenuItem[];
}) {
  const t = useTranslations("dash.requests");
  const locale = useLocale();
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySending, setReplySending] = useState<string | null>(null);

  const sendReply = async (id: string) => {
    const text = (replyDrafts[id] ?? "").trim();
    if (!text) return;
    setReplySending(id);
    const res = await replyServiceRequestAction(slug, id, text);
    setReplySending(null);
    if (res.ok) {
      setReplyDrafts((d) => ({ ...d, [id]: "" }));
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="edge-light glow-brass rounded-card bg-olive p-6 text-ivory">
        <h1 className="font-display text-2xl font-bold">{t("headline")}</h1>
        <p className="mt-1 text-ivory/75">{t("sub")}</p>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="press btn-shine mt-5 inline-flex h-12 items-center gap-2 rounded-btn bg-brass px-6 font-bold text-ivory"
        >
          <Plus className="size-5" aria-hidden />
          {t("newRequest")}
        </button>
      </div>

      {requests.length === 0 && (
        <p className="card-crisp rounded-card bg-white p-6 text-sm text-stone">{t("empty")}</p>
      )}

      {requests.map((request) => (
        <article key={request.id} className="card-crisp rounded-card bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", STATUS_STYLE[request.status])}>
              {t(`status.${request.status}`)}
            </span>
            <span className="text-sm font-bold text-olive">
              {t(`categories.${request.category}`)} · {t(`kinds.${request.kind}`)}
            </span>
            {request.status === "done" && request.completedAt && (
              <span className="ms-auto inline-flex items-center gap-1 text-xs font-bold text-positive">
                <Clock className="size-3.5" aria-hidden />
                {t("completedIn", { hours: hoursBetween(request.createdAt, request.completedAt) })}
              </span>
            )}
          </div>

          {request.targetLabel && (
            <p className="mt-2 text-sm text-stone">{request.targetLabel}</p>
          )}
          {request.note && <p className="mt-2 text-[15px] text-charcoal">{request.note}</p>}
          {request.voiceUrl && (
             
            <audio src={request.voiceUrl} controls className="mt-3 h-10 w-full max-w-sm" />
          )}
          {request.photoUrl && (
            <a
              href={request.photoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brass-deep underline-offset-4 hover:underline"
            >
              <ImageIcon className="size-4" aria-hidden />
              {t("viewPhoto")}
            </a>
          )}

          {request.reply && (
            <div className="mt-3 rounded-xl bg-sand-soft/50 p-3.5">
              <p className="text-xs font-bold tracking-wide text-stone uppercase">{t("ourReply")}</p>
              <p className="mt-1 text-[15px] text-charcoal">{request.reply}</p>
            </div>
          )}
          {request.ownerReply && (
            <div className="mt-2 rounded-xl bg-olive/5 p-3.5">
              <p className="text-xs font-bold tracking-wide text-stone uppercase">{t("yourReply")}</p>
              <p className="mt-1 text-[15px] text-charcoal">{request.ownerReply}</p>
            </div>
          )}

          {/* one follow-up per request, only after we've said something */}
          {!request.ownerReply && (request.reply || request.status === "waiting") && (
            <div className="mt-3 flex gap-2">
              <input
                value={replyDrafts[request.id] ?? ""}
                onChange={(e) => setReplyDrafts((d) => ({ ...d, [request.id]: e.target.value }))}
                placeholder={t("replyPlaceholder")}
                maxLength={1000}
                className="h-11 min-w-0 flex-1 rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
              <button
                type="button"
                onClick={() => sendReply(request.id)}
                disabled={replySending === request.id}
                aria-label={t("sendReply")}
                className="press flex size-11 shrink-0 items-center justify-center rounded-btn bg-olive text-ivory disabled:opacity-50"
              >
                <Send className="size-4.5 rtl:-scale-x-100" aria-hidden />
              </button>
            </div>
          )}

          <p className="mt-3 text-xs text-stone" dir="ltr">
            {new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(request.createdAt))}
          </p>
        </article>
      ))}

      {wizardOpen && (
        <RequestWizard
          slug={slug}
          storefrontUrl={storefrontUrl}
          menuItems={menuItems}
          onClose={() => setWizardOpen(false)}
          onSubmitted={() => router.refresh()}
        />
      )}
    </div>
  );
}
