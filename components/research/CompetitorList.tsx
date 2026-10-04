"use client";

import { useState } from "react";
import { ArrowSquareOut, CaretDown, Trophy } from "@phosphor-icons/react/ssr";
import type { CompetitorPage, Relevance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SiteIcon } from "@/components/ui/site-icon";

const relevance: Record<Relevance, { label: string; tone: "success" | "neutral" }> = {
  high: { label: "Высокая релевантность", tone: "success" },
  medium: { label: "Средняя релевантность", tone: "neutral" },
  low: { label: "Низкая релевантность", tone: "neutral" },
};

const VISIBLE = 5;

export function CompetitorList({ competitors }: { competitors: CompetitorPage[] }) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? competitors : competitors.slice(0, VISIBLE);

  return (
    <Card>
      <CardHeader
        icon={<Trophy className="size-[18px]" />}
        title="Конкурирующие материалы"
        aside={<span className="text-[13px] text-slate-400">{competitors.length} страниц</span>}
      />
      <CardBody className="pt-3">
        <ul className="-mx-2">
          {items.map((page, i) => (
            <li key={page.id} className={cn(i >= VISIBLE && "animate-fade-up")}>
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <SiteIcon domain={page.domain} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="tabular-nums text-slate-400">#{page.position}</span>
                    <span>{page.domain}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-slate-900 group-hover:text-indigo-700">
                    {page.title}
                    <ArrowSquareOut className="mb-0.5 ml-1 inline size-3.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                  <Badge tone={relevance[page.relevance].tone} className="mt-2 h-5 px-2 text-[11px]">
                    {relevance[page.relevance].label}
                  </Badge>
                </div>
              </a>
            </li>
          ))}
        </ul>
        {competitors.length > VISIBLE && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Свернуть" : "Показать все результаты"}
            <CaretDown
              className={cn("size-3.5 transition-transform duration-200 ease-(--ease-out-strong)", expanded && "rotate-180")}
            />
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
