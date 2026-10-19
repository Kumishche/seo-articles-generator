import type { ReactNode } from "react";
import { ArrowsClockwise, Check } from "@phosphor-icons/react/ssr";
import type { Confidence, ResearchResult, SearchIntentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const intentLabels: Record<SearchIntentType, string> = {
  informational: "Информационный",
  commercial: "Коммерческий",
  transactional: "Транзакционный",
  navigational: "Навигационный",
};

const confidenceLabels: Record<Confidence, { label: string; level: number }> = {
  high: { label: "высокая", level: 3 },
  medium: { label: "средняя", level: 2 },
  low: { label: "низкая", level: 1 },
};

interface ResearchSummaryProps {
  research: ResearchResult;
  words: { min: number; max: number };
  sections: number;
  keywords: number;
  onRestart: () => void;
  /** Повторить анализ нельзя, пока генерируется статья */
  restartDisabled?: boolean;
}

/**
 * Итог анализа одной полосой: статус + показатели, которые пересчитываются
 * по мере редактирования структуры.
 */
export function ResearchSummary({
  research,
  words,
  sections,
  keywords,
  onRestart,
  restartDisabled,
}: ResearchSummaryProps) {
  const confidence = confidenceLabels[research.intent.confidence];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-200/70 shadow-card lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]">
      <div role="status" className="col-span-2 flex items-start gap-3 bg-white px-5 py-4 lg:col-span-1">
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check weight="bold" className="size-3" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-zinc-950">Анализ завершен</p>
          <p className="mt-0.5 text-[13px] leading-snug text-zinc-500">
            Проанализировано {research.serpResultsAnalyzed} результатов поиска и {research.competitorPagesAnalyzed}{" "}
            страниц конкурентов
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRestart}
          disabled={restartDisabled}
          aria-label="Повторить анализ"
          title="Повторить анализ"
        >
          <ArrowsClockwise className="size-4" />
        </Button>
      </div>

      <Metric label="Поисковый интент">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950">
          {intentLabels[research.intent.type]}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="flex items-end gap-[2px]" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn("w-[3px] rounded-[1px]", n <= confidence.level ? "bg-emerald-500" : "bg-zinc-200")}
                style={{ height: 4 + n * 2.5 }}
              />
            ))}
          </span>
          Уверенность: {confidence.label}
        </span>
      </Metric>
      <Metric label="Примерный объем">
        <Value>
          {words.min}-{words.max}
        </Value>
        <span className="ml-1 text-[13px] text-zinc-500">слов</span>
      </Metric>
      <Metric label="Разделов" title="Включая введение">
        <Value>{sections}</Value>
      </Metric>
      <Metric label="Целевых запросов">
        <Value>{keywords}</Value>
      </Metric>
    </div>
  );
}

function Metric({ label, title, children }: { label: string; title?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 bg-white px-5 py-4" title={title}>
      <p className="truncate text-xs text-zinc-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline">{children}</div>
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[20px] font-medium leading-none tracking-[-0.03em] text-zinc-950">{children}</span>
  );
}
