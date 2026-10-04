"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle, FileDoc, FilePdf, FileTxt, Trash, UploadSimple } from "@phosphor-icons/react/ssr";
import type { ArticleSource } from "@/lib/types";
import { cn, formatBytes, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedFile extends ArticleSource {
  progress: number;
}

interface FileUploaderProps {
  files: UploadedFile[];
  onChange: (updater: (files: UploadedFile[]) => UploadedFile[]) => void;
}

const ACCEPTED = ["pdf", "docx", "txt"];
const MAX_SIZE = 20 * 1024 * 1024;

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function FileIcon({ name }: { name: string }) {
  const e = ext(name);
  const common = "size-5";
  if (e === "pdf")
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <FilePdf weight="duotone" className={common} />
      </span>
    );
  if (e === "docx")
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <FileDoc weight="duotone" className={common} />
      </span>
    );
  return (
    <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
      <FileTxt weight="duotone" className={common} />
    </span>
  );
}

export function FileUploader({ files, onChange }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);
  const labelId = useId();

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const rejected: string[] = [];
    const accepted: UploadedFile[] = [];

    Array.from(list).forEach((file) => {
      if (!ACCEPTED.includes(ext(file.name)) || file.size > MAX_SIZE) {
        rejected.push(file.name);
        return;
      }
      accepted.push({
        id: uid("file"),
        type: "file",
        title: file.name,
        size: file.size,
        mimeType: file.type,
        addedAt: new Date().toISOString(),
        progress: 0,
      });
    });

    setError(
      rejected.length
        ? `Не удалось добавить: ${rejected.join(", ")}. Поддерживаются PDF, DOCX и TXT до 20 МБ.`
        : null,
    );
    if (!accepted.length) return;
    onChange((prev) => [...prev, ...accepted]);

    // Имитация загрузки на сервер
    accepted.forEach((f) => {
      const timer = setInterval(() => {
        onChange((prev) =>
          prev.map((p) => (p.id === f.id ? { ...p, progress: Math.min(100, p.progress + 20 + Math.random() * 25) } : p)),
        );
      }, 160);
      timers.current.push(timer);
      setTimeout(() => {
        clearInterval(timer);
        onChange((prev) => prev.map((p) => (p.id === f.id ? { ...p, progress: 100 } : p)));
      }, 1400);
    });
  }

  return (
    <div>
      <p id={labelId} className="text-sm font-medium text-slate-800">
        Файлы
      </p>
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-hint`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors duration-150",
          dragging
            ? "border-indigo-400 bg-indigo-50/70"
            : "border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50",
        )}
      >
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-card ring-1 ring-slate-200 transition-transform duration-200 ease-(--ease-out-strong)",
            dragging && "-translate-y-0.5 text-indigo-600 ring-indigo-200",
          )}
        >
          <UploadSimple className="size-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-800">Перетащите файлы сюда или нажмите для загрузки</p>
        <p id={`${labelId}-hint`} className="mt-1 text-[13px] text-slate-500">
          PDF, DOCX или TXT
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file) => {
            const done = file.progress >= 100;
            return (
              <li
                key={file.id}
                className="flex animate-fade-up items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
              >
                <FileIcon name={file.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900" title={file.title}>
                    {file.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span className="tabular-nums">{formatBytes(file.size ?? 0)}</span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle weight="fill" className="size-3.5" />
                        Загружен
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="h-1 w-20 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className="block h-full origin-left rounded-full bg-indigo-500 transition-transform duration-150 ease-linear"
                            style={{ transform: `scaleX(${file.progress / 100})` }}
                          />
                        </span>
                        Загрузка…
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Удалить файл ${file.title}`}
                  onClick={() => onChange((prev) => prev.filter((f) => f.id !== file.id))}
                  className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
