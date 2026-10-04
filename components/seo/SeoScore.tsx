import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SeoScoreProps {
  score: number;
  max: number;
  verdict: string;
  summary: string;
}

export function SeoScore({ score, max, verdict, summary }: SeoScoreProps) {
  const ratio = score / max;
  const tone = ratio >= 0.75 ? "emerald" : ratio >= 0.5 ? "amber" : "red";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900">SEO-оценка</h2>
        <span
          className={cn(
            "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
            tone === "emerald" && "bg-emerald-50 text-emerald-700",
            tone === "amber" && "bg-amber-50 text-amber-700",
            tone === "red" && "bg-red-50 text-red-700",
          )}
        >
          {verdict}
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1 tabular-nums">
        <span className="text-4xl font-semibold tracking-tight text-slate-900 transition-all">{score}</span>
        <span className="text-lg font-medium text-slate-400">/ {max}</span>
      </p>
      <div
        role="progressbar"
        aria-label="SEO-оценка"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={score}
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={cn(
            "h-full origin-left rounded-full transition-transform duration-500 ease-(--ease-out-strong)",
            tone === "emerald" && "bg-emerald-500",
            tone === "amber" && "bg-amber-500",
            tone === "red" && "bg-red-500",
          )}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{summary}</p>
    </Card>
  );
}
