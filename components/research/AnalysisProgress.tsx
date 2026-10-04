import { Check } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface AnalysisProgressProps {
  stages: string[];
  /** Индекс текущего этапа */
  current: number;
}

/** Состояние загрузки анализа: этапы + скелетон будущей раскладки */
export function AnalysisProgress({ stages, current }: AnalysisProgressProps) {
  const progress = Math.min(1, (current + 0.5) / stages.length);

  return (
    <div className="space-y-6" aria-busy="true">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Spinner className="size-5 border-[2.5px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-slate-900" aria-live="polite">
              {stages[Math.min(current, stages.length - 1)]}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              Этап {Math.min(current + 1, stages.length)} из {stages.length}. Можно не закрывать страницу.
            </p>
          </div>
          <span className="hidden text-sm font-medium tabular-nums text-slate-500 sm:block">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full origin-left rounded-full bg-accent transition-transform duration-700 ease-(--ease-in-out-strong)"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <ol className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {stages.map((stage, i) => {
            const state = i < current ? "done" : i === current ? "active" : "pending";
            return (
              <li
                key={stage}
                className={cn(
                  "flex items-center gap-2 text-[13px] transition-colors duration-200",
                  state === "done" && "text-slate-600",
                  state === "active" && "font-medium text-slate-900",
                  state === "pending" && "text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    state === "done" && "bg-emerald-50 text-emerald-600",
                    state === "active" && "bg-indigo-50 text-indigo-600",
                    state === "pending" && "border border-slate-200",
                  )}
                >
                  {state === "done" && <Check weight="bold" className="size-3" />}
                  {state === "active" && <span className="size-1.5 animate-pulse rounded-full bg-indigo-500" />}
                </span>
                {stage.replace("...", "")}
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,38fr)_minmax(0,62fr)]">
        <div className="space-y-6">
          {[96, 132, 220].map((h) => (
            <Card key={h} className="space-y-3 p-6">
              <div className="skeleton h-4 w-1/3 rounded" />
              <div className="skeleton rounded-lg" style={{ height: h - 40 }} />
            </Card>
          ))}
        </div>
        <Card className="space-y-3 p-6">
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="space-y-2 pt-3">
            {[0, 1, 1, 2, 2, 2, 1, 1, 1].map((level, i) => (
              <div key={i} className="skeleton h-11 rounded-lg" style={{ marginLeft: level === 2 ? 32 : 0 }} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
