import { Plus } from "@phosphor-icons/react/ssr";

export function RecommendationsCard({ items }: { items: string[] }) {
  return (
    <div>
      <p className="text-[13px] leading-relaxed text-zinc-500">
        Чего не хватает материалам конкурентов. Учтите это в структуре, чтобы статья была полнее.
      </p>
      <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 bg-white px-3 py-2.5 text-[13px] leading-snug text-zinc-800">
            <Plus weight="bold" className="mt-[2px] size-3.5 shrink-0 text-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
