"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/ssr";
import { ApiError, articleApi, errorMessage } from "@/lib/api";
import type { Article, SeoAnalysis } from "@/lib/types";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageIntro } from "@/components/layout/PageIntro";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EditorWorkspace } from "./EditorWorkspace";

type State =
  | { kind: "loading" }
  | { kind: "ready"; article: Article & { seo: SeoAnalysis } }
  | { kind: "generating"; article: Article }
  | { kind: "not-ready"; article: Article }
  | { kind: "error"; message: string; notFound: boolean };

const GENERATION_POLL_MS = 2000;

/** Загружает статью и открывает редактор, только если она уже сгенерирована */
export function EditorLoader({ articleId }: { articleId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const article = await articleApi.getArticle(articleId);
        if (cancelled) return;
        if (article.status === "review" && article.seo) {
          setState({ kind: "ready", article: { ...article, seo: article.seo } });
        } else if (article.status === "generating") {
          // Генерацию запустили раньше: ждем ее и открываем редактор
          setState({ kind: "generating", article });
          timer = setTimeout(load, GENERATION_POLL_MS);
        } else {
          setState({ kind: "not-ready", article });
        }
      } catch (e) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: errorMessage(e),
          notFound: e instanceof ApiError && e.status === 404,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [articleId]);

  if (state.kind === "ready") return <EditorWorkspace article={state.article} />;

  const title = state.kind === "not-ready" || state.kind === "generating" ? state.article.title : "Статья";
  return (
    <>
      <AppHeader
        step={3}
        articleId={articleId}
        breadcrumbs={[{ label: "Мои статьи", href: "/articles" }, { label: title }, { label: "Редактор" }]}
      />
      <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <PageIntro
          title="Редактор статьи"
          subtitle="Проверьте текст, внесите изменения и подготовьте материал к публикации."
        />
        <div className="mt-6">
          {state.kind === "loading" ? (
            <div className="flex items-center gap-2 text-[13px] text-zinc-500" role="status">
              <Spinner className="size-4 text-accent" />
              Загружаем статью…
            </div>
          ) : state.kind === "generating" ? (
            <Card className="flex items-start gap-3 px-5 py-5 sm:px-6" role="status">
              <Spinner className="mt-0.5 size-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-zinc-950">Статья генерируется</p>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                  Обычно это занимает одну-две минуты. Редактор откроется автоматически, когда текст будет готов.
                </p>
                <Link
                  href={`/articles/${articleId}/research`}
                  className="mt-4 inline-block text-sm font-medium text-accent-ink hover:underline"
                >
                  Вернуться к структуре
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="flex items-start gap-3 px-5 py-5 sm:px-6">
              <WarningCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-zinc-950">
                  {state.kind === "not-ready"
                    ? "Статья еще не сгенерирована"
                    : state.notFound
                      ? "Статья не найдена"
                      : "Не удалось загрузить статью"}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                  {state.kind === "not-ready"
                    ? "Проверьте структуру и запустите генерацию на этапе анализа."
                    : state.notFound
                      ? "Возможно, сервер перезапускался: в этой версии статьи хранятся только в памяти."
                      : state.message}
                </p>
                <Link
                  href={state.kind === "not-ready" ? `/articles/${articleId}/research` : "/articles/new"}
                  className="mt-4 inline-block text-sm font-medium text-accent-ink hover:underline"
                >
                  {state.kind === "not-ready" ? "Перейти к анализу и структуре" : "Создать новую статью"}
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
