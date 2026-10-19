"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowsClockwise,
  ArrowSquareOut,
  FloppyDisk,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react/ssr";
import { ApiError, articleApi, errorMessage } from "@/lib/api";
import { analysisStages, RESEARCH_POLL_MS } from "@/lib/constants";
import type { ArticleStatus, OutlineSection, ResearchResponse, ResearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { AnalysisProgress } from "./AnalysisProgress";
import { OutlineEditor } from "./OutlineEditor";
import { ResearchDossier } from "./ResearchDossier";
import { ResearchSummary } from "./ResearchSummary";

const intro = {
  title: "Анализ и структура",
  subtitle: "Проверьте результаты исследования и при необходимости измените структуру будущей статьи.",
};

export function ResearchWorkspace({ articleId }: { articleId: string }) {
  const router = useRouter();
  const toast = useToast();

  const [research, setResearch] = useState<ResearchResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  /** Смена ключа перезапускает опрос статуса (после «Повторить анализ») */
  const [pollKey, setPollKey] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [dirty, setDirty] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [restarting, setRestarting] = useState(false);
  /** Анализ шел на глазах у пользователя: тогда результат появляется с анимацией */
  const sawPending = useRef(false);
  /** Структура загружена в редактор: повторные опросы не должны затирать правки пользователя */
  const outlineLoaded = useRef(false);
  /** Статус статьи из прошлого опроса: по смене generating -> review узнаем, что генерация закончилась */
  const lastArticleStatus = useRef<ArticleStatus | null>(null);
  /** Генерацию запустили с этой страницы и ждут ответа запроса */
  const ownGeneration = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const next = await articleApi.getResearch(articleId);
        if (cancelled) return;
        setLoadError(null);
        if (next.status === "pending") sawPending.current = true;
        if (next.status === "completed" && next.outline && !outlineLoaded.current) {
          outlineLoaded.current = true;
          setSections(next.outline.sections);
          setDirty(false);
          setRevealed(sawPending.current);
        }
        notifyGeneration(lastArticleStatus.current, next);
        lastArticleStatus.current = next.articleStatus;
        setResearch(next);
        // Опрашиваем, пока идет анализ или генерация, запущенная раньше (например, до ухода со страницы)
        if (next.status !== "pending" && next.articleStatus !== "generating") return;
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setNotFound(true);
          return;
        }
        // Временная ошибка сети: показываем ее и продолжаем опрос
        setLoadError(errorMessage(e));
      }
      timer = setTimeout(poll, RESEARCH_POLL_MS);
    }

    /** Сообщает об исходе генерации, которая шла без активного запроса с этой страницы */
    function notifyGeneration(previous: ArticleStatus | null, next: ResearchResponse) {
      if (ownGeneration.current || next.articleStatus === "generating") return;
      if (previous === "generating" && next.articleStatus === "review") {
        toast("Статья готова", { description: "Генерация завершилась, статью можно открыть в редакторе." });
      } else if ((previous === "generating" || previous === null) && next.generationError) {
        toast("Генерация статьи не удалась", { tone: "warning", description: next.generationError });
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [articleId, pollKey, toast]);

  const done = research?.status === "completed" ? (research as ResearchResult) : null;
  /** Статья генерируется: этим запросом или запущенным раньше */
  const busy = generating || done?.articleStatus === "generating";
  const articleReady = !busy && done?.articleStatus === "review";

  const stats = useMemo(() => {
    if (!done) return null;
    const h2 = sections.filter((s) => s.level === 2).length;
    const body = sections.filter((s) => s.level !== 1).length;
    const base = Math.max(1, done.outline.sections.filter((s) => s.level !== 1).length);
    const ratio = body / base;
    const round = (n: number) => Math.max(300, Math.round((n * ratio) / 100) * 100);
    return {
      // Введение не выносится в структуру отдельной строкой, но считается разделом
      sections: h2 + 1,
      words: { min: round(done.outline.estimatedWords.min), max: round(done.outline.estimatedWords.max) },
      empty: sections.filter((s) => !s.title.trim()).length,
      h2,
    };
  }, [sections, done]);

  function changeSections(next: OutlineSection[]) {
    setSections(next);
    setDirty(true);
  }

  async function restart() {
    setRestarting(true);
    try {
      const next = await articleApi.restartResearch(articleId);
      sawPending.current = true;
      outlineLoaded.current = false;
      setRevealed(false);
      setShowErrors(false);
      setResearch(next);
      setPollKey((k) => k + 1);
    } catch (e) {
      toast("Не удалось перезапустить анализ", { tone: "warning", description: errorMessage(e) });
    } finally {
      setRestarting(false);
    }
  }

  async function saveDraft() {
    setSaving(true);
    try {
      await articleApi.saveOutline(articleId, sections);
      setDirty(false);
      toast("Черновик сохранен", { description: "Структуру можно будет изменить позже." });
    } catch (e) {
      setShowErrors(true);
      toast("Черновик не сохранен", { tone: "warning", description: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  async function generate() {
    if (!stats || busy) return;
    if (stats.empty > 0 || stats.h2 === 0) {
      setShowErrors(true);
      toast(stats.h2 === 0 ? "Добавьте хотя бы один раздел" : "Заполните пустые заголовки", {
        tone: "warning",
        description: stats.h2 === 0 ? undefined : "Удалите лишние строки или введите названия разделов.",
      });
      return;
    }
    ownGeneration.current = true;
    setGenerating(true);
    try {
      await articleApi.generateArticle(articleId, sections);
      // Пользователь мог уйти со страницы, пока шла генерация: не уводим его в редактор
      if (mounted.current) router.push(`/articles/${articleId}/editor`);
    } catch (e) {
      ownGeneration.current = false;
      if (!mounted.current) return;
      setGenerating(false);
      toast("Не удалось сгенерировать статью", { tone: "warning", description: errorMessage(e) });
      // Например, генерацию уже запустили в другой вкладке: обновляем статус с сервера
      if (e instanceof ApiError && e.status === 409) setPollKey((k) => k + 1);
    }
  }

  const topic = done?.outline.sections[0]?.title ?? "Новая статья";
  const header = (
    <AppHeader
      step={2}
      articleId={articleId}
      breadcrumbs={[{ label: "Мои статьи", href: "/articles" }, { label: topic }, { label: "Анализ и структура" }]}
    />
  );

  if (notFound) {
    return (
      <>
        {header}
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <PageIntro {...intro} />
          <div className="mt-6">
            <StateCard
              title="Статья не найдена"
              description="Возможно, сервер перезапускался: в этой версии статьи хранятся только в памяти."
              action={
                <Link href="/articles/new" className="text-sm font-medium text-accent-ink hover:underline">
                  Создать новую статью
                </Link>
              }
            />
          </div>
        </main>
      </>
    );
  }

  if (!done || !stats) {
    const failed = research?.status === "failed";
    return (
      <>
        {header}
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <PageIntro {...intro} />
          <div className="mt-6">
            {failed ? (
              <StateCard
                title="Анализ не удался"
                description={research?.error ?? "Неизвестная ошибка"}
                action={
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={restart} loading={restarting}>
                      {!restarting && <ArrowsClockwise className="size-4" />}
                      Повторить анализ
                    </Button>
                    <Link
                      href="/articles/new"
                      className="pressable inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-900/5"
                    >
                      Изменить исходные данные
                    </Link>
                  </div>
                }
              />
            ) : (
              <>
                <AnalysisProgress stages={analysisStages} current={research?.progress?.stage ?? 0} />
                {loadError && (
                  <p className="mt-3 text-[13px] text-amber-700" role="status">
                    {loadError}. Повторяем запрос…
                  </p>
                )}
              </>
            )}
          </div>
        </main>
      </>
    );
  }

  // Каскадное появление блоков после завершения анализа
  const reveal = (i: number) =>
    revealed ? { className: "animate-fade-up", style: { animationDelay: `${i * 60}ms` } } : { className: "" };

  return (
    <>
      {header}
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <PageIntro {...intro} />

          <div {...reveal(0)} className={cn("mt-6", reveal(0).className)}>
            <ResearchSummary
              research={done}
              words={stats.words}
              sections={stats.sections}
              keywords={done.outline.targetKeywords}
              onRestart={restart}
              restartDisabled={busy || restarting}
            />
          </div>

          {/* Досье идет первым в DOM (сначала исследование, потом структура), на широком экране - справа */}
          <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
            <div
              {...reveal(1)}
              className={cn(
                "min-w-0 xl:sticky xl:top-[calc(var(--header-h)+20px)] xl:col-start-2 xl:row-start-1 xl:h-[calc(100dvh-var(--header-h)-100px)]",
                reveal(1).className,
              )}
            >
              <ResearchDossier research={done} />
            </div>
            <div {...reveal(2)} className={cn("min-w-0 xl:col-start-1 xl:row-start-1", reveal(2).className)}>
              <OutlineEditor sections={sections} onChange={changeSections} showErrors={showErrors} />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-zinc-200/80 bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1320px] items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/articles/new"
              className="pressable inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-950"
            >
              <ArrowLeft className="size-4" />
              Назад
            </Link>
            <span
              className={cn(
                "hidden text-[13px] text-zinc-500 transition-opacity duration-200 md:block",
                dirty || busy ? "opacity-100" : "opacity-0",
              )}
              aria-live="polite"
            >
              {generating
                ? "Обычно генерация занимает одну-две минуты"
                : busy
                  ? "Статья генерируется. Можно подождать здесь или вернуться позже"
                  : dirty
                    ? "Есть несохраненные изменения"
                    : ""}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={saveDraft}
                loading={saving}
                disabled={busy}
                aria-label="Сохранить черновик"
                className="max-sm:w-9 max-sm:px-0"
              >
                {!saving && <FloppyDisk className="size-4" />}
                <span className="hidden sm:inline">Сохранить черновик</span>
              </Button>
              {articleReady && (
                <Link
                  href={`/articles/${articleId}/editor`}
                  className="pressable inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-800 shadow-card hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <ArrowSquareOut className="size-4" />
                  <span className="hidden sm:inline">Открыть статью</span>
                </Link>
              )}
              <Button size="lg" onClick={generate} loading={busy}>
                {!busy && <Sparkle weight="fill" className="size-3.5" />}
                {busy ? (
                  "Генерируем…"
                ) : (
                  <>
                    <span className="sm:hidden">Сгенерировать</span>
                    <span className="hidden sm:inline">Сгенерировать статью</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StateCard({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <Card className="flex items-start gap-3 px-5 py-5 sm:px-6">
      <WarningCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-zinc-950">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{description}</p>
        <div className="mt-4">{action}</div>
      </div>
    </Card>
  );
}
