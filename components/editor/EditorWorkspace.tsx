"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowsClockwise, CheckCircle, FloppyDisk, PaperPlaneTilt } from "@phosphor-icons/react/ssr";
import { articleApi } from "@/lib/api";
import { downloadFile, htmlDocument, htmlToMarkdown } from "@/lib/export";
import type { Article, ConnectedSite, PublicationSettings, SeoCheck } from "@/lib/types";
import { countOccurrences, countWords, formatNumber, plural, readingTime } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageIntro } from "@/components/layout/PageIntro";
import { PublishModal } from "@/components/publication/PublishModal";
import { RegenerateDialog } from "@/components/publication/RegenerateDialog";
import { KeywordStats } from "@/components/seo/KeywordStats";
import { SearchPreview } from "@/components/seo/SearchPreview";
import { SeoChecklist } from "@/components/seo/SeoChecklist";
import { SeoScore } from "@/components/seo/SeoScore";
import { SourcesCard } from "@/components/seo/SourcesCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { ArticleEditor } from "./ArticleEditor";

type SaveState = "saved" | "dirty" | "saving";
type PublishState = "review" | "published" | "draft_on_site";

const AUTOSAVE_MS = 1500;
const CHECK_WEIGHT = 7;

interface EditorWorkspaceProps {
  article: Article;
  sites: ConnectedSite[];
}

export function EditorWorkspace({ article, sites }: EditorWorkspaceProps) {
  const toast = useToast();
  const domain = sites[0]?.domain ?? "example.ru";

  const [title, setTitle] = useState(article.title);
  const [seoTitle, setSeoTitle] = useState(article.seoTitle);
  const [meta, setMeta] = useState(article.metaDescription);
  const [text, setText] = useState(() => article.content.replace(/<[^>]+>/g, " "));
  const html = useRef(article.content);

  const [contentKey, setContentKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [publishState, setPublishState] = useState<PublishState>("review");
  const [publishOpen, setPublishOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [hasLinks, setHasLinks] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Обновляем подпись «Сохранено ...» раз в 30 секунд
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const persist = useCallback(async () => {
    setSaveState("saving");
    await articleApi.saveArticle(article.id, { title, seoTitle, metaDescription: meta, content: html.current });
    setSaveState("saved");
    setSavedAt(Date.now());
    setNow(Date.now());
  }, [article.id, title, seoTitle, meta]);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  const markDirty = useCallback(() => {
    setSaveState("dirty");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => persistRef.current(), AUTOSAVE_MS);
  }, []);

  useEffect(() => () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
  }, []);

  const onContentChange = useCallback(
    (nextHtml: string, nextText: string, initial?: boolean) => {
      html.current = nextHtml;
      setText(nextText);
      setHasLinks(/href="(\/|https?:\/\/(www\.)?example\.ru)/i.test(nextHtml));
      if (!initial) markDirty();
    },
    [markDirty],
  );

  /* ---------------- SEO-показатели, пересчитываются по мере редактирования ---------------- */

  const words = useMemo(() => countWords(text), [text]);

  const keywords = useMemo(
    () =>
      article.seo.keywords.map((k) => ({
        ...k,
        count: countOccurrences(`${title}\n${text}`, k.phrase),
      })),
    [article.seo.keywords, title, text],
  );

  const checks = useMemo<SeoCheck[]>(() => {
    const primary = article.seo.keywords[0]?.phrase ?? "";
    const metaOk = meta.length >= 140 && meta.length <= 160;
    return article.seo.checks.map((c) => {
      if (c.id === "kw-title" && !countOccurrences(title, primary))
        return { ...c, status: "warning", label: "Основного ключа нет в заголовке", hint: `Добавьте «${primary}» в H1.` };
      if (c.id === "meta" && metaOk) return { ...c, status: "passed", label: "Meta description оптимальной длины", hint: undefined };
      if (c.id === "links" && hasLinks) return { ...c, status: "passed", label: "Внутренние ссылки добавлены", hint: undefined };
      return c;
    });
  }, [article.seo, meta, title, hasLinks]);

  const score = useMemo(() => {
    const initialWarnings = article.seo.checks.filter((c) => c.status !== "passed").length;
    const warnings = checks.filter((c) => c.status !== "passed").length;
    return Math.min(article.seo.maxScore, Math.max(0, article.seo.score + (initialWarnings - warnings) * CHECK_WEIGHT));
  }, [checks, article.seo]);

  const verdict = score >= 95 ? "Отлично" : score >= 75 ? "Хорошо" : score >= 50 ? "Удовлетворительно" : "Требует доработки";

  /* ---------------- Действия ---------------- */

  async function saveNow() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setManualSaving(true);
    await persist();
    setManualSaving(false);
    toast("Изменения сохранены");
  }

  async function regenerate() {
    setRegenOpen(false);
    setRegenerating(true);
    await articleApi.regenerateArticle(article.id);
    setTitle(article.title);
    setContentKey((k) => k + 1);
    setRegenerating(false);
    setSaveState("saved");
    setSavedAt(Date.now());
    setNow(Date.now());
    toast("Статья сгенерирована заново", { description: "Новая версия учитывает текущую структуру и ключевые запросы." });
  }

  async function publish(settings: PublicationSettings) {
    await articleApi.publishArticle(article.id, settings);
    setPublishOpen(false);

    if (settings.mode === "export") {
      const name = article.slug;
      if (settings.exportFormat === "markdown") downloadFile(`${name}.md`, htmlToMarkdown(title, html.current), "text/markdown");
      else if (settings.exportFormat === "txt") downloadFile(`${name}.txt`, `${title}\n\n${text}`, "text/plain");
      else downloadFile(`${name}.html`, htmlDocument(seoTitle || title, html.current, meta), "text/html");
      toast("Материал экспортирован", { description: "Файл сохранен в папку загрузок." });
      return;
    }

    setPublishState(settings.publishStatus === "draft" ? "draft_on_site" : "published");
    toast("Статья успешно опубликована", {
      description:
        settings.publishStatus === "draft"
          ? `Черновик доступен в админке ${domain}.`
          : `${domain}${settings.path}`,
    });
  }

  const statusBadge =
    publishState === "published" ? (
      <Badge tone="success">
        <CheckCircle weight="fill" className="size-3.5" />
        Опубликовано
      </Badge>
    ) : publishState === "draft_on_site" ? (
      <Badge tone="neutral">Черновик на сайте</Badge>
    ) : (
      <Badge tone="warning">Готово к проверке</Badge>
    );

  const saveLabel =
    saveState === "saving"
      ? "Сохранение…"
      : saveState === "dirty"
        ? "Есть несохраненные изменения"
        : !savedAt || now - savedAt < 60_000
          ? "Сохранено только что"
          : `Сохранено в ${new Date(savedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: "Мои статьи" }, { label: title || "Без названия" }, { label: "Редактор" }]}
        actions={
          <>
            <span className="hidden md:inline-flex">{statusBadge}</span>
            <Button variant="secondary" onClick={saveNow} loading={manualSaving} disabled={regenerating}>
              {!manualSaving && <FloppyDisk className="size-4" />}
              <span className="hidden sm:inline">Сохранить</span>
            </Button>
            <Button onClick={() => setPublishOpen(true)} disabled={regenerating}>
              <PaperPlaneTilt weight="fill" className="size-4" />
              <span className="hidden sm:inline">Опубликовать</span>
            </Button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageIntro
          step={3}
          title="Редактор статьи"
          subtitle="Проверьте текст, внесите изменения и подготовьте материал к публикации."
          aside={<span className="md:hidden">{statusBadge}</span>}
        />

        <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ArticleEditor
            title={title}
            onTitleChange={(v) => {
              setTitle(v);
              markDirty();
            }}
            initialHtml={article.content}
            contentKey={contentKey}
            onContentChange={onContentChange}
            busy={regenerating}
            footer={
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500 sm:px-10">
                <span className="tabular-nums">
                  {formatNumber(words)} {plural(words, ["слово", "слова", "слов"])}
                </span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{readingTime(words)} мин чтения</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5" aria-live="polite">
                  {saveState === "saving" && <Spinner className="size-3 text-slate-400" />}
                  {saveState === "dirty" && <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />}
                  {saveLabel}
                </span>
              </div>
            }
          />

          <aside
            aria-label="SEO-показатели"
            className="space-y-4 xl:sticky xl:top-20 xl:-mx-1 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto xl:px-1 xl:pb-4 xl:[scrollbar-width:thin]"
          >
            <SeoScore score={score} max={article.seo.maxScore} verdict={verdict} summary={article.seo.summary} />
            <SeoChecklist checks={checks} />
            <KeywordStats keywords={keywords} />
            <SearchPreview
              domain={domain}
              path={`/blog/${article.slug}`}
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
            <SourcesCard sources={article.usedSources} />
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold text-slate-900">Новая версия</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                Система заново напишет текст по текущей структуре и ключевым запросам.
              </p>
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => setRegenOpen(true)}
                loading={regenerating}
              >
                {!regenerating && <ArrowsClockwise className="size-4" />}
                Сгенерировать заново
              </Button>
            </Card>
          </aside>
        </div>
      </main>

      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        sites={sites}
        defaultPath={`/blog/${article.slug}`}
        onSubmit={publish}
      />
      <RegenerateDialog open={regenOpen} onClose={() => setRegenOpen(false)} onConfirm={regenerate} />
    </>
  );
}
