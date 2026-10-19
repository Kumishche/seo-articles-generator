import type { Keyword } from "@/lib/types";

export function KeywordList({ keywords }: { keywords: Keyword[] }) {
  const primary = keywords.filter((k) => k.kind === "primary");
  const secondary = keywords.filter((k) => k.kind === "secondary");

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-[13px] font-semibold text-zinc-950">
          Основные запросы <span className="font-mono text-xs font-normal text-zinc-400">{primary.length}</span>
        </h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {primary.map((k) => (
            <li
              key={k.phrase}
              className="inline-flex h-7 items-center rounded-md bg-zinc-900 px-2.5 text-[13px] font-medium text-white"
            >
              {k.phrase}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-[13px] font-semibold text-zinc-950">
          Дополнительные <span className="font-mono text-xs font-normal text-zinc-400">{secondary.length}</span>
        </h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {secondary.map((k) => (
            <li
              key={k.phrase}
              className="inline-flex h-6 items-center rounded-md px-2 text-xs text-zinc-600 ring-1 ring-inset ring-zinc-200"
            >
              {k.phrase}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
