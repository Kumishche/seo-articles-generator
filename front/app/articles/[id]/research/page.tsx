import type { Metadata } from "next";
import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";

export const metadata: Metadata = { title: "Анализ и структура" };

export default async function ResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResearchWorkspace articleId={id} />;
}
