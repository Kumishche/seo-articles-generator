import type { Metadata } from "next";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { articleApi } from "@/lib/api";
import { DEMO_ARTICLE_ID } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Редактор статьи" };

export default async function EditorPage() {
  const [article, sites] = await Promise.all([
    articleApi.getArticle(DEMO_ARTICLE_ID),
    articleApi.getConnectedSites(),
  ]);

  return <EditorWorkspace article={article} sites={sites} />;
}
