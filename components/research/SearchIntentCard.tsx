import { Crosshair } from "@phosphor-icons/react/ssr";
import type { Confidence, ResearchResult, SearchIntentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

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

export function SearchIntentCard({ intent }: { intent: ResearchResult["intent"] }) {
  const confidence = confidenceLabels[intent.confidence];
  return (
    <Card>
      <CardHeader
        icon={<Crosshair className="size-[18px]" />}
        title="Поисковый интент"
        aside={<Badge tone="accent">{intentLabels[intent.type]}</Badge>}
      />
      <CardBody className="pt-3">
        <p className="text-sm leading-relaxed text-slate-600">{intent.description}</p>
        <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-4 text-sm">
          <span className="flex items-end gap-0.5" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn("w-1 rounded-full", n <= confidence.level ? "bg-emerald-500" : "bg-slate-200")}
                style={{ height: 6 + n * 3 }}
              />
            ))}
          </span>
          <span className="text-slate-500">
            Уверенность: <span className="font-medium text-slate-900">{confidence.label}</span>
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
