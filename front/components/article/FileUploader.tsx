"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle, FileDoc, FilePdf, FileTxt, Trash, UploadSimple } from "@phosphor-icons/react/ssr";
import { articleApi, errorMessage } from "@/lib/api";
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
  const common = "size-[18px]";
  if (e === "pdf")
    return (
      <span className="flex size-8 items-center justify-center rounded-md bg-red-500/10 text-red-600">
        <FilePdf weight="duotone" className={common} />
      </span>
    );
  if (e === "docx")
    return (
      <span className="flex size-8 items-center justify-center rounded-md bg-sky-500/10 text-sky-700">
        <FileDoc weight="duotone" className={common} />
      </span>
    );
  return (
    <span className="flex size-8 items-center justify-center rounded-md bg-zinc-900/5 text-zinc-600">
      <FileTxt weight="duotone" className={common} />
    </span>
  );
}

export function FileUploader({ files, onChange }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const labelId = useId();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const rejected: string[] = [];
    const accepted: (UploadedFile & { file: File })[] = [];

    Array.from(list).forEach((file) => {
      if (!ACCEPTED.includes(ext(file.name)) || file.size > MAX_SIZE) {
        rejected.push(file.name);
        return;
      }
      accepted.push({
        id: uid("upload"),
        type: "file",
        title: file.name,
        size: file.size,
        mimeType: file.type,
        addedAt: new Date().toISOString(),
        progress: 0,
        file,
      });
    });

    setError(
      rejected.length ? `Не удалось добавить: ${rejected.join(", ")}. Поддерживаются PDF, DOCX и TXT до 20 МБ.` : null,
    );
    if (!accepted.length) return;
    onChange((prev) => [...prev, ...accepted.map(({ file: _f, ...item }) => item)]);

    // Файл загружается сразу: сервер извлекает текст и возвращает id источника
    accepted.forEach(({ file, ...item }) => {
      articleApi
        .uploadFile(file, (progress) => {
          if (mounted.current) onChange((prev) => prev.map((p) => (p.id === item.id ? { ...p, progress } : p)));
        })
        .then((source) => {
          if (!mounted.current) return;
          onChange((prev) => prev.map((p) => (p.id === item.id ? { ...source, progress: 100 } : p)));
        })
        .catch((e) => {
          if (!mounted.current) return;
          onChange((prev) => prev.filter((p) => p.id !== item.id));
          setError(`${file.name}: ${errorMessage(e)}`);
        });
    });
  }

  function remove(file: UploadedFile) {
    onChange((prev) => prev.filter((f) => f.id !== file.id));
    // Файл уже на сервере: удаляем, чтобы не хранить лишнее. Ошибка здесь не мешает пользователю
    if (file.progress >= 100) articleApi.deleteFile(file.id).catch(() => undefined);
  }

  return (
    <div>
      <p id={labelId} className="text-[13px] font-medium text-zinc-800">
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
          "mt-2 flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-7 text-center transition-colors duration-150",
          dragging
            ? "border-accent bg-accent-soft"
            : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-50",
        )}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-md bg-white text-zinc-500 shadow-card ring-1 ring-zinc-200 transition-transform duration-200 ease-(--ease-out-strong)",
            dragging && "-translate-y-0.5 text-accent ring-accent-line",
          )}
        >
          <UploadSimple className="size-[18px]" />
        </span>
        <p className="mt-3 text-[13px] font-medium text-zinc-800">Перетащите файлы сюда или нажмите для загрузки</p>
        <p id={`${labelId}-hint`} className="mt-1 text-[13px] text-zinc-500">
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
        <ul className="mt-3 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200">
          {files.map((file) => {
            const done = file.progress >= 100;
            return (
              <li key={file.id} className="flex animate-fade-up items-center gap-3 bg-white px-3 py-2.5">
                <FileIcon name={file.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-zinc-900" title={file.title}>
                    {file.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono text-[11px]">{formatBytes(file.size ?? 0)}</span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle weight="fill" className="size-3.5" />
                        Загружен
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="h-1 w-20 overflow-hidden rounded-full bg-zinc-100">
                          <span
                            className="block h-full origin-left rounded-full bg-accent transition-transform duration-150 ease-linear"
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
                  onClick={() => remove(file)}
                  className="text-zinc-400 hover:bg-red-500/10 hover:text-red-600"
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
