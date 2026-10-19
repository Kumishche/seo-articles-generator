"use client";

import { useEffect, useState } from "react";
import type { ExportFormat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (format: ExportFormat) => Promise<void>;
}

const formats: { value: ExportFormat; label: string; hint: string }[] = [
  { value: "html", label: "HTML-документ", hint: "С тегами title и meta description - для вставки в CMS или на сайт." },
  { value: "markdown", label: "Markdown", hint: "Для статических сайтов и редакторов с поддержкой разметки." },
  { value: "txt", label: "Обычный текст", hint: "Без разметки - для согласования и правок." },
];

/** Публикация на подключенный сайт появится вместе с интеграциями CMS; сейчас материал скачивается файлом */
export function PublishModal({ open, onClose, onSubmit }: PublishModalProps) {
  const [format, setFormat] = useState<ExportFormat>("html");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSubmitting(false);
  }, [open]);

  async function submit() {
    setSubmitting(true);
    await onSubmit(format);
    setSubmitting(false);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={submitting}
      size="md"
      title="Экспорт статьи"
      description="Скачайте готовый материал и разместите его на сайте вручную."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button onClick={submit} loading={submitting}>
            Скачать
          </Button>
        </>
      }
    >
      <Field
        label="Формат файла"
        htmlFor="export-format"
        hint={formats.find((f) => f.value === format)?.hint}
      >
        <Select id="export-format" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
          {formats.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </Field>
    </Dialog>
  );
}
