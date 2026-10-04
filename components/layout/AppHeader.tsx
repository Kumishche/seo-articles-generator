"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { CaretRight, List } from "@phosphor-icons/react/ssr";
import { useSidebar } from "./AppShell";

export interface Crumb {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  breadcrumbs: Crumb[];
  actions?: ReactNode;
}

export function AppHeader({ breadcrumbs, actions }: AppHeaderProps) {
  const { open } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Открыть меню"
          onClick={open}
          className="pressable -ml-1.5 flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <List className="size-5" />
        </button>

        <nav aria-label="Навигационная цепочка" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <Fragment key={c.label}>
                  <li className={last ? "min-w-0 truncate font-medium text-slate-900" : "hidden shrink-0 text-slate-500 sm:block"}>
                    {c.href && !last ? (
                      <Link href={c.href} className="transition-colors hover:text-slate-900">
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current={last ? "page" : undefined}>{c.label}</span>
                    )}
                  </li>
                  {!last && (
                    <li aria-hidden className="hidden shrink-0 text-slate-300 sm:block">
                      <CaretRight className="size-3.5" />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </nav>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
