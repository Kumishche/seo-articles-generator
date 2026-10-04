import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200/80 bg-white shadow-card", className)}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}

export function CardHeader({ title, description, icon, aside, className, as: Heading = "h2" }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      {icon && (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Heading className="text-[15px] font-semibold leading-6 text-slate-900">{title}</Heading>
          {aside}
        </div>
        {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-4 sm:px-6 sm:pb-6", className)} {...props} />;
}
