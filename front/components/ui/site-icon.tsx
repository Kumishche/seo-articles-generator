import { cn } from "@/lib/utils";

/**
 * Иконка сайта в стиле favicon: монограмма домена.
 * Нейтральная заливка, чтобы списки источников не превращались в радугу.
 * Настоящие favicon не тянем со сторонних сервисов, чтобы не зависеть от сети.
 */
export function SiteIcon({ domain, className }: { domain: string; className?: string }) {
  const letter = domain
    .replace(/^www\./, "")
    .charAt(0)
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-white font-mono text-[11px] font-medium text-zinc-700 shadow-[0_1px_1px_rgb(24_24_27/0.04)] ring-1 ring-inset ring-zinc-200",
        className,
      )}
    >
      {letter}
    </span>
  );
}
