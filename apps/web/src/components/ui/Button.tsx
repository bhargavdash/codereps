import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
/** which surface the button sits on, so the focus ring's inner gap matches it */
export type ButtonOffset = "bg" | "surface" | "surface-2";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium select-none " +
  "transition-colors duration-150 cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed";

const sizes: Record<ButtonSize, string> = {
  sm: "text-[13px] px-3.5 py-1.5",
  md: "text-sm px-[18px] py-2.5",
  lg: "text-base px-6 py-[13px]",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hi active:bg-primary-lo " +
    "disabled:bg-raised disabled:text-muted-2 disabled:hover:bg-raised",
  secondary:
    "bg-raised text-ink border border-border-2 hover:bg-[oklch(0.22_0.008_250)] " +
    "hover:border-[oklch(0.34_0.01_250)] disabled:text-muted-2",
  ghost: "bg-transparent text-muted hover:bg-raised hover:text-ink",
};

const offsets: Record<ButtonOffset, string> = {
  bg: "focus-visible:ring-offset-bg",
  surface: "focus-visible:ring-offset-surface",
  "surface-2": "focus-visible:ring-offset-surface-2",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  offset: ButtonOffset = "bg",
  className?: string,
) {
  return cn(base, sizes[size], variants[variant], offsets[offset], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  offset?: ButtonOffset;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", offset = "bg", loading = false, disabled, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={buttonClasses(variant, size, offset, className)}
      {...props}
    >
      {loading && (
        <span
          className="cr-skel inline-block rounded-full border-2 border-current/40 border-t-current"
          style={{ width: 12, height: 12, opacity: 0.85 }}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});
