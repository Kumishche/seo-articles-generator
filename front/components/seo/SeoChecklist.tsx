import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react/ssr";
import type { SeoCheck } from "@/lib/types";
import { PanelSection } from "@/components/ui/card";

const icons = {
  passed: <CheckCircle weight="fill" className="mt-px size-4 shrink-0 text-emerald-500" />,
  warning: <WarningCircle weight="fill" className="mt-px size-4 shrink-0 text-amber-500" />,
  failed: <XCircle weight="fill" className="mt-px size-4 shrink-0 text-red-500" />,
};

export function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const passed = checks.filter((c) => c.status === "passed");
  const issues = checks.filter((c) => c.status !== "passed");

  return (
    <PanelSection
      title="SEO-проверки"
      aside={
        <span className="font-mono text-[11px] text-zinc-400">
          {passed.length}/{checks.length}
        </span>
      }
    >
      {issues.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs text-zinc-500">Предупреждения</h3>
          <ul className="mt-2 space-y-2.5">
            {issues.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                {icons[c.status]}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-5 text-zinc-900">{c.label}</p>
                  {c.hint && <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{c.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="text-xs text-zinc-500">Успешно</h3>
      <ul className="mt-2 space-y-2">
        {passed.map((c) => (
          <li key={c.id} className="flex gap-2.5 text-[13px] leading-5 text-zinc-600">
            {icons.passed}
            {c.label}
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
