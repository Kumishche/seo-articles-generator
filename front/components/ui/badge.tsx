import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-900/[0.05] text-zinc-600",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-emerald-500/10 text-emerald-700",
  warning: "bg-amber-500/12 text-amber-800",
  outline: "text-zinc-600 ring-1 ring-inset ring-zinc-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
