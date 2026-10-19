"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, NotePencil, WarningCircle } from "@phosphor-icons/react/ssr";
import { articleApi, errorMessage } from "@/lib/api";
import type { ArticleStatus, ArticleSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const statusLabels: Record<ArticleStatus, { label: string; tone: "neutral" | "accent" | "success" | "warning" }> = {
  draft: { label: "Анализ не удался", tone: "warning" },
  analyzing: { label: "Идет анализ", tone: "accent" },
  structure_ready: { label: "Структура готова", tone: "neutral" },
  generating: { label: "Генерируется", tone: "accent" },
  review: { label: "Готово к проверке", tone: "success" },
  published: { label: "Опубликовано", tone: "success" },
};

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function articleHref(a: ArticleSummary) {
  return a.status === "review" || a.status === "published" ? `/articles/${a.id}/editor` : `/articles/${a.id}/research`;
}

export function ArticleList() {
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    articleApi
      .listArticles()
      .then((list) => !cancelled && setArticles(list))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1000px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        title="Мои статьи"
        subtitle="Статьи хранятся, пока работает сервер: после перезапуска список очищается."
        aside={
          <Link
            href="/articles/new"
            className="pressable inline-flex h-9 items-center gap-2 self-start rounded-md bg-accent px-3.5 text-sm font-medium text-white hover:bg-accent-hover sm:self-auto"
          >
            <NotePencil weight="bold" className="size-4" />
            Новая статья
          </Link>
        }
      />

      <div className="mt-6">
        {error ? (
          <Card className="flex items-start gap-3 px-5 py-5">
            <WarningCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-[14px] font-semibold text-zinc-950">Не удалось загрузить статьи</p>
              <p className="mt-1 text-[13px] text-zinc-500">{error}</p>
            </div>
          </Card>
        ) : !articles ? (
          <div className="flex items-center gap-2 text-[13px] text-zinc-500" role="status">
            <Spinner className="size-4 text-accent" />
            Загружаем статьи…
          </div>
        ) : articles.length === 0 ? (
          <Card className="px-5 py-10 text-center">
            <p className="text-[14px] font-semibold text-zinc-950">Статей пока нет</p>
            <p className="mt-1 text-[13px] text-zinc-500">Укажите тему, и система подготовит первую статью.</p>
            <Link href="/articles/new" className="mt-4 inline-block text-sm font-medium text-accent-ink hover:underline">
              Создать статью
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-zinc-100">
              {articles.map((a) => {
                const status = statusLabels[a.status];
                return (
                  <li key={a.id}>
                    <Link
                      href={articleHref(a)}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-zinc-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-zinc-950">{a.title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <span>Изменена {dateFormat.format(new Date(a.updatedAt))}</span>
                        </p>
                      </div>
                      {a.seoScore !== null && (
                        <span
                          className={cn(
                            "hidden font-mono text-[13px] sm:block",
                            a.seoScore >= 75 ? "text-emerald-600" : a.seoScore >= 50 ? "text-amber-600" : "text-red-600",
                          )}
                          title="SEO-оценка"
                        >
                          {a.seoScore}
                        </span>
                      )}
                      <ArrowRight className="size-4 shrink-0 text-zinc-300 transition-colors duration-150 group-hover:text-zinc-600" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
