import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Info } from "../icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
  /** surface behind the field, for the focus ring's inner gap */
  offset?: "bg" | "surface" | "surface-2";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, error, offset = "bg", className, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3 flex text-muted-2" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full rounded-md border bg-surface-2 py-[9px] text-sm text-ink placeholder:text-muted-2",
            "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            icon ? "pl-9 pr-3" : "px-3",
            error
              ? "border-fail focus-visible:border-fail focus-visible:ring-fail/25"
              : "border-border-2 focus-visible:border-primary",
            offset === "surface" && "focus-visible:ring-offset-0",
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="flex items-center gap-1.5 text-[12px] text-[oklch(0.72_0.18_25)]">
          <Info size={12} />
          {error}
        </span>
      )}
    </div>
  );
});
