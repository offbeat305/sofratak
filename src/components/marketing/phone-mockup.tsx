/**
 * Stylized storefront-in-a-phone for the hero (spec: Beit Zizo demo,
 * relabeled). Pure CSS/JSX — crisp at any size, zero image weight.
 */
export function PhoneMockup() {
  return (
    <div
      aria-hidden
      className="mx-auto w-64 rounded-[2.5rem] border-[6px] border-charcoal/90 bg-white shadow-[0_30px_60px_rgba(31,31,31,0.35)]"
    >
      <div className="overflow-hidden rounded-[2.1rem]">
        {/* storefront header */}
        <div className="bg-[#6E2B2B] px-4 pt-6 pb-4">
          <div className="h-2 w-16 rounded-full bg-white/30" />
          <p className="mt-3 text-sm font-bold text-white">Beit Demo Shawarma</p>
          <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold text-white">
            HALAL ✓
          </span>
        </div>
        {/* category chips */}
        <div className="flex gap-1.5 px-4 py-2.5">
          <span className="rounded-full bg-[#6E2B2B] px-2.5 py-1 text-[9px] font-bold text-white">Shawarma</span>
          <span className="rounded-full border border-charcoal/15 px-2.5 py-1 text-[9px] font-semibold text-charcoal">Grill</span>
          <span className="rounded-full border border-charcoal/15 px-2.5 py-1 text-[9px] font-semibold text-charcoal">Mezze</span>
        </div>
        {/* items */}
        {[
          ["Chicken Shawarma Wrap", "$9.49"],
          ["Mixed Grill", "$22.99"],
          ["Falafel (6 pc)", "$6.49"],
        ].map(([name, price]) => (
          <div key={name} className="mx-3 mb-2 flex items-center justify-between rounded-xl border border-charcoal/8 bg-white p-2.5 shadow-[0_1px_2px_rgba(31,31,31,0.05)]">
            <div>
              <p className="text-[10px] font-bold text-charcoal">{name}</p>
              <p className="text-[10px] font-bold text-[#6E2B2B]">{price}</p>
            </div>
            <div className="size-8 rounded-lg bg-gradient-to-br from-[#8A4B32] to-[#5C2E1E]" />
          </div>
        ))}
        {/* cart bar */}
        <div className="p-3">
          <div className="flex items-center justify-between rounded-xl bg-[#6E2B2B] px-3 py-2.5">
            <span className="text-[10px] font-bold text-white">View order · 2</span>
            <span className="text-[10px] font-bold text-white">$15.98</span>
          </div>
        </div>
      </div>
    </div>
  );
}
