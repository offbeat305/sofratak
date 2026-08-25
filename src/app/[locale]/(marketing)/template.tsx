/**
 * Marketing page-transition fade (design-pass-2 B: 150ms, reduced-motion
 * gated via the animate-fade-in utility). Template remounts per
 * navigation, so the fade plays on every marketing page change.
 */
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in [animation-duration:150ms]">{children}</div>;
}
