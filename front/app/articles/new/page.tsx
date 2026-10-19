import type { Metadata } from "next";
import { ArticleForm } from "@/components/article/ArticleForm";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = { title: "Новая статья" };

export default function NewArticlePage() {
  return (
    <>
      <AppHeader step={1} breadcrumbs={[{ label: "Мои статьи", href: "/articles" }, { label: "Новая статья" }]} />
      <main className="flex flex-1 flex-col">
        <ArticleForm />
      </main>
    </>
  );
}
