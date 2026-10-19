"use client";

import { useId, useState } from "react";
import { LinkSimple, Plus, Trash } from "@phosphor-icons/react/ssr";
import type { ArticleSource } from "@/lib/types";
import { normalizeUrl, shortenUrl, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { SiteIcon } from "@/components/ui/site-icon";

interface SourceListProps {
  links: ArticleSource[];
  onChange: (links: ArticleSource[]) => void;
}

export function SourceList({ links, onChange }: SourceListProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  function add() {
    const url = normalizeUrl(value);
    if (!url) {
      setError("Введите корректную ссылку, например https://example.com/article");
      return;
    }
    if (links.some((l) => l.url === url.href)) {
      setError("Эта ссылка уже добавлена");
      return;
    }
    onChange([
      ...links,
      {
        id: uid("link"),
        type: "link",
        title: url.href,
        url: url.href,
        domain: url.hostname.replace(/^www\./, ""),
        addedAt: new Date().toISOString(),
      },
    ]);
    setValue("");
    setError(null);
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-800">
        Ссылки
      </label>
      <div className="mt-2">
        <div className="relative">
          <LinkSimple
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          />
          <Input
            id={inputId}
            type="url"
            inputMode="url"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="https://example.com/article"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="pl-9 pr-[104px]"
          />
          {/* Кнопка внутри поля: в узкой колонке источников поле остается широким */}
          <Button
            variant="subtle"
            size="sm"
            onClick={add}
            disabled={!value.trim()}
            className="absolute right-1 top-1 h-8"
          >
            <Plus weight="bold" className="size-3.5" />
            Добавить
          </Button>
        </div>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      )}

      {links.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200">
          {links.map((link) => (
            <li key={link.id} className="flex animate-fade-up items-center gap-3 bg-white px-3 py-2.5">
              <SiteIcon domain={link.domain ?? ""} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-zinc-900">{link.domain}</p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-mono text-[11px] text-zinc-500 hover:text-accent-ink"
                  title={link.url}
                >
                  {shortenUrl(link.url ?? "", 64)}
                </a>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Удалить ссылку ${link.domain}`}
                onClick={() => onChange(links.filter((l) => l.id !== link.id))}
                className="text-zinc-400 hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
