import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-md border border-zinc-300/90 bg-white text-sm text-zinc-900 shadow-[0_1px_1px_rgb(24_24_27/0.03)] placeholder:text-zinc-500 transition-[border-color,box-shadow] duration-150 hover:border-zinc-400/80 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 disabled:bg-zinc-50 disabled:text-zinc-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/15";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, "h-10 px-3", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "min-h-24 resize-y px-3 py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
});

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, "h-10 appearance-none pl-3 pr-9", className)} {...props}>
        {children}
      </select>
      <CaretDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
      />
    </div>
  );
}

interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, required, hint, error, aside, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-zinc-800">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] leading-relaxed text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
