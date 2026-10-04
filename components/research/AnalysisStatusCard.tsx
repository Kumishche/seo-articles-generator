import { ArrowsClockwise, CheckCircle } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";

interface AnalysisStatusCardProps {
  serpResults: number;
  competitorPages: number;
  onRestart: () => void;
}

export function AnalysisStatusCard({ serpResults, competitorPages, onRestart }: AnalysisStatusCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-emerald-200/70 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <CheckCircle weight="fill" className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-slate-900">Анализ завершен</p>
          <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Готово
          </span>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          Проанализировано {serpResults} результатов поиска и {competitorPages} страниц конкурентов
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRestart} className="self-start sm:self-center">
        <ArrowsClockwise className="size-4" />
        Повторить анализ
      </Button>
    </div>
  );
}
