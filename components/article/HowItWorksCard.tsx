import { Article, ListMagnifyingGlass, MagnifyingGlass, TreeStructure } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: MagnifyingGlass,
    title: "Анализируем поисковую выдачу",
    text: "Собираем топ результатов по теме и определяем интент запроса.",
  },
  {
    icon: ListMagnifyingGlass,
    title: "Изучаем статьи конкурентов",
    text: "Выделяем темы, ключевые запросы и пробелы в их материалах.",
  },
  {
    icon: TreeStructure,
    title: "Формируем оптимальную структуру",
    text: "Предлагаем план с H2 и H3, который можно изменить.",
  },
  {
    icon: Article,
    title: "Генерируем и оптимизируем статью",
    text: "Пишем текст и проверяем его по SEO-критериям.",
  },
];

export function HowItWorksCard() {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold text-slate-900">Как это работает</h2>
      <ol className="relative mt-4 space-y-4">
        <span aria-hidden className="absolute bottom-4 left-[15px] top-4 w-px bg-slate-200" />
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="relative flex gap-3">
            <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-600">
              <Icon weight="duotone" className="size-4" />
            </span>
            <div className="pt-1">
              <p className="text-sm font-medium leading-5 text-slate-900">
                <span className="tabular-nums text-slate-400">{i + 1}. </span>
                {title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2.5 text-[13px] leading-relaxed text-slate-600">
        Перед генерацией текста вы сможете проверить результаты анализа и изменить структуру.
      </p>
    </Card>
  );
}
