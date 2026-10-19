import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageIntroProps {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  className?: string;
}

/** Заголовок экрана. Индикатор этапов вынесен в шапку, здесь только назначение экрана. */
export function PageIntro({ title, subtitle, aside, className }: PageIntroProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-[64ch]">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">{title}</h1>
        <p className="mt-1 text-[14px] leading-relaxed text-zinc-500">{subtitle}</p>
      </div>
      {aside}
    </div>
  );
}
