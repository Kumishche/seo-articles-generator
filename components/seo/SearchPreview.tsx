import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";

interface SearchPreviewProps {
  domain: string;
  path: string;
  seoTitle: string;
  metaDescription: string;
  onSeoTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
}

const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function Counter({ value, min = 0, max }: { value: number; min?: number; max: number }) {
  const ok = value >= min && value <= max;
  return (
    <span className={cn("text-xs tabular-nums", ok ? "text-slate-400" : "text-amber-600")}>
      {value} / {max}
    </span>
  );
}

export function SearchPreview({
  domain,
  path,
  seoTitle,
  metaDescription,
  onSeoTitleChange,
  onMetaDescriptionChange,
}: SearchPreviewProps) {
  const crumbs = path.split("/").filter(Boolean).join(" › ");

  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold text-slate-900">Предпросмотр в поиске</h2>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3.5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
            E
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12px] text-slate-800">{domain}</p>
            <p className="truncate text-[11px] text-slate-500">
              {domain} › {crumbs}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[17px] leading-snug text-[#1a0dab] hover:underline">
          {truncate(seoTitle || "Без заголовка", TITLE_MAX)}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
          {truncate(metaDescription || "Добавьте meta description, чтобы управлять текстом сниппета.", DESC_MAX)}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="SEO-заголовок" htmlFor="seo-title" aside={<Counter value={seoTitle.length} max={TITLE_MAX} />}>
          <Input id="seo-title" value={seoTitle} onChange={(e) => onSeoTitleChange(e.target.value)} className="h-9" />
        </Field>
        <Field
          label="Meta description"
          htmlFor="meta-description"
          aside={<Counter value={metaDescription.length} min={DESC_MIN} max={DESC_MAX} />}
          hint={`Оптимально ${DESC_MIN}-${DESC_MAX} символов.`}
        >
          <Textarea
            id="meta-description"
            rows={4}
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            aria-describedby="meta-description-hint"
            className="min-h-0 text-[13px]"
          />
        </Field>
      </div>
    </Card>
  );
}
