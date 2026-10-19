import type { Metadata } from "next";
import { EditorLoader } from "@/components/editor/EditorLoader";

export const metadata: Metadata = { title: "Редактор статьи" };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorLoader articleId={id} />;
}
