import { CheckCircle, Lightbulb } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function RecommendationsCard({ items }: { items: string[] }) {
  return (
    <Card>
      <CardHeader
        icon={<Lightbulb className="size-[18px]" />}
        title="Рекомендации"
        description="Что стоит учесть, чтобы статья была полнее материалов конкурентов."
      />
      <CardBody className="pt-3">
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
              <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-indigo-500" />
              {item}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
