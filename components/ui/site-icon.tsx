import { cn } from "@/lib/utils";

/**
 * Иконка сайта в стиле favicon: монограмма домена на фирменном цвете.
 * Не тянем настоящие favicon со сторонних сервисов, чтобы не зависеть от сети.
 */
const palette: Record<string, string> = {
  "vc.ru": "bg-rose-500",
  "habr.com": "bg-sky-700",
  "rb.ru": "bg-slate-800",
  "cnews.ru": "bg-red-600",
  "skillbox.ru": "bg-violet-600",
  "spark.ru": "bg-orange-500",
  "kontur.ru": "bg-teal-600",
  "tinkoff.ru": "bg-yellow-400 text-slate-900",
};

const fallback = ["bg-slate-700", "bg-emerald-600", "bg-blue-600", "bg-amber-600", "bg-cyan-700"];

function colorFor(domain: string) {
  if (palette[domain]) return palette[domain];
  const sum = [...domain].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return fallback[sum % fallback.length];
}

export function SiteIcon({ domain, className }: { domain: string; className?: string }) {
  const letter = domain.replace(/^www\./, "").charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white",
        colorFor(domain),
        className,
      )}
    >
      {letter}
    </span>
  );
}
