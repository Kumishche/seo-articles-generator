import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(24_24_27/0.12)] hover:bg-accent-hover disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none",
  secondary:
    "bg-white text-zinc-800 border border-zinc-200 shadow-card hover:bg-zinc-50 hover:border-zinc-300 disabled:text-zinc-400",
  ghost: "text-zinc-600 hover:bg-zinc-900/[0.05] hover:text-zinc-900 disabled:text-zinc-300",
  subtle: "bg-zinc-900/[0.05] text-zinc-800 hover:bg-zinc-900/[0.08] disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-zinc-200 disabled:text-zinc-500",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[13px] gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-10 px-4 text-sm gap-2",
  icon: "h-9 w-9",
  "icon-sm": "h-7 w-7",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, disabled, className, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "pressable inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-medium select-none disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});
