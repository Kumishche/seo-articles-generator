"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FloppyDisk, Sparkle } from "@phosphor-icons/react/ssr";
import { articleApi } from "@/lib/api";
import { analysisStages } from "@/lib/mock-data";
import type { OutlineSection, ResearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ANALYSIS_FLAG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AnalysisProgress } from "./AnalysisProgress";
import { AnalysisStatusCard } from "./AnalysisStatusCard";
import { CompetitorList } from "./CompetitorList";
import { KeywordList } from "./KeywordList";
import { OutlineEditor } from "./OutlineEditor";
import { OutlineSummary } from "./OutlineSummary";
import { RecommendationsCard } from "./RecommendationsCard";
import { SearchIntentCard } from "./SearchIntentCard";

const STAGE_MS = 900;

export function ResearchWorkspace({ research }: { research: ResearchResult }) {
  const router = useRouter();
  const toast = useToast();

  const [stage, setStage] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sections, setSections] = useState<OutlineSection[]>(research.outline.sections);
  const [dirty, setDirty] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loading = stage !== null;

  // Если пользователь пришел с первого экрана, показываем процесс анализа.
  // useLayoutEffect - чтобы результат не мелькнул до начала загрузки.
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(ANALYSIS_FLAG)) {
        sessionStorage.removeItem(ANALYSIS_FLAG);
        setStage(0);
      }
    } catch {
      // нет доступа к sessionStorage - сразу показываем результат
    }
  }, []);

  useEffect(() => {
    if (stage === null) return;
    const t = setTimeout(() => {
      if (stage >= analysisStages.length - 1) {
        setStage(null);
        setRevealed(true);
      } else {
        setStage(stage + 1);
      }
    }, STAGE_MS);
    return () => clearTimeout(t);
  }, [stage]);

  const stats = useMemo(() => {
    const h2 = sections.filter((s) => s.level === 2).length;
    const body = sections.filter((s) => s.level !== 1).length;
    const base = research.outline.sections.filter((s) => s.level !== 1).length;
    const ratio = body / base;
    const round = (n: number) => Math.max(300, Math.round((n * ratio) / 100) * 100);
    return {
      // Введение не выносится в структуру отдельной строкой, но считается разделом
      sections: h2 + 1,
      words: { min: round(research.outline.estimatedWords.min), max: round(research.outline.estimatedWords.max) },
      empty: sections.filter((s) => !s.title.trim()).length,
      h2,
    };
  }, [sections, research.outline]);

  function changeSections(next: OutlineSection[]) {
    setSections(next);
    setDirty(true);
  }

  async function saveDraft() {
    setSaving(true);
    await articleApi.saveOutline(research.articleId, sections);
    setSaving(false);
    setDirty(false);
    toast("Черновик сохранен", { description: "Структуру можно будет изменить позже." });
  }

  async function generate() {
    if (stats.empty > 0 || stats.h2 === 0) {
      setShowErrors(true);
      toast(stats.h2 === 0 ? "Добавьте хотя бы один раздел" : "Заполните пустые заголовки", {
        tone: "warning",
        description: stats.h2 === 0 ? undefined : "Удалите лишние строки или введите названия разделов.",
      });
      return;
    }
    setGenerating(true);
    const { id } = await articleApi.generateArticle(research.articleId, sections);
    router.push(`/articles/${id}/editor`);
  }

  if (loading) {
    return (
      <div className="mt-6">
        <AnalysisProgress stages={analysisStages} current={stage} />
      </div>
    );
  }

  const reveal = (i: number) =>
    revealed ? { className: "animate-fade-up", style: { animationDelay: `${i * 50}ms` } } : {};

  return (
    <>
      <div className="mt-6 space-y-6 pb-6">
        <div {...reveal(0)}>
          <AnalysisStatusCard
            serpResults={research.serpResultsAnalyzed}
            competitorPages={research.competitorPagesAnalyzed}
            onRestart={() => {
              setRevealed(false);
              setStage(0);
            }}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,38fr)_minmax(0,62fr)]">
          <div className="space-y-6">
            <div {...reveal(1)}>
              <SearchIntentCard intent={research.intent} />
            </div>
            <div {...reveal(2)}>
              <KeywordList keywords={research.keywords} />
            </div>
            <div {...reveal(3)}>
              <CompetitorList competitors={research.competitors} />
            </div>
            <div {...reveal(4)}>
              <RecommendationsCard items={research.recommendations} />
            </div>
          </div>

          <div className="space-y-4">
            <div {...reveal(2)}>
              <OutlineEditor sections={sections} onChange={changeSections} showErrors={showErrors} />
            </div>
            <div {...reveal(3)}>
              <OutlineSummary
                words={stats.words}
                sections={stats.sections}
                keywords={research.outline.targetKeywords}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action bar: выходит за пределы контейнера, чтобы занять всю ширину рабочей области */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-auto border-t border-slate-200/80 bg-white/90 backdrop-blur-md sm:-mx-6 lg:-mx-8">
        <div className="mx-auto flex max-w-[1320px] items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/articles/new"
            className="pressable inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            Назад
          </Link>
          <span
            className={cn(
              "hidden text-[13px] text-slate-400 transition-opacity duration-200 md:block",
              dirty ? "opacity-100" : "opacity-0",
            )}
            aria-live="polite"
          >
            {dirty ? "Есть несохраненные изменения" : ""}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={saveDraft}
              loading={saving}
              disabled={generating}
              aria-label="Сохранить черновик"
              className="max-sm:w-9 max-sm:px-0"
            >
              {!saving && <FloppyDisk className="size-4" />}
              <span className="hidden sm:inline">Сохранить черновик</span>
            </Button>
            <Button onClick={generate} loading={generating}>
              {!generating && <Sparkle weight="fill" className="size-4" />}
              {generating ? (
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
    </>
  );
}
