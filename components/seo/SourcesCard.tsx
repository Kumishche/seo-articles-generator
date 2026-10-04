import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import type { CompetitorPage } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { SiteIcon } from "@/components/ui/site-icon";

export function SourcesCard({ sources }: { sources: CompetitorPage[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold text-slate-900">Использованные источники</h2>
      <ul className="-mx-2 mt-2">
        {sources.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
            >
              <SiteIcon domain={s.domain} className="mt-0.5 size-5 text-[10px]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">{s.domain}</p>
                <p className="text-[13px] font-medium leading-snug text-slate-800 group-hover:text-indigo-700">{s.title}</p>
              </div>
              <ArrowSquareOut
                aria-label="Открыть в новой вкладке"
                className="mt-0.5 size-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500"
              />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
