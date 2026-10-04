import { FileText, Key, Rows } from "@phosphor-icons/react/ssr";

interface OutlineSummaryProps {
  words: { min: number; max: number };
  sections: number;
  keywords: number;
}

export function OutlineSummary({ words, sections, keywords }: OutlineSummaryProps) {
  const items = [
    { icon: FileText, label: "Примерный объем", value: `${words.min}–${words.max} слов` },
    { icon: Rows, label: "Разделов", value: String(sections), title: "Включая введение" },
    { icon: Key, label: "Целевых запросов", value: String(keywords) },
  ];

  return (
    <dl className="grid grid-cols-1 divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map(({ icon: Icon, label, value, title }) => (
        <div key={label} className="flex items-center gap-3 px-5 py-4" title={title}>
          <Icon className="size-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <dt className="text-[13px] text-slate-500">{label}:</dt>
            <dd className="text-[15px] font-semibold tabular-nums text-slate-900">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
