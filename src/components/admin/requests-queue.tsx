"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, ImageIcon, Lightbulb, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { updateServiceRequestAction } from "@/app/[locale]/(admin)/admin/actions";

export type AdminRequestView = {
  id: string;
  restaurantName: string;
  category: string;
  kind: string;
  target: Record<string, unknown>;
  note: string | null;
  noteLocale: string;
  status: "received" | "in_progress" | "waiting" | "done";
  reply: string | null;
  ownerReply: string | null;
  pricingFlag: boolean;
  voiceUrl: string | null;
  photoUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

const STATUSES = ["received", "in_progress", "waiting", "done"] as const;

/** SLA badge (spec §4): green <12h, brass <20h, clay overdue (>24h). */
function slaBadge(createdAt: string): { label: string; cls: string } {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  const left = 24 - hours;
  if (left <= 0)
    return { label: `${Math.ceil(-left)}h over`, cls: "bg-clay text-white" };
  if (hours >= 12)
    return { label: `${Math.floor(left)}h left`, cls: "bg-brass text-ivory" };
  return { label: `${Math.floor(left)}h left`, cls: "bg-positive text-white" };
}

export function RequestsQueue({ requests }: { requests: AdminRequestView[] }) {
  const t = useTranslations("admin");
  const tReq = useTranslations("dash.requests");
  const router = useRouter();
  const [filter, setFilter] = useState<"open" | "all" | "flagged">("open");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const visible = requests.filter((r) =>
    filter === "open" ? r.status !== "done" : filter === "flagged" ? r.pricingFlag : true,
  );

  const update = async (
    id: string,
    patch: { status?: (typeof STATUSES)[number]; reply?: string },
  ) => {
    setBusy(id);
    await updateServiceRequestAction(id, patch);
    setBusy(null);
    setDrafts((d) => ({ ...d, [id]: "" }));
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(["open", "flagged", "all"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "press rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              filter === key
                ? "border-olive bg-olive text-ivory"
                : "border-olive/20 bg-white text-charcoal hover:border-olive/50",
            )}
          >
            {t(`requestsFilter.${key}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="rounded-card border border-olive/10 bg-white p-6 text-sm text-stone">
          {t("requestsEmpty")}
        </p>
      )}

      {visible.map((r) => {
        const sla = r.status === "done" ? null : slaBadge(r.createdAt);
        const insight = r.category === "marketing" || r.category === "idea";
        return (
          <article key={r.id} className="card-crisp rounded-card bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              {sla && (
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", sla.cls)} dir="ltr">
                  {sla.label}
                </span>
              )}
              <span className="font-bold text-olive">{r.restaurantName}</span>
              <span className="text-sm font-semibold text-stone">
                {tReq(`categories.${r.category}`)} · {tReq(`kinds.${r.kind}`)}
              </span>
              {insight && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brass/15 px-2.5 py-1 text-xs font-bold text-brass-deep">
                  <Lightbulb className="size-3.5" aria-hidden />
                  {t("requestsInsight")}
                </span>
              )}
              {r.pricingFlag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-clay/15 px-2.5 py-1 text-xs font-bold text-clay">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  {t("requestsPricingFlag")}
                </span>
              )}
              <span className="ms-auto text-xs text-stone" dir="ltr">
                {new Date(r.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>

            {Object.keys(r.target).length > 0 && (
              <p className="mt-2 font-mono text-xs text-stone">{JSON.stringify(r.target)}</p>
            )}
            {r.note && (
              <p className="mt-2 text-[15px] text-charcoal" dir={r.noteLocale === "ar" ? "rtl" : "ltr"}>
                {r.note}
              </p>
            )}
            {r.voiceUrl && (
               
              <audio src={r.voiceUrl} controls className="mt-2 h-10 w-full max-w-sm" />
            )}
            {r.photoUrl && (
              <a href={r.photoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brass-deep underline-offset-4 hover:underline">
                <ImageIcon className="size-4" aria-hidden />
                {t("requestsPhoto")}
              </a>
            )}
            {r.ownerReply && (
              <div className="mt-2 rounded-xl bg-olive/5 p-3">
                <p className="text-xs font-bold text-stone uppercase">{t("requestsOwnerReply")}</p>
                <p className="mt-0.5 text-sm text-charcoal">{r.ownerReply}</p>
              </div>
            )}
            {r.reply && (
              <div className="mt-2 rounded-xl bg-sand-soft/50 p-3">
                <p className="text-xs font-bold text-stone uppercase">{t("requestsOurReply")}</p>
                <p className="mt-0.5 text-sm text-charcoal">{r.reply}</p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy === r.id || r.status === status}
                  onClick={() => update(r.id, { status })}
                  className={cn(
                    "press rounded-full border px-3 py-1.5 text-xs font-bold disabled:cursor-default",
                    r.status === status
                      ? "border-olive bg-olive text-ivory"
                      : "border-olive/20 bg-white text-charcoal hover:border-olive/50 disabled:opacity-50",
                  )}
                >
                  {tReq(`status.${status}`)}
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex gap-2">
              <input
                value={drafts[r.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                placeholder={t("requestsReplyPlaceholder")}
                maxLength={1000}
                className="h-10 min-w-0 flex-1 rounded-field border border-olive/20 bg-white px-3.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
              <button
                type="button"
                disabled={busy === r.id || !(drafts[r.id] ?? "").trim()}
                onClick={() => update(r.id, { reply: drafts[r.id] })}
                aria-label={t("requestsSendReply")}
                className="press flex size-10 shrink-0 items-center justify-center rounded-btn bg-olive text-ivory disabled:opacity-50"
              >
                <Send className="size-4 rtl:-scale-x-100" aria-hidden />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
