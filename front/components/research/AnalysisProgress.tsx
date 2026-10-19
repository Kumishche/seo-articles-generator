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
    <div className="space-y-5" aria-busy="true">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-4">
          <Spinner className="size-4 text-accent" />
          <p className="min-w-0 flex-1 text-[14px] font-semibold text-zinc-950" aria-live="polite">
            {stages[Math.min(current, stages.length - 1)]}
          </p>
          <span className="font-mono text-xs text-zinc-500">
            {Math.min(current + 1, stages.length)}/{stages.length}
          </span>
        </div>
        <ol className="grid gap-x-4 gap-y-2 px-5 pb-4 pt-3 sm:grid-cols-2 lg:grid-cols-5">
          {stages.map((stage, i) => {
            const state = i < current ? "done" : i === current ? "active" : "pending";
            return (
              <li
                key={stage}
                className={cn(
                  "flex items-center gap-2 text-[13px] transition-colors duration-200",
                  state === "done" && "text-zinc-500",
                  state === "active" && "font-medium text-zinc-950",
                  state === "pending" && "text-zinc-400",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full",
                    state === "done" && "bg-zinc-900 text-white",
                    state === "active" && "ring-[1.5px] ring-inset ring-accent",
                    state === "pending" && "ring-1 ring-inset ring-zinc-300",
                  )}
                >
                  {state === "done" && <Check weight="bold" className="size-2.5" />}
                  {state === "active" && <span className="size-1.5 animate-pulse rounded-full bg-accent" />}
                </span>
                {stage.replace("...", "")}
              </li>
            );
          })}
        </ol>
        <div className="h-0.5 bg-zinc-100">
          <div
            className="h-full origin-left bg-accent transition-transform duration-700 ease-(--ease-in-out-strong)"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-200/70 lg:grid-cols-[1.6fr_1.1fr_1fr_0.7fr_0.8fr]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("space-y-2.5 bg-white px-5 py-4", i === 0 && "col-span-2 lg:col-span-1")}>
            <div className="skeleton h-2.5 w-1/2 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="space-y-3 p-6">
          <div className="skeleton h-3.5 w-1/4 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="space-y-2.5 pt-4">
            <div className="skeleton h-8 w-3/4 rounded-md" />
            {[1, 1, 2, 2, 2, 1, 1, 1].map((level, i) => (
              <div
                key={i}
                className="skeleton h-7 rounded-md"
                style={{ marginLeft: level === 2 ? 56 : 0, width: level === 2 ? "45%" : "60%" }}
              />
            ))}
          </div>
        </Card>
        <Card className="space-y-4 p-5">
          <div className="skeleton h-8 rounded-lg" />
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-16 rounded-md" />
          <div className="flex flex-wrap gap-1.5">
            {[120, 84, 76, 92, 110].map((w) => (
              <div key={w} className="skeleton h-7 rounded-md" style={{ width: w }} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
