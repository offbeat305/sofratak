"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Megaphone } from "lucide-react";
import { createAndSendCampaignAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/marketing/actions";
import type { Campaign, CampaignChannel, CampaignSegment } from "@/lib/db/types";

const inputCls =
  "h-10 rounded-field border border-olive/20 bg-white px-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

export function CampaignsCard({ slug, campaigns }: { slug: string; campaigns: Campaign[] }) {
  const t = useTranslations("dash.marketing");
  const locale = useLocale() as "en" | "ar";
  const [pending, startTransition] = useTransition();
  const [channel, setChannel] = useState<CampaignChannel>("sms");
  const [segment, setSegment] = useState<CampaignSegment>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createAndSendCampaignAction(slug, locale, {
        channel,
        segment,
        subject,
        body,
      });
      if (result.ok) {
        setMessage(t("sentToast", { sent: result.sentCount, failed: result.failedCount }));
        setBody("");
        setSubject("");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-olive">
        <Megaphone className="size-4" aria-hidden />
        {t("campaignsTitle")}
      </h2>
      <p className="mt-1 text-sm text-stone">{t("campaignsSub")}</p>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex gap-2" role="group">
          {(["sms", "email"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`h-9 flex-1 rounded-field border text-sm font-bold ${
                channel === c ? "border-olive bg-olive text-ivory" : "border-olive/20 text-charcoal"
              }`}
            >
              {t(c === "sms" ? "channelSms" : "channelEmail")}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
          {t("segmentLabel")}
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as CampaignSegment)}
            className={inputCls}
          >
            <option value="all">{t("segmentAll")}</option>
            <option value="vip">{t("segmentVip")}</option>
            <option value="lapsed">{t("segmentLapsed")}</option>
            <option value="new">{t("segmentNew")}</option>
          </select>
        </label>

        {channel === "email" && (
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("subjectLabel")}
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("subjectPlaceholder")}
              className={inputCls}
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
          {t("bodyLabel")}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("bodyPlaceholder")}
            rows={4}
            maxLength={1600}
            className="rounded-field border border-olive/20 bg-white p-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
          />
        </label>

        <button
          type="button"
          onClick={send}
          disabled={pending || !body.trim()}
          className="h-11 self-start rounded-btn bg-brass px-5 text-sm font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
        >
          {pending ? t("sending") : t("send")}
        </button>

        {message && <p className="text-sm font-semibold text-positive">{message}</p>}
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </div>

      {campaigns.length > 0 && (
        <div className="mt-5 border-t border-olive/10 pt-4">
          <p className="mb-2 text-xs font-bold tracking-wide text-stone uppercase">
            {t("historyTitle")}
          </p>
          <ul className="flex flex-col gap-2">
            {campaigns.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-charcoal">{c.subject || c.body.slice(0, 40)}</span>
                <span className="shrink-0 text-stone">
                  {c.status === "sent" ? `${c.sentCount}/${c.recipientCount}` : t("statusDraft")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
