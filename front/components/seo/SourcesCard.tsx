import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import type { CompetitorPage } from "@/lib/types";
import { PanelSection } from "@/components/ui/card";
import { SiteIcon } from "@/components/ui/site-icon";

export function SourcesCard({ sources }: { sources: CompetitorPage[] }) {
  return (
    <PanelSection title="Использованные источники">
      <ul className="-mx-2 -my-1">
        {sources.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-zinc-50"
            >
              <SiteIcon domain={s.domain} className="mt-0.5 size-5 text-[10px]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">{s.domain}</p>
                <p className="text-[13px] leading-snug text-zinc-800">{s.title}</p>
              </div>
              <ArrowUpRight
                aria-label="Открыть в новой вкладке"
                className="mt-0.5 size-3.5 shrink-0 text-zinc-300 transition-colors duration-150 group-hover:text-zinc-600"
              />
            </a>
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
