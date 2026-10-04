import type { Metadata } from "next";
import { ArticleForm } from "@/components/article/ArticleForm";
import { HowItWorksCard } from "@/components/article/HowItWorksCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageIntro } from "@/components/layout/PageIntro";

export const metadata: Metadata = { title: "Новая статья" };

export default function NewArticlePage() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Мои статьи" }, { label: "Новая статья" }]} />
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageIntro
          step={1}
          title="Новая статья"
          subtitle="Укажите тему статьи и при необходимости добавьте план и источники. Система проанализирует поисковую выдачу и подготовит структуру материала."
        />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,940px)_300px] lg:justify-center xl:grid-cols-[minmax(0,940px)_320px]">
          <ArticleForm />
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <HowItWorksCard />
          </aside>
        </div>
      </main>
    </>
  );
}
