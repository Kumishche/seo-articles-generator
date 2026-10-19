import Link from "next/link";
import { Check } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

const steps = [
  { title: "Исходные данные", path: null },
  { title: "Анализ и структура", path: "research" },
  { title: "Готовая статья", path: "editor" },
];

function stepHref(path: string | null, articleId?: string) {
  if (!path) return "/articles/new";
  return articleId ? `/articles/${articleId}/${path}` : null;
}

/** current - номер активного шага, начиная с 1 */
export function StepIndicator({ current, articleId }: { current: 1 | 2 | 3; articleId?: string }) {
  return (
    <nav aria-label="Этапы подготовки статьи">
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((step, i) => {
          const n = i + 1;
          const state = n < current ? "done" : n === current ? "current" : "upcoming";
          const href = stepHref(step.path, articleId);

          const content = (
            <>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium",
                  state === "done" && "bg-zinc-900 text-white",
                  state === "current" && "bg-accent text-white shadow-[0_0_0_3px_var(--color-accent-soft)]",
                  state === "upcoming" && "text-zinc-400 ring-1 ring-inset ring-zinc-300",
                )}
              >
                {state === "done" ? <Check weight="bold" className="size-3" /> : n}
              </span>
              <span
                className={cn(
                  "truncate text-[13px] font-medium transition-colors duration-150",
                  state === "done" && "text-zinc-600 group-hover:text-zinc-950",
                  state === "current" && "text-zinc-950",
                  state === "upcoming" && "text-zinc-400",
                  state !== "current" && "hidden sm:inline",
                )}
              >
                {step.title}
              </span>
            </>
          );

          return (
            <li
              key={step.title}
              aria-current={state === "current" ? "step" : undefined}
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn("h-px w-5 shrink-0 sm:w-10", n <= current ? "bg-zinc-900" : "bg-zinc-300")}
                />
              )}
              {state === "done" && href ? (
                <Link
                  href={href}
                  className="group flex items-center gap-2 rounded-md outline-offset-4"
                  title={`Вернуться к этапу «${step.title}»`}
                >
                  {content}
                  <span className="sr-only">(завершен)</span>
                </Link>
              ) : (
                <span className="flex min-w-0 items-center gap-2">{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
