"use client";

import { useId, useState } from "react";
import type { ResearchResult } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { CompetitorList } from "./CompetitorList";
import { KeywordList } from "./KeywordList";
import { RecommendationsCard } from "./RecommendationsCard";
import { SearchIntentCard } from "./SearchIntentCard";

type Tab = "keywords" | "competitors" | "tips";

/** Досье исследования: справочный материал рядом со структурой, разложенный по вкладкам */
export function ResearchDossier({ research }: { research: ResearchResult }) {
  const [tab, setTab] = useState<Tab>("keywords");
  const idBase = useId();

  return (
    <Card className="flex max-h-full flex-col">
      <div className="px-4 pt-4">
        <h2 className="sr-only">Результаты исследования</h2>
        <Tabs
          idBase={idBase}
          label="Результаты исследования"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "keywords", label: "Запросы" },
            {
              id: "competitors",
              label: (
                <>
                  Конкуренты <span className="font-mono text-[11px] text-zinc-400">{research.competitors.length}</span>
                </>
              ),
            },
            { id: "tips", label: "Рекомендации" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5 [scrollbar-width:thin]">
        <TabPanel idBase={idBase} id="keywords" active={tab === "keywords"} className="space-y-6">
          <SearchIntentCard intent={research.intent} />
          <KeywordList keywords={research.keywords} />
        </TabPanel>
        <TabPanel idBase={idBase} id="competitors" active={tab === "competitors"}>
          <h3 className="sr-only">Конкурирующие материалы</h3>
          <CompetitorList competitors={research.competitors} />
        </TabPanel>
        <TabPanel idBase={idBase} id="tips" active={tab === "tips"}>
          <h3 className="sr-only">Рекомендации</h3>
          <RecommendationsCard items={research.recommendations} />
        </TabPanel>
      </div>
    </Card>
  );
}
