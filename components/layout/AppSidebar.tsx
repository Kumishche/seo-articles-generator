"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Files, Gear, NotePencil, PenNib, X } from "@phosphor-icons/react/ssr";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface AppSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const toast = useToast();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  const unavailable = () =>
    toast("Раздел недоступен в демо-версии", {
      tone: "info",
      description: "В прототипе реализован сценарий создания новой статьи.",
    });

  return (
    <>
      {/* Подложка для мобильного меню */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/30 transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Основная навигация"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-white",
          "transition-transform duration-300 ease-(--ease-drawer) lg:translate-x-0 lg:transition-none",
          mobileOpen ? "translate-x-0 shadow-overlay" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <Link href="/articles/new" className="flex items-center gap-2.5 rounded-md">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
              <PenNib weight="fill" className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">SEO Article AI</span>
          </Link>
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={onClose}
            className="pressable flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="mt-3 flex-1 px-3">
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/articles/new"
                aria-current="page"
                className="flex h-9 items-center gap-2.5 rounded-lg bg-indigo-50 px-2.5 text-sm font-medium text-indigo-700"
              >
                <NotePencil weight="duotone" className="size-[18px]" />
                Новая статья
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={unavailable}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Files className="size-[18px] text-slate-400" />
                Мои статьи
                <span className="ml-auto text-xs font-normal tabular-nums text-slate-400">14</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={unavailable}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Gear className="size-[18px] text-slate-400" />
                Настройки
              </button>
            </li>
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[13px] font-semibold text-slate-700 ring-2 ring-white"
            >
              {currentUser.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{currentUser.name}</p>
              <p className="truncate text-xs text-slate-500">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
