import Link from "next/link";
import { Check } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

const steps = [
  { title: "Исходные данные", hint: "Тема, план и источники", href: "/articles/new" },
  { title: "Анализ и структура", hint: "Выдача, интент, ключи", href: "/articles/demo/research" },
  { title: "Готовая статья", hint: "Текст и SEO-проверка", href: "/articles/demo/editor" },
];

/** current - номер активного шага, начиная с 1 */
export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Этапы подготовки статьи">
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {steps.map((step, i) => {
          const n = i + 1;
          const state = n < current ? "done" : n === current ? "current" : "upcoming";

          const content = (
            <>
              <span className="flex items-center gap-2 sm:gap-3">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition-colors",
                    state === "done" && "bg-indigo-100 text-indigo-700",
                    state === "current" && "bg-accent text-white ring-4 ring-indigo-100",
                    state === "upcoming" && "border border-slate-300 bg-white text-slate-400",
                  )}
                >
                  {state === "done" ? <Check weight="bold" className="size-3.5" /> : n}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      state === "upcoming" ? "text-slate-400" : "text-slate-900",
                      state === "current" && "text-indigo-700",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="hidden truncate text-xs text-slate-500 md:block">{step.hint}</span>
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "mt-3 block h-1 rounded-full",
                  state === "done" && "bg-indigo-500",
                  state === "current" && "bg-gradient-to-r from-indigo-500 to-indigo-200",
                  state === "upcoming" && "bg-slate-200",
                )}
              />
            </>
          );

          return (
            <li key={step.title} aria-current={state === "current" ? "step" : undefined} className="min-w-0">
              {state === "done" ? (
                <Link
                  href={step.href}
                  className="group block rounded-lg outline-offset-4"
                  title={`Вернуться к этапу «${step.title}»`}
                >
                  {content}
                  <span className="sr-only">(завершен)</span>
                </Link>
              ) : (
                <div>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
      {/* На телефоне подписи всех этапов не помещаются: показываем только текущий */}
      <p className="mt-3 text-sm text-slate-500 sm:hidden">
        Этап {current} из {steps.length}: <span className="font-medium text-indigo-700">{steps[current - 1].title}</span>
      </p>
    </nav>
  );
}
