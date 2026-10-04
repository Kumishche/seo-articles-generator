"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Files, ListNumbers, TextAa } from "@phosphor-icons/react/ssr";
import { articleApi } from "@/lib/api";
import type { ArticleSource } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FileUploader, type UploadedFile } from "./FileUploader";
import { SourceList } from "./SourceList";

import { ANALYSIS_FLAG } from "@/lib/constants";

const planPlaceholder = `Введение
1. Что такое CRM
2. Основные функции CRM
3. Критерии выбора
4. Сравнение решений
5. Заключение`;

export function ArticleForm() {
  const router = useRouter();
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
    const { id } = await articleApi.createArticle({
      topic: topic.trim(),
      requirements: requirements.trim() || undefined,
      draftPlan: plan.trim() || undefined,
      sources: [...links, ...files.map(({ progress: _p, ...f }) => f)],
    });
    try {
      sessionStorage.setItem(ANALYSIS_FLAG, "1");
    } catch {
      // sessionStorage может быть недоступен: тогда сразу покажем результат анализа
    }
    router.push(`/articles/${id}/research`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Card>
        <CardHeader icon={<TextAa className="size-[18px]" />} title="Тема статьи" />
        <CardBody className="space-y-5">
          <Field
            label="Тема"
            htmlFor="topic"
            required
            hint="Сформулируйте тему так, как ее искал бы ваш читатель."
          >
            <Input
              id="topic"
              name="topic"
              required
              autoComplete="off"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: Как выбрать CRM для малого бизнеса"
              aria-describedby="topic-hint"
              className="h-11 text-[15px]"
            />
          </Field>
          <Field
            label="Дополнительные требования"
            htmlFor="requirements"
            hint="Необязательно. Эти данные помогут системе точнее адаптировать материал."
          >
            <Textarea
              id="requirements"
              name="requirements"
              rows={3}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Укажите целевую аудиторию, желаемый стиль, объем статьи или другие требования"
              aria-describedby="requirements-hint"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<ListNumbers className="size-[18px]" />}
          title="Предварительный план"
          aside={<Badge>Необязательно</Badge>}
          description="Если у вас уже есть представление о структуре статьи, добавьте примерный план. Система учтет его при формировании итоговой структуры."
        />
        <CardBody>
          <label htmlFor="plan" className="sr-only">
            Предварительный план
          </label>
          <Textarea
            id="plan"
            name="plan"
            rows={7}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder={planPlaceholder}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<Files className="size-[18px]" />}
          title="Источники"
          aside={sourcesCount > 0 ? <Badge tone="accent">{sourcesCount}</Badge> : undefined}
          description="Добавьте материалы, которые система должна учитывать при подготовке статьи."
        />
        <CardBody className="space-y-6">
          <SourceList links={links} onChange={setLinks} />
          <div className="h-px bg-slate-100" />
          <FileUploader files={files} onChange={setFiles} />
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="flex items-center gap-2 text-[13px] text-slate-500">
          <Clock className="size-4 shrink-0 text-slate-400" />
          {topic.trim()
            ? uploading
              ? "Дождитесь окончания загрузки файлов"
              : "Обычно анализ занимает несколько минут"
            : "Укажите тему статьи, чтобы начать анализ"}
        </p>
        <Button type="submit" size="lg" disabled={!canSubmit} loading={submitting} className="w-full sm:w-auto">
          Начать анализ
          {!submitting && <ArrowRight weight="bold" className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
