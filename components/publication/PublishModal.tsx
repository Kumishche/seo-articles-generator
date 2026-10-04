"use client";

import { useEffect, useState } from "react";
import { DownloadSimple, Globe } from "@phosphor-icons/react/ssr";
import type { ConnectedSite, PublicationSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  sites: ConnectedSite[];
  defaultPath: string;
  onSubmit: (settings: PublicationSettings) => Promise<void>;
}

const modes = [
  {
    value: "site" as const,
    label: "Опубликовать на подключенном сайте",
    description: "Статья появится в CMS вместе с SEO-заголовком и meta description.",
    icon: Globe,
  },
  {
    value: "export" as const,
    label: "Экспортировать материал",
    description: "Скачайте файл и разместите его вручную.",
    icon: DownloadSimple,
  },
];

export function PublishModal({ open, onClose, sites, defaultPath, onSubmit }: PublishModalProps) {
  const [mode, setMode] = useState<PublicationSettings["mode"]>("site");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [path, setPath] = useState(defaultPath);
  const [publishStatus, setPublishStatus] = useState<"draft" | "publish">("publish");
  const [exportFormat, setExportFormat] = useState<"html" | "markdown" | "txt">("html");
  const [pathError, setPathError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setPathError(null);
    }
  }, [open]);

  async function submit() {
    if (mode === "site" && !/^\/[a-z0-9\-/]+$/i.test(path.trim())) {
      setPathError("URL должен начинаться с / и содержать только латиницу, цифры и дефисы");
      return;
    }
    setSubmitting(true);
    await onSubmit(
      mode === "site"
        ? { mode, siteId, path: path.trim(), publishStatus }
        : { mode, exportFormat },
    );
    setSubmitting(false);
  }

  const site = sites.find((s) => s.id === siteId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={submitting}
      size="md"
      title="Публикация статьи"
      description="Выберите, где разместить готовый материал."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button onClick={submit} loading={submitting}>
            {mode === "site" ? "Опубликовать" : "Экспортировать"}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Способ публикации</legend>
        <div className="space-y-2">
          {modes.map(({ value, label, description, icon: Icon }) => {
            const checked = mode === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors duration-150",
                  checked ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-400" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <input
                  type="radio"
                  name="publish-mode"
                  value={value}
                  checked={checked}
                  onChange={() => setMode(value)}
                  className="mt-0.5 size-4 shrink-0 accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-900">{label}</span>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
                </div>
                <Icon className={cn("size-5 shrink-0", checked ? "text-indigo-600" : "text-slate-400")} />
              </label>
            );
          })}
        </div>
      </fieldset>

      {mode === "site" ? (
        <div key="site" className="mt-5 animate-fade-up space-y-4">
          <Field label="Сайт" htmlFor="publish-site">
            <Select id="publish-site" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="URL статьи" htmlFor="publish-path" error={pathError}>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300/80 bg-slate-50 px-3 text-sm text-slate-500">
                {site?.domain}
              </span>
              <Input
                id="publish-path"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  setPathError(null);
                }}
                aria-invalid={pathError ? true : undefined}
                aria-describedby={pathError ? "publish-path-error" : undefined}
                className="rounded-l-none"
              />
            </div>
          </Field>
          <Field label="Статус публикации" htmlFor="publish-status">
            <Select
              id="publish-status"
              value={publishStatus}
              onChange={(e) => setPublishStatus(e.target.value as "draft" | "publish")}
            >
              <option value="draft">Черновик</option>
              <option value="publish">Опубликовать сразу</option>
            </Select>
          </Field>
        </div>
      ) : (
        <div key="export" className="mt-5 animate-fade-up">
          <Field label="Формат файла" htmlFor="export-format">
            <Select
              id="export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
            >
              <option value="html">HTML-документ</option>
              <option value="markdown">Markdown</option>
              <option value="txt">Обычный текст</option>
            </Select>
          </Field>
        </div>
      )}
    </Dialog>
  );
}
