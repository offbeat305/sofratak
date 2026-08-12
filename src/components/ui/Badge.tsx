import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "sand"
  | "olive"
  | "brass"
  | "clay"
  | "success"
  | "error";

const variantClasses: Record<BadgeVariant, string> = {
  sand: "bg-sand-soft text-olive",
  olive: "bg-olive text-ivory",
  brass: "bg-brass/12 text-brass-deep",
  clay: "bg-clay/12 text-clay",
  success: "bg-positive/12 text-positive",
  error: "bg-error/10 text-error",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "sand", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
