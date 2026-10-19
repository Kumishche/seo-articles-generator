import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Панель: белая поверхность на фоне canvas. Внутренние блоки разделяются линиями, а не вложенными карточками. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-zinc-200/90 bg-white shadow-card", className)} {...props} />;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}

export function CardHeader({ title, description, aside, className, as: Heading = "h2" }: CardHeaderProps) {
  return (
    <div className={cn("px-5 pt-5 sm:px-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <Heading className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950">{title}</Heading>
        {aside}
      </div>
      {description && <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-zinc-500">{description}</p>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-4 sm:px-6", className)} {...props} />;
}

interface PanelSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  aside?: ReactNode;
  description?: ReactNode;
}

/** Раздел внутри панели: заголовок + содержимое. Разделы отделяются друг от друга border-t родителя. */
export function PanelSection({ title, aside, description, className, children, ...props }: PanelSectionProps) {
  return (
    <section className={cn("px-5 py-5", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 className="text-[13px] font-semibold text-zinc-950">{title}</h2>
        {aside}
      </div>
      {description && <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
