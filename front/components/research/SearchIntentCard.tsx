import type { ResearchResult } from "@/lib/types";

/** Описание интента: что именно ищут пользователи. Тип и уверенность показаны в полосе итогов. */
export function SearchIntentCard({ intent }: { intent: ResearchResult["intent"] }) {
  return (
    <section>
      <h3 className="text-[13px] font-semibold text-zinc-950">Что ищут пользователи</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{intent.description}</p>
    </section>
  );
}
