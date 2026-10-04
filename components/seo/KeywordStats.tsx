import type { KeywordStat } from "@/lib/types";
import { cn, plural } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface KeywordStatsProps {
  keywords: (KeywordStat & { count: number })[];
}

export function KeywordStats({ keywords }: KeywordStatsProps) {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold text-slate-900">Ключевые запросы</h2>
      <ul className="mt-3 divide-y divide-slate-100">
        {keywords.map((k) => {
          const low = k.count < Math.ceil(k.target / 2);
          return (
            <li key={k.phrase} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0">
              <span className="min-w-0 text-[13px] font-medium text-slate-800">{k.phrase}</span>
              <span
                className={cn(
                  "shrink-0 text-[13px] tabular-nums",
                  low ? "text-amber-600" : "text-slate-500",
                )}
                title={`Рекомендуется: ${k.target}`}
              >
                {k.count} {plural(k.count, ["упоминание", "упоминания", "упоминаний"])}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
