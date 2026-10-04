import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Загрузка"
      className={cn(
        "inline-block size-4 animate-spin-fast rounded-full border-2 border-current border-r-transparent opacity-80",
        className,
      )}
    />
  );
}
