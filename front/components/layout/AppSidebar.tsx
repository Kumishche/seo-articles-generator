"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Files, Gear, NotePencil, X } from "@phosphor-icons/react/ssr";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface AppSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: Icon;
  href?: string;
}

const nav: NavItem[] = [
  { label: "Новая статья", icon: NotePencil, href: "/articles/new" },
  { label: "Мои статьи", icon: Files, href: "/articles" },
  { label: "Настройки", icon: Gear },
];

/** Экраны работы над статьей относятся к сценарию «Новая статья», список - к «Мои статьи» */
function isActive(href: string | undefined, pathname: string) {
  if (!href) return false;
  if (href === "/articles") return pathname === "/articles";
  return pathname.startsWith("/articles/");
}

/**
 * На десктопе - узкая иконочная панель с подсказками: рабочей области нужна ширина.
 * На мобильных - выезжающее меню с подписями.
 */
export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const toast = useToast();
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  const unavailable = () =>
    toast("Раздел недоступен в демо-версии", {
      tone: "info",
      description: "Сейчас доступны создание статьи и список подготовленных статей.",
    });

  return (
    <>
      {/* Десктоп: иконочная панель */}
      <aside
        aria-label="Основная навигация"
        className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col items-center border-r border-zinc-200/80 bg-canvas py-3 lg:flex"
      >
        <Link
          href="/articles/new"
          aria-label="SEO Article AI"
          className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 font-mono text-[11px] font-semibold text-white"
        >
          SA
        </Link>

        <ul className="mt-6 flex flex-col gap-1">
          {nav.map((item) => (
            <li key={item.label}>
              <RailButton item={item} active={isActive(item.href, pathname)} onUnavailable={unavailable} />
            </li>
          ))}
        </ul>

        <div className="group relative mt-auto">
          <span
            tabIndex={0}
            aria-label={`${currentUser.name}, ${currentUser.role}`}
            className="flex size-8 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700 ring-2 ring-canvas"
          >
            {currentUser.initials}
          </span>
          <Tooltip>
            <span className="block font-medium text-white">{currentUser.name}</span>
            <span className="block text-zinc-400">{currentUser.role}</span>
          </Tooltip>
        </div>
      </aside>

      {/* Мобильные: подложка и выезжающее меню */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-zinc-950/30 transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-label="Основная навигация"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-canvas transition-transform duration-300 ease-(--ease-drawer) lg:hidden",
          mobileOpen ? "translate-x-0 shadow-overlay" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-zinc-900 font-mono text-[10px] font-semibold text-white">
              SA
            </span>
            <span className="text-sm font-semibold tracking-[-0.01em] text-zinc-950">SEO Article AI</span>
          </span>
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={onClose}
            className="pressable flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-900/5"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="mt-2 space-y-px px-2.5">
          {nav.map(({ label, icon: ItemIcon, href }) => {
            const active = isActive(href, pathname);
            const cls = cn(
              "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium",
              active ? "bg-white text-zinc-950 shadow-card ring-1 ring-zinc-200/80" : "text-zinc-600 hover:bg-zinc-900/5",
            );
            return (
              <li key={label}>
                {href ? (
                  <Link href={href} aria-current={active ? "page" : undefined} onClick={onClose} className={cls}>
                    <ItemIcon
                      weight={active ? "bold" : "regular"}
                      className={cn("size-4", active ? "text-accent" : "text-zinc-400")}
                    />
                    {label}
                  </Link>
                ) : (
                  <button type="button" onClick={unavailable} className={cls}>
                    <ItemIcon className="size-4 text-zinc-400" />
                    {label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-auto flex items-center gap-2.5 p-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700">
            {currentUser.initials}
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-zinc-900">{currentUser.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{currentUser.role}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function RailButton({ item, active, onUnavailable }: { item: NavItem; active: boolean; onUnavailable: () => void }) {
  const { label, icon: ItemIcon, href } = item;
  const cls = cn(
    "pressable relative flex size-9 items-center justify-center rounded-lg",
    active
      ? "bg-white text-accent shadow-card ring-1 ring-zinc-200/80"
      : "text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-900",
  );
  const content = (
    <>
      <ItemIcon weight={active ? "bold" : "regular"} className="size-[18px]" />
      <Tooltip>{label}</Tooltip>
    </>
  );

  return (
    <div className="group relative">
      {href ? (
        <Link href={href} aria-current={active ? "page" : undefined} aria-label={label} className={cls}>
          {content}
        </Link>
      ) : (
        <button type="button" aria-label={label} onClick={onUnavailable} className={cls}>
          {content}
        </button>
      )}
    </div>
  );
}

/**
 * Подсказка справа от элемента. Появляется с задержкой, чтобы не мигать при проходе
 * курсора по панели, исчезает сразу. Масштаб от левого края - со стороны триггера.
 */
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-full top-1/2 z-50 ml-2.5 -translate-y-1/2 origin-left whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1.5 text-xs leading-tight text-white shadow-raised",
        "scale-[0.96] opacity-0 transition-[opacity,transform] duration-100 ease-out",
        "group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300 group-hover:duration-150",
        "group-focus-within:scale-100 group-focus-within:opacity-100",
      )}
    >
      {children}
    </span>
  );
}
