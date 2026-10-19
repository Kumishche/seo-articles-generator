import type { Metadata } from "next";
import { ArticleList } from "@/components/article/ArticleList";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = { title: "Мои статьи" };

export default function ArticlesPage() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Мои статьи" }]} />
      <main className="flex flex-1 flex-col">
        <ArticleList />
      </main>
    </>
  );
}
