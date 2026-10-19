"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { CaretRight, List } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";
import { useSidebar } from "./AppShell";
import { StepIndicator } from "./StepIndicator";

export interface Crumb {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  breadcrumbs: Crumb[];
  /** Текущий этап процесса: индикатор этапов живет в шапке. Без этапа (список статей) индикатор скрыт */
  step?: 1 | 2 | 3;
  /** Нужен для ссылок на пройденные этапы */
  articleId?: string;
  actions?: ReactNode;
}

export function AppHeader({ breadcrumbs, step, articleId, actions }: AppHeaderProps) {
  const { open } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-canvas/90 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            aria-label="Открыть меню"
            onClick={open}
            className="pressable -ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-900/5 lg:hidden"
          >
            <List className="size-5" />
          </button>
          <nav aria-label="Навигационная цепочка" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
              {breadcrumbs.map((c, i) => {
                const last = i === breadcrumbs.length - 1;
                // На широком экране текущий этап уже показан в индикаторе: последнее звено цепочки не дублируем
                const hideOnWide = breadcrumbs.length > 2 && last;
                const beforeHidden = breadcrumbs.length > 2 && i === breadcrumbs.length - 2;
                return (
                  <Fragment key={c.label}>
                    <li
                      className={cn(
                        last
                          ? "min-w-0 truncate font-medium text-zinc-900"
                          : "hidden min-w-0 shrink truncate text-zinc-500 sm:block",
                        !last && i === 0 && "shrink-0",
                        hideOnWide && "lg:hidden",
                        beforeHidden && "lg:font-medium lg:text-zinc-900",
                      )}
                    >
                      {c.href && !last ? (
                        <Link href={c.href} className="transition-colors hover:text-zinc-900">
                          {c.label}
                        </Link>
                      ) : (
                        <span aria-current={last ? "page" : undefined}>{c.label}</span>
                      )}
                    </li>
                    {!last && (
                      <li
                        aria-hidden
                        className={cn("hidden shrink-0 text-zinc-300 sm:block", beforeHidden && "lg:hidden")}
                      >
                        <CaretRight weight="bold" className="size-3" />
                      </li>
                    )}
                  </Fragment>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="hidden lg:block">{step && <StepIndicator current={step} articleId={articleId} />}</div>

        <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>
      </div>

      {/* На узких экранах этапы - отдельной строкой под шапкой */}
      {step && (
        <div className="border-t border-zinc-200/60 px-4 py-2.5 sm:px-6 lg:hidden">
          <StepIndicator current={step} articleId={articleId} />
        </div>
      )}
    </header>
  );
}
