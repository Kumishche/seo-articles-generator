import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  accent: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
  outline: "bg-white text-slate-600 ring-1 ring-inset ring-slate-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
