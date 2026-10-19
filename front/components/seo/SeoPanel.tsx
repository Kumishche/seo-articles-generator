"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TabPanel, Tabs } from "@/components/ui/tabs";

type Tab = "score" | "snippet" | "sources";

interface SeoPanelProps {
  score: number;
  max: number;
  /** Оценка, проверки и ключевые запросы */
  scoreContent: ReactNode;
  snippetContent: ReactNode;
  sourcesContent: ReactNode;
}

/** SEO-панель редактора: три вкладки вместо длинной колонки карточек */
export function SeoPanel({ score, max, scoreContent, snippetContent, sourcesContent }: SeoPanelProps) {
  const [tab, setTab] = useState<Tab>("score");
  const idBase = useId();
  const ratio = score / max;

  return (
    <Card className="flex max-h-full min-h-0 flex-col">
      <div className="border-b border-zinc-100 p-3">
        <Tabs
          idBase={idBase}
          label="SEO-показатели"
          value={tab}
          onChange={setTab}
          tabs={[
            {
              id: "score",
              label: (
                <>
                  Оценка
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      ratio >= 0.75 ? "text-emerald-600" : ratio >= 0.5 ? "text-amber-600" : "text-red-600",
                    )}
                  >
                    {score}
                  </span>
                </>
              ),
            },
            { id: "snippet", label: "Сниппет" },
            { id: "sources", label: "Источники" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <TabPanel idBase={idBase} id="score" active={tab === "score"} className="divide-y divide-zinc-100">
          {scoreContent}
        </TabPanel>
        <TabPanel idBase={idBase} id="snippet" active={tab === "snippet"}>
          {snippetContent}
        </TabPanel>
        <TabPanel idBase={idBase} id="sources" active={tab === "sources"}>
          {sourcesContent}
        </TabPanel>
      </div>
    </Card>
  );
}
