import type { ReactNode } from "react";
import { StepIndicator } from "./StepIndicator";

interface PageIntroProps {
  title: string;
  subtitle: string;
  step: 1 | 2 | 3;
  aside?: ReactNode;
}

/** Заголовок экрана + индикатор этапов. Общий для всех трех экранов. */
export function PageIntro({ title, subtitle, step, aside }: PageIntroProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[68ch]">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px] sm:leading-9">{title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
        </div>
        {aside}
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-card sm:px-6">
        <StepIndicator current={step} />
      </div>
    </div>
  );
}
