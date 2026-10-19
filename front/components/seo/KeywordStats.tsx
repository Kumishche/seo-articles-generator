import type { KeywordStat } from "@/lib/types";
import { cn, plural } from "@/lib/utils";
import { PanelSection } from "@/components/ui/card";

interface KeywordStatsProps {
  keywords: (KeywordStat & { count: number })[];
}

export function KeywordStats({ keywords }: KeywordStatsProps) {
  return (
    <PanelSection title="Ключевые запросы">
      <ul className="space-y-2">
        {keywords.map((k) => {
          const low = k.count < Math.ceil(k.target / 2);
          return (
            <li key={k.phrase} className="flex items-baseline gap-2 text-[13px]">
              <span className="min-w-0 truncate text-zinc-800">{k.phrase}</span>
              <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-zinc-300" />
              <span
                className={cn("shrink-0", low ? "text-amber-700" : "text-zinc-500")}
                title={`Рекомендуется: ${k.target}`}
              >
                <span className="font-mono">{k.count}</span>{" "}
                {plural(k.count, ["упоминание", "упоминания", "упоминаний"])}
              </span>
            </li>
          );
        })}
      </ul>
    </PanelSection>
  );
}
