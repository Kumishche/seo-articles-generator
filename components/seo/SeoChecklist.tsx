import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react/ssr";
import type { SeoCheck } from "@/lib/types";
import { Card } from "@/components/ui/card";

const icons = {
  passed: <CheckCircle weight="fill" className="size-[18px] shrink-0 text-emerald-500" />,
  warning: <WarningCircle weight="fill" className="size-[18px] shrink-0 text-amber-500" />,
  failed: <XCircle weight="fill" className="size-[18px] shrink-0 text-red-500" />,
};

export function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const passed = checks.filter((c) => c.status === "passed");
  const issues = checks.filter((c) => c.status !== "passed");

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900">SEO-проверки</h2>
        <span className="text-[13px] tabular-nums text-slate-400">
          {passed.length} из {checks.length}
        </span>
      </div>

      <section className="mt-4">
        <h3 className="text-xs font-medium text-slate-500">Успешно</h3>
        <ul className="mt-2 space-y-2">
          {passed.map((c) => (
            <li key={c.id} className="flex gap-2.5 px-0.5 text-[13px] leading-5 text-slate-700">
              {icons.passed}
              {c.label}
            </li>
          ))}
        </ul>
      </section>

      {issues.length > 0 && (
        <section className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-medium text-slate-500">Предупреждения</h3>
          <ul className="mt-2 space-y-2">
            {issues.map((c) => (
              <li key={c.id} className="flex gap-2.5 rounded-lg bg-amber-50/70 px-2.5 py-2">
                {icons[c.status]}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-5 text-slate-800">{c.label}</p>
                  {c.hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{c.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
}
