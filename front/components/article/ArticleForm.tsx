"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "@phosphor-icons/react/ssr";
import { articleApi, errorMessage } from "@/lib/api";
import type { ArticleSource } from "@/lib/types";
import { cn, plural } from "@/lib/utils";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { FileUploader, type UploadedFile } from "./FileUploader";
import { HowItWorksCard } from "./HowItWorksCard";
import { PlanEditor } from "./PlanEditor";
import { SourceList } from "./SourceList";

const planPlaceholder = `Введение
1. Что такое CRM
2. Основные функции CRM
3. Критерии выбора
4. Сравнение решений
5. Заключение`;

export function ArticleForm() {
  const router = useRouter();
  const toast = useToast();
  const [topic, setTopic] = useState("");
  const [requirements, setRequirements] = useState("");
  const [plan, setPlan] = useState("");
  const [links, setLinks] = useState<ArticleSource[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const uploading = files.some((f) => f.progress < 100);
  const canSubmit = topic.trim().length > 0 && !uploading;
  const sourcesCount = links.length + files.length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { id } = await articleApi.createArticle({
        topic: topic.trim(),
        requirements: requirements.trim() || undefined,
        draftPlan: plan.trim() || undefined,
        sources: [...links, ...files.map(({ progress: _p, ...f }) => f)],
      });
      router.push(`/articles/${id}/research`);
    } catch (e) {
      setSubmitting(false);
      toast("Не удалось начать анализ", { tone: "warning", description: errorMessage(e) });
    }
  }

  const readiness = [
    { label: "Тема", done: topic.trim().length > 0 },
    { label: "План", done: plan.trim().length > 0 },
    {
      label: sourcesCount
        ? `${sourcesCount} ${plural(sourcesCount, ["источник", "источника", "источников"])}`
        : "Источники",
      done: sourcesCount > 0,
    },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <PageIntro
          title="Новая статья"
          subtitle="Укажите тему статьи и при необходимости добавьте план и источники. Система проанализирует поисковую выдачу и подготовит структуру материала."
        />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
          <div className="min-w-0 space-y-6">
            {/* Тема пишется так же, как будущий заголовок статьи */}
            <Card className="overflow-hidden">
              <div className="px-5 pb-5 pt-5 sm:px-7 sm:pt-6">
                <label htmlFor="topic" className="text-[13px] font-medium text-zinc-500">
                  Тема
                  <span className="ml-0.5 text-red-500" aria-hidden>
                    *
                  </span>
                </label>
                <textarea
                  id="topic"
                  name="topic"
                  rows={1}
                  required
                  autoFocus
                  autoComplete="off"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value.replace(/\n/g, " "))}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  placeholder="Например: Как выбрать CRM для малого бизнеса"
                  aria-describedby="topic-hint"
                  className="mt-1.5 block w-full resize-none bg-transparent text-[24px] font-semibold leading-[1.2] tracking-[-0.025em] text-zinc-950 [field-sizing:content] placeholder:font-medium placeholder:text-[#8b8b94] focus:outline-none sm:text-[30px]"
                />
                <p id="topic-hint" className="mt-3 text-[13px] text-zinc-500">
                  Сформулируйте тему так, как ее искал бы ваш читатель.
                </p>
              </div>
              <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-5 sm:px-7">
                <Field
                  label="Дополнительные требования"
                  htmlFor="requirements"
                  hint="Необязательно. Эти данные помогут системе точнее адаптировать материал."
                >
                  <Textarea
                    id="requirements"
                    name="requirements"
                    rows={2}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Укажите целевую аудиторию, желаемый стиль, объем статьи или другие требования"
                    aria-describedby="requirements-hint"
                    className="min-h-[76px] [field-sizing:content]"
                  />
                </Field>
              </div>
            </Card>

            <Card className="px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950">
                  <label htmlFor="plan">Предварительный план</label>
                </h2>
                <Badge>Необязательно</Badge>
              </div>
              <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-zinc-500">
                Если у вас уже есть представление о структуре статьи, добавьте примерный план. Система учтет его при
                формировании итоговой структуры.
              </p>
              <div className="mt-4">
                <PlanEditor id="plan" value={plan} onChange={setPlan} placeholder={planPlaceholder} />
              </div>
            </Card>

            <div className="pt-2">
              <HowItWorksCard />
            </div>
          </div>

          {/* Источники - отдельный лоток материалов справа */}
          <aside className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <Card>
              <div className="px-5 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950">Источники</h2>
                  {sourcesCount > 0 && (
                    <Badge tone="accent" className="font-mono">
                      {sourcesCount}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                  Добавьте материалы, которые система должна учитывать при подготовке статьи.
                </p>
              </div>
              <div className="space-y-5 px-5 pb-5 pt-4">
                <SourceList links={links} onChange={setLinks} />
                <FileUploader files={files} onChange={setFiles} />
                {sourcesCount === 0 && (
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Источники можно не добавлять: система сама соберет материалы из поисковой выдачи.
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* Панель запуска: что уже заполнено и главная кнопка */}
      <div className="sticky bottom-0 z-20 border-t border-zinc-200/80 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <ul className="hidden items-center gap-4 md:flex" aria-label="Заполненные данные">
            {readiness.map((r) => (
              <li
                key={r.label}
                className={cn(
                  "flex items-center gap-1.5 text-[13px] transition-colors duration-200",
                  r.done ? "text-zinc-900" : "text-zinc-400",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full transition-colors duration-200",
                    r.done ? "bg-zinc-900 text-white" : "ring-1 ring-inset ring-zinc-300",
                  )}
                >
                  {r.done && <Check weight="bold" className="size-2.5" />}
                </span>
                {r.label}
                <span className="sr-only">{r.done ? "(заполнено)" : "(не заполнено)"}</span>
              </li>
            ))}
          </ul>
          <p className="ml-auto hidden text-[13px] text-zinc-500 sm:block" aria-live="polite">
            {topic.trim()
              ? uploading
                ? "Дождитесь окончания загрузки файлов"
                : "Обычно анализ занимает несколько минут"
              : "Укажите тему статьи, чтобы начать анализ"}
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            loading={submitting}
            className="w-full sm:ml-0 sm:w-auto"
          >
            Начать анализ
            {!submitting && <ArrowRight weight="bold" className="size-3.5" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
