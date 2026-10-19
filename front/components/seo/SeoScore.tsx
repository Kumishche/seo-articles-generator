import { cn } from "@/lib/utils";

interface SeoScoreProps {
  score: number;
  max: number;
  verdict: string;
  summary: string;
}

const SEGMENTS = 20;

export function SeoScore({ score, max, verdict, summary }: SeoScoreProps) {
  const ratio = score / max;
  const tone = ratio >= 0.75 ? "emerald" : ratio >= 0.5 ? "amber" : "red";
  const filled = Math.round(ratio * SEGMENTS);

  return (
    <section className="px-5 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-zinc-950">SEO-оценка</h2>
        <span
          className={cn(
            "text-[13px] font-medium",
            tone === "emerald" && "text-emerald-700",
            tone === "amber" && "text-amber-700",
            tone === "red" && "text-red-700",
          )}
        >
          {verdict}
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-1.5 font-mono">
        <span className="text-[40px] font-medium leading-none tracking-[-0.04em] text-zinc-950">{score}</span>
        <span className="text-base text-zinc-400">/ {max}</span>
      </p>
      {/* Сегментированная шкала: 20 делений по 5 баллов */}
      <div
        role="progressbar"
        aria-label="SEO-оценка"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={score}
        className="mt-3.5 flex gap-[3px]"
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-[1px] transition-colors duration-300",
              i < filled
                ? tone === "emerald"
                  ? "bg-emerald-500"
                  : tone === "amber"
                    ? "bg-amber-500"
                    : "bg-red-500"
                : "bg-zinc-200",
            )}
            style={{ transitionDelay: `${i * 12}ms` }}
          />
        ))}
      </div>
      <p className="mt-3.5 text-[13px] leading-relaxed text-zinc-500">{summary}</p>
    </section>
  );
}
