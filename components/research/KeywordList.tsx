import { Key } from "@phosphor-icons/react/ssr";
import type { Keyword } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function KeywordList({ keywords }: { keywords: Keyword[] }) {
  const primary = keywords.filter((k) => k.kind === "primary");
  const secondary = keywords.filter((k) => k.kind === "secondary");

  return (
    <Card>
      <CardHeader icon={<Key className="size-[18px]" />} title="Ключевые запросы" />
      <CardBody className="space-y-5 pt-3">
        <section>
          <h3 className="flex items-center justify-between text-[13px] font-medium text-slate-500">
            Основные
            <span className="tabular-nums text-slate-400">{primary.length}</span>
          </h3>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {primary.map((k) => (
              <li
                key={k.phrase}
                className="inline-flex h-8 items-center rounded-lg bg-indigo-50 px-3 text-sm font-medium text-indigo-800 ring-1 ring-inset ring-indigo-200/70"
              >
                {k.phrase}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="flex items-center justify-between text-[13px] font-medium text-slate-500">
            Дополнительные
            <span className="tabular-nums text-slate-400">{secondary.length}</span>
          </h3>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {secondary.map((k) => (
              <li
                key={k.phrase}
                className="inline-flex h-7 items-center rounded-lg bg-white px-2.5 text-[13px] text-slate-600 ring-1 ring-inset ring-slate-200"
              >
                {k.phrase}
              </li>
            ))}
          </ul>
        </section>
      </CardBody>
    </Card>
  );
}
