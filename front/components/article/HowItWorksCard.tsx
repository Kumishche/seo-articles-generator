const steps = [
  {
    title: "Анализируем поисковую выдачу",
    text: "Собираем топ результатов по теме и определяем интент запроса.",
  },
  {
    title: "Изучаем статьи конкурентов",
    text: "Выделяем темы, ключевые запросы и пробелы в их материалах.",
  },
  {
    title: "Формируем оптимальную структуру",
    text: "Предлагаем план с H2 и H3, который можно изменить.",
  },
  {
    title: "Генерируем и оптимизируем статью",
    text: "Пишем текст и проверяем его по SEO-критериям.",
  },
];

/** Что произойдет после запуска: горизонтальная схема процесса, без карточки */
export function HowItWorksCard() {
  return (
    <section aria-labelledby="how-it-works">
      <h2 id="how-it-works" className="text-[13px] font-semibold text-zinc-950">
        Как это работает
      </h2>
      <ol className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ title, text }, i) => (
          <li key={title} className="flex items-start gap-3 xl:block">
            <div className="flex shrink-0 items-center gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-300">
                {i + 1}
              </span>
              {i < steps.length - 1 && <span aria-hidden className="hidden h-px flex-1 bg-zinc-200 xl:block" />}
            </div>
            <div className="xl:mt-3">
              <p className="text-[13px] font-medium leading-5 text-zinc-900">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
