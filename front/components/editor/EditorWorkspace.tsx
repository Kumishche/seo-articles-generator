"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowsClockwise, DownloadSimple, FloppyDisk } from "@phosphor-icons/react/ssr";
import { articleApi, errorMessage } from "@/lib/api";
import { SITE_DOMAIN } from "@/lib/constants";
import { downloadBlob } from "@/lib/export";
import type { AiAction, Article, CompetitorPage, ExportFormat, SeoAnalysis, SeoCheck } from "@/lib/types";
import { countOccurrences, countWords, formatNumber, plural, readingTime } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageIntro } from "@/components/layout/PageIntro";
import { PublishModal } from "@/components/publication/PublishModal";
import { RegenerateDialog } from "@/components/publication/RegenerateDialog";
import { KeywordStats } from "@/components/seo/KeywordStats";
import { SearchPreview } from "@/components/seo/SearchPreview";
import { SeoChecklist } from "@/components/seo/SeoChecklist";
import { SeoScore } from "@/components/seo/SeoScore";
import { SeoPanel } from "@/components/seo/SeoPanel";
import { SourcesCard } from "@/components/seo/SourcesCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { ArticleEditor } from "./ArticleEditor";
import { ArticleToc } from "./ArticleToc";

type SaveState = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_MS = 1500;
const CHECK_WEIGHT = 7;
/** Внутренняя ссылка: относительный адрес или ссылка на домен сайта */
const siteLink = new RegExp(`href="https?://(www\\.)?${SITE_DOMAIN.replace(/\./g, "\\.")}`, "i");

interface EditorWorkspaceProps {
  article: Article & { seo: SeoAnalysis };
}

export function EditorWorkspace({ article }: EditorWorkspaceProps) {
  const toast = useToast();

  const [title, setTitle] = useState(article.title);
  const [seoTitle, setSeoTitle] = useState(article.seoTitle);
  const [meta, setMeta] = useState(article.metaDescription);
  const [text, setText] = useState(() => article.content.replace(/<[^>]+>/g, " "));
  const html = useRef(article.content);
  const [docHtml, setDocHtml] = useState(article.content);
  /** Оценка с сервера: обновляется после каждого сохранения и повторной генерации */
  const [seo, setSeo] = useState<SeoAnalysis>(article.seo);
  const [slug, setSlug] = useState(article.slug);
  const [usedSources, setUsedSources] = useState<CompetitorPage[]>(article.usedSources);

  const [initialHtml, setInitialHtml] = useState(article.content);
  const [contentKey, setContentKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [exportOpen, setExportOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [hasLinks, setHasLinks] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Текущее сохранение: экспорт и повторное сохранение ждут его завершения */
  const inFlight = useRef<Promise<boolean> | null>(null);

  // Обновляем подпись «Сохранено ...» раз в 30 секунд
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  /** Сохраняет текущее состояние редактора. true - если сохранение прошло успешно. */
  const persist = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) await inFlight.current;
    setSaveState("saving");
    const run = articleApi
      .saveArticle(article.id, { title, seoTitle, metaDescription: meta, content: html.current })
      .then((saved) => {
        setSeo(saved.seo ?? article.seo);
        setSlug(saved.slug);
        setSaveState("saved");
        setSavedAt(Date.now());
        setNow(Date.now());
        return true;
      })
      .catch((e) => {
        setSaveState("error");
        toast("Изменения не сохранены", { tone: "warning", description: errorMessage(e) });
        return false;
      });
    inFlight.current = run;
    const ok = await run;
    if (inFlight.current === run) inFlight.current = null;
    return ok;
  }, [article.id, article.seo, title, seoTitle, meta, toast]);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  const markDirty = useCallback(() => {
    setSaveState("dirty");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => persistRef.current(), AUTOSAVE_MS);
  }, []);

  useEffect(
    () => () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    },
    [],
  );

  const onContentChange = useCallback(
    (nextHtml: string, nextText: string, initial?: boolean) => {
      html.current = nextHtml;
      setDocHtml(nextHtml);
      setText(nextText);
      setHasLinks(/href="\//i.test(nextHtml) || siteLink.test(nextHtml));
      if (!initial) markDirty();
    },
    [markDirty],
  );

  const runAiAction = useCallback(
    (action: AiAction, paragraph: string) => articleApi.applyParagraphAction(article.id, action, paragraph),
    [article.id],
  );

  /* ---------------- SEO-показатели: серверная оценка + мгновенные проверки при вводе ---------------- */

  const words = useMemo(() => countWords(text), [text]);

  const keywords = useMemo(
    () =>
      seo.keywords.map((k) => ({
        ...k,
        count: countOccurrences(`${title}\n${text}`, k.phrase),
      })),
    [seo.keywords, title, text],
  );

  const checks = useMemo<SeoCheck[]>(() => {
    const primary = seo.keywords[0]?.phrase ?? "";
    const metaOk = meta.length >= 140 && meta.length <= 160;
    return seo.checks.map((c) => {
      if (c.id === "kw-title" && primary && !countOccurrences(title, primary))
        return {
          ...c,
          status: "warning",
          label: "Основного ключа нет в заголовке",
          hint: `Добавьте «${primary}» в H1.`,
        };
      if (c.id === "meta" && metaOk)
        return { ...c, status: "passed", label: "Meta description оптимальной длины", hint: undefined };
      if (c.id === "links" && hasLinks)
        return { ...c, status: "passed", label: "Внутренние ссылки добавлены", hint: undefined };
      return c;
    });
  }, [seo, meta, title, hasLinks]);

  const score = useMemo(() => {
    const serverWarnings = seo.checks.filter((c) => c.status !== "passed").length;
    const warnings = checks.filter((c) => c.status !== "passed").length;
    return Math.min(seo.maxScore, Math.max(0, seo.score + (serverWarnings - warnings) * CHECK_WEIGHT));
  }, [checks, seo]);

  const verdict =
    score >= 95 ? "Отлично" : score >= 75 ? "Хорошо" : score >= 50 ? "Удовлетворительно" : "Требует доработки";

  /* ---------------- Действия ---------------- */

  async function saveNow() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setManualSaving(true);
    const ok = await persist();
    setManualSaving(false);
    if (ok) toast("Изменения сохранены");
  }

  async function regenerate() {
    setRegenOpen(false);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setRegenerating(true);
    try {
      const next = await articleApi.regenerateArticle(article.id);
      setTitle(next.title);
      setSeoTitle(next.seoTitle);
      setMeta(next.metaDescription);
      setSlug(next.slug);
      setUsedSources(next.usedSources);
      if (next.seo) setSeo(next.seo);
      setInitialHtml(next.content);
      setContentKey((k) => k + 1);
      setSaveState("saved");
      setSavedAt(Date.now());
      setNow(Date.now());
      toast("Статья сгенерирована заново", {
        description: "Новая версия учитывает текущую структуру и ключевые запросы.",
      });
    } catch (e) {
      toast("Не удалось сгенерировать статью", { tone: "warning", description: errorMessage(e) });
    } finally {
      setRegenerating(false);
    }
  }

  async function exportArticle(format: ExportFormat) {
    // Backend собирает файл из сохраненной версии: сначала сохраняем несохраненные правки
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (saveState !== "saved" && !(await persist())) return;
    if (inFlight.current) await inFlight.current;
    try {
      const { filename, blob } = await articleApi.exportArticle(article.id, format);
      downloadBlob(filename, blob);
      setExportOpen(false);
      toast("Материал экспортирован", { description: "Файл сохранен в папку загрузок." });
    } catch (e) {
      toast("Не удалось экспортировать статью", { tone: "warning", description: errorMessage(e) });
    }
  }

  const statusBadge = <Badge tone="warning">Готово к проверке</Badge>;

  const saveLabel =
    saveState === "saving"
      ? "Сохранение…"
      : saveState === "dirty"
        ? "Есть несохраненные изменения"
        : saveState === "error"
          ? "Не сохранено"
          : !savedAt || now - savedAt < 60_000
            ? "Сохранено только что"
            : `Сохранено в ${new Date(savedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <>
      <AppHeader
        step={3}
        articleId={article.id}
        breadcrumbs={[{ label: "Мои статьи", href: "/articles" }, { label: title || "Без названия" }, { label: "Редактор" }]}
        actions={
          <>
            <span className="hidden md:inline-flex">{statusBadge}</span>
            <Button variant="secondary" size="sm" onClick={saveNow} loading={manualSaving} disabled={regenerating}>
              {!manualSaving && <FloppyDisk className="size-3.5" />}
              <span className="hidden sm:inline">Сохранить</span>
            </Button>
            <Button size="sm" onClick={() => setExportOpen(true)} disabled={regenerating}>
              <DownloadSimple weight="bold" className="size-3.5" />
              <span className="hidden sm:inline">Экспорт</span>
            </Button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <PageIntro
          title="Редактор статьи"
          subtitle="Проверьте текст, внесите изменения и подготовьте материал к публикации."
          aside={<span className="md:hidden">{statusBadge}</span>}
        />

        <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] wide:grid-cols-[188px_minmax(0,1fr)_340px]">
          {/* Содержание: навигация по разделам длинной статьи */}
          <aside className="sticky top-[calc(var(--header-h)+24px)] hidden max-h-[calc(100dvh-var(--header-h)-48px)] overflow-y-auto pt-1 [scrollbar-width:none] wide:block">
            <ArticleToc html={docHtml} title={title} />
          </aside>

          <ArticleEditor
            title={title}
            onTitleChange={(v) => {
              setTitle(v);
              markDirty();
            }}
            initialHtml={initialHtml}
            contentKey={contentKey}
            onContentChange={onContentChange}
            onAiAction={runAiAction}
            busy={regenerating}
            footer={
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500 sm:px-10">
                <span>
                  <span className="font-mono">{formatNumber(words)}</span> {plural(words, ["слово", "слова", "слов"])}
                </span>
                <span aria-hidden>·</span>
                <span>
                  <span className="font-mono">{readingTime(words)}</span> мин чтения
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5" aria-live="polite">
                  {saveState === "saving" && <Spinner className="size-3 text-zinc-400" />}
                  {saveState === "dirty" && <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />}
                  {saveState === "error" && <span className="size-1.5 rounded-full bg-red-500" aria-hidden />}
                  {saveLabel}
                </span>
              </div>
            }
          />

          <aside
            aria-label="SEO-показатели"
            className="flex flex-col gap-3 xl:sticky xl:top-[calc(var(--header-h)+24px)] xl:max-h-[calc(100dvh-var(--header-h)-48px)]"
          >
            <SeoPanel
              score={score}
              max={seo.maxScore}
              scoreContent={
                <>
                  <SeoScore score={score} max={seo.maxScore} verdict={verdict} summary={seo.summary} />
                  <SeoChecklist checks={checks} />
                  <KeywordStats keywords={keywords} />
                </>
              }
              snippetContent={
                <SearchPreview
                  domain={SITE_DOMAIN}
                  path={`/blog/${slug}`}
                  seoTitle={seoTitle}
                  metaDescription={meta}
                  onSeoTitleChange={(v) => {
                    setSeoTitle(v);
                    markDirty();
                  }}
                  onMetaDescriptionChange={(v) => {
                    setMeta(v);
                    markDirty();
                  }}
                />
              }
              sourcesContent={<SourcesCard sources={usedSources} />}
            />
            <Button
              variant="secondary"
              className="w-full shrink-0"
              onClick={() => setRegenOpen(true)}
              loading={regenerating}
            >
              {!regenerating && <ArrowsClockwise className="size-4" />}
              {regenerating ? "Генерируем…" : "Сгенерировать заново"}
            </Button>
          </aside>
        </div>
      </main>

      <PublishModal open={exportOpen} onClose={() => setExportOpen(false)} onSubmit={exportArticle} />
      <RegenerateDialog open={regenOpen} onClose={() => setRegenOpen(false)} onConfirm={regenerate} />
    </>
  );
}
