"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface Heading {
  level: 2 | 3;
  text: string;
}

/** Селектор области текста статьи в редакторе */
export const ARTICLE_CONTENT_ATTR = "data-article-content";

function parseHeadings(html: string): Heading[] {
  const result: Heading[] = [];
  const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = m[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (text) result.push({ level: m[1] === "2" ? 2 : 3, text });
  }
  return result;
}

function headingNodes() {
  const root = document.querySelector(`[${ARTICLE_CONTENT_ATTR}]`);
  return root ? Array.from(root.querySelectorAll<HTMLElement>("h2, h3")).filter((h) => h.innerText.trim()) : [];
}

/** Содержание статьи: строится из текущего текста и подсвечивает раздел, который сейчас на экране */
export function ArticleToc({ html, title }: { html: string; title: string }) {
  const headings = useMemo(() => parseHeadings(html), [html]);
  const signature = headings.map((h) => h.text).join("\n");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = headingNodes();
    if (!nodes.length) return;
    // Активный раздел - последний заголовок, который пересек верхнюю треть экрана
    const observer = new IntersectionObserver(
      () => {
        const line = window.innerHeight * 0.3;
        let current = 0;
        nodes.forEach((n, i) => {
          if (n.getBoundingClientRect().top < line) current = i;
        });
        setActive(current);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [signature]);

  function goTo(index: number) {
    const node = headingNodes()[index];
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(index);
  }

  return (
    <nav aria-label="Содержание статьи">
      <p className="text-[13px] font-semibold text-zinc-950">Содержание</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{title || "Без названия"}</p>
      {headings.length === 0 ? (
        <p className="mt-4 text-xs text-zinc-400">Добавьте заголовки H2 и H3, чтобы они появились здесь.</p>
      ) : (
        <ol className="mt-4 border-l border-zinc-200">
          {headings.map((h, i) => (
            <li key={`${i}-${h.text}`}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={active === i ? "location" : undefined}
                className={cn(
                  "-ml-px block w-full border-l py-1 pr-1 text-left text-[13px] leading-snug transition-colors duration-150",
                  h.level === 3 ? "pl-6 text-xs" : "pl-3",
                  active === i
                    ? "border-zinc-900 font-medium text-zinc-950"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800",
                )}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
