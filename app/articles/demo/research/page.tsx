import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageIntro } from "@/components/layout/PageIntro";
import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";
import { articleApi } from "@/lib/api";
import { DEMO_ARTICLE_ID } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Анализ и структура" };

export default async function ResearchPage() {
  const research = await articleApi.getResearch(DEMO_ARTICLE_ID);
  const topic = research.outline.sections[0]?.title ?? "Новая статья";

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Мои статьи" }, { label: topic }, { label: "Анализ и структура" }]} />
      <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <PageIntro
          step={2}
          title="Анализ и структура"
          subtitle="Проверьте результаты исследования и при необходимости измените структуру будущей статьи."
        />
        <ResearchWorkspace research={research} />
      </main>
    </>
  );
}
