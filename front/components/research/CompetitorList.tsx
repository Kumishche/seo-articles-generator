"use client";

import { useState } from "react";
import { ArrowUpRight, CaretDown } from "@phosphor-icons/react/ssr";
import type { CompetitorPage, Relevance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
    <div>
      <ol className="-mx-2">
        {items.map((page, i) => (
          <li key={page.id} className={cn(i >= VISIBLE && "animate-fade-up")}>
            <a
              href={page.url}
              target="_blank"
              rel="noreferrer"
              className="group grid grid-cols-[20px_minmax(0,1fr)_14px] gap-x-3 rounded-md px-2 py-2.5 transition-colors duration-150 hover:bg-zinc-50"
            >
              <span className="pt-px text-right font-mono text-xs text-zinc-400">{page.position}</span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <SiteIcon domain={page.domain} className="size-4 rounded-[4px] text-[9px]" />
                  {page.domain}
                </p>
                <p className="mt-1 text-[13px] font-medium leading-snug text-zinc-900">{page.title}</p>
                <Badge tone={relevance[page.relevance].tone} className="mt-1.5 h-5 px-1.5 text-[11px]">
                  {relevance[page.relevance].label}
                </Badge>
              </div>
              <ArrowUpRight className="mt-0.5 size-3.5 text-zinc-300 transition-colors duration-150 group-hover:text-zinc-600" />
            </a>
          </li>
        ))}
      </ol>
      {competitors.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="pressable -ml-2 mt-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-950"
        >
          {expanded ? "Свернуть" : "Показать все результаты"}
          <CaretDown
            className={cn(
              "size-3.5 transition-transform duration-200 ease-(--ease-out-strong)",
              expanded && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  );
}
