import { getTranslations } from "next-intl/server";
import { Check, X } from "lucide-react";
import { Reveal } from "./reveal";

type Row = { label: string; apps: string; us: string };

/** Honest side-by-side: generic "delivery apps" vs Sofratak. No named
 * competitors, no unverifiable numbers — estimates marked as estimates. */
export async function ComparisonTable() {
  const t = await getTranslations("site.compare");
  const tSite = await getTranslations("site");
  const rows = t.raw("rows") as Row[];

  return (
    <Reveal>
      <div className="overflow-x-auto rounded-card border border-olive/10 bg-white shadow-[0_1px_3px_rgba(31,31,31,0.05)]">
        <table className="w-full min-w-[560px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-olive/10">
              <th className="p-4 sm:p-5" />
              <th className="p-4 text-start font-bold text-stone sm:p-5">
                {t("colApps")}
              </th>
              <th className="bg-olive p-4 text-start font-bold text-sand sm:p-5">
                {t("colUs")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 ? "bg-ivory/60" : undefined}>
                <td className="p-4 font-semibold text-charcoal sm:p-5">{row.label}</td>
                <td className="p-4 text-stone sm:p-5">
                  <span className="inline-flex items-start gap-2">
                    <X className="mt-0.5 size-4 shrink-0 text-error/70" aria-hidden />
                    {row.apps}
                  </span>
                </td>
                <td className="bg-olive/[0.04] p-4 font-semibold text-charcoal sm:p-5">
                  <span className="inline-flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
                    {row.us}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-stone">{tSite("disclaimer")}</p>
    </Reveal>
  );
}
