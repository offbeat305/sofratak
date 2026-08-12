import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** ivory sits on white sections; white sits on the ivory page background */
  tone?: "white" | "ivory";
  /** hover lift for clickable/feature cards */
  interactive?: boolean;
};

export function Card({
  tone = "white",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-olive/10 p-6 shadow-[0_1px_3px_rgba(31,31,31,0.06)] sm:p-8",
        tone === "white" ? "bg-white" : "bg-ivory",
        interactive &&
          "transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(31,31,31,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}
