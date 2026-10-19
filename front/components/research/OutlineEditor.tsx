"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "./dnd-modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, Plus, Trash } from "@phosphor-icons/react/ssr";
import type { HeadingLevel, OutlineSection } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OutlineEditorProps {
  sections: OutlineSection[];
  onChange: (sections: OutlineSection[]) => void;
  showErrors?: boolean;
}

export function OutlineEditor({ sections, onChange, showErrors }: OutlineEditorProps) {
  const dndId = useId();
  const [focusId, setFocusId] = useState<string | null>(null);
  const lastFocused = useRef<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Фокус в только что добавленный заголовок
  useEffect(() => {
    if (!focusId) return;
    const input = listRef.current?.querySelector<HTMLTextAreaElement>(`[data-section="${focusId}"]`);
    input?.focus();
    setFocusId(null);
  }, [focusId]);

  const [h1, ...rest] = sections;

  function update(id: string, patch: Partial<OutlineSection>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function remove(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = rest.findIndex((s) => s.id === active.id);
    const to = rest.findIndex((s) => s.id === over.id);
    const moved = arrayMove(rest, from, to);
    // Подраздел не может стоять первым: он должен принадлежать разделу
    if (moved[0]?.level === 3) moved[0] = { ...moved[0], level: 2 };
    onChange([h1, ...moved]);
  }

  function addSection() {
    const section: OutlineSection = { id: uid("s"), level: 2, title: "" };
    onChange([...sections, section]);
    setFocusId(section.id);
  }

  function addSubsection() {
    const section: OutlineSection = { id: uid("s"), level: 3, title: "" };
    const anchorIndex = sections.findIndex((s) => s.id === lastFocused.current);
    let insertAt = sections.length;

    if (anchorIndex > 0) {
      // Вставляем в конец группы раздела, в котором сейчас работает пользователь
      let i = anchorIndex + 1;
      while (i < sections.length && sections[i].level === 3) i++;
      insertAt = i;
    }
    const next = [...sections];
    next.splice(insertAt, 0, section);
    onChange(next);
    setFocusId(section.id);
  }

  const canAddSubsection = rest.some((s) => s.level === 2);

  return (
    <Card>
      <div className="px-5 pt-5 sm:px-7 sm:pt-6">
        <div className="max-w-[60ch]">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950">Структура статьи</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
            Система сформировала структуру на основе поисковой выдачи. Вы можете изменить заголовки перед генерацией.
          </p>
        </div>
      </div>

      <div className="px-2 pb-3 pt-5 sm:px-4">
        <ol ref={listRef} aria-label="Заголовки статьи">
          {h1 && (
            <OutlineRow
              section={h1}
              locked
              invalid={showErrors && !h1.title.trim()}
              onTitle={(title) => update(h1.id, { title })}
              onFocus={() => (lastFocused.current = h1.id)}
            />
          )}
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={rest.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {rest.map((section, i) => (
                <SortableRow
                  key={section.id}
                  section={section}
                  invalid={showErrors && !section.title.trim()}
                  canIndent={i > 0}
                  lastInGroup={rest[i + 1]?.level !== 3}
                  onTitle={(title) => update(section.id, { title })}
                  onLevel={(level) => update(section.id, { level })}
                  onRemove={() => remove(section.id)}
                  onFocus={() => (lastFocused.current = section.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </ol>

        {rest.length === 0 && (
          <p className="mx-3 mt-3 rounded-md border border-dashed border-zinc-200 px-4 py-6 text-center text-[13px] text-zinc-500">
            В статье пока нет разделов. Добавьте хотя бы один раздел H2.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 px-4 py-3 sm:px-6">
        <Button variant="subtle" size="sm" onClick={addSection}>
          <Plus weight="bold" className="size-3.5" />
          Добавить раздел
        </Button>
        <Button variant="ghost" size="sm" onClick={addSubsection} disabled={!canAddSubsection}>
          <Plus weight="bold" className="size-3.5" />
          Добавить подраздел
        </Button>
        <p className="ml-auto hidden items-center gap-1 text-xs text-zinc-400 md:flex">
          Перетащите строку за
          <DotsSixVertical weight="bold" className="size-3.5" />
          чтобы изменить порядок
        </p>
      </div>
    </Card>
  );
}

interface RowProps {
  section: OutlineSection;
  invalid?: boolean;
  locked?: boolean;
  canIndent?: boolean;
  /** Последний подраздел в группе: направляющая линия заканчивается на нем */
  lastInGroup?: boolean;
  onTitle: (title: string) => void;
  onLevel?: (level: HeadingLevel) => void;
  onRemove?: () => void;
  onFocus: () => void;
  dragHandle?: React.ReactNode;
  style?: React.CSSProperties;
  dragging?: boolean;
  rowRef?: (node: HTMLElement | null) => void;
}

function SortableRow(props: Omit<RowProps, "dragHandle" | "style" | "dragging" | "rowRef">) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.section.id,
  });

  return (
    <OutlineRow
      {...props}
      rowRef={setNodeRef}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      dragHandle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Переместить «${props.section.title || "без названия"}»`}
          className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-zinc-300 transition-colors duration-150 hover:bg-zinc-900/5 hover:text-zinc-600 focus-visible:text-zinc-600 active:cursor-grabbing [@media(hover:hover)]:text-transparent [@media(hover:hover)]:group-hover:text-zinc-400"
        >
          <DotsSixVertical weight="bold" className="size-4" />
        </button>
      }
    />
  );
}

/** Заголовки выглядят так же, как в будущей статье: размер шрифта передает уровень */
const titleStyles: Record<HeadingLevel, string> = {
  1: "py-2 text-[19px] leading-tight font-semibold tracking-[-0.025em] text-zinc-950 sm:text-[22px]",
  2: "py-2 text-[14.5px] leading-snug font-semibold tracking-[-0.01em] text-zinc-900 sm:text-[15px]",
  3: "py-1.5 text-[14px] leading-snug text-zinc-600",
};

function OutlineRow({
  section,
  invalid,
  locked,
  canIndent,
  lastInGroup,
  onTitle,
  onLevel,
  onRemove,
  onFocus,
  dragHandle,
  style,
  dragging,
  rowRef,
}: RowProps) {
  const isSub = section.level === 3;
  const toggleable = !locked && onLevel && (isSub || canIndent);

  return (
    <li
      ref={rowRef}
      style={style}
      className={cn(
        "group relative",
        locked && "mb-2 border-b border-zinc-100 pb-2",
        section.level === 2 && "mt-1.5",
        dragging && "z-10",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-1 transition-[background-color,box-shadow] duration-150",
          "hover:bg-zinc-50 focus-within:bg-zinc-50",
          invalid && "bg-red-50/60 hover:bg-red-50/60 focus-within:bg-red-50/60",
          dragging && "bg-white shadow-raised ring-1 ring-zinc-200",
        )}
      >
        {dragHandle ?? <span aria-hidden className="size-6 shrink-0" />}

        <button
          type="button"
          disabled={!toggleable}
          onClick={() => onLevel?.(isSub ? 2 : 3)}
          title={toggleable ? (isSub ? "Сделать разделом H2" : "Сделать подразделом H3") : undefined}
          aria-label={toggleable ? `Уровень ${section.level}. Изменить уровень заголовка` : `Уровень ${section.level}`}
          className={cn(
            "pressable flex h-5 w-8 shrink-0 items-center justify-center rounded font-mono text-[10.5px] font-medium",
            section.level === 1 ? "bg-zinc-900 text-white" : "text-zinc-400",
            toggleable && "hover:bg-zinc-900/[0.06] hover:text-zinc-800",
            !toggleable && "cursor-default",
          )}
        >
          H{section.level}
        </button>

        {/* Подразделы смещены вправо; направляющая идет непрерывно через всю группу H3 */}
        <div className={cn("relative flex min-w-0 flex-1 items-center self-stretch", isSub && "pl-5")}>
          {isSub && (
            <>
              <span
                aria-hidden
                className={cn("absolute left-1.5 top-0 w-px bg-zinc-200", lastInGroup ? "bottom-1/2" : "-bottom-px")}
              />
              <span aria-hidden className="absolute left-1.5 top-1/2 h-px w-2.5 bg-zinc-200" />
            </>
          )}
          {/* textarea вместо input: длинный заголовок переносится, а не обрезается */}
          <textarea
            data-section={section.id}
            rows={1}
            value={section.title}
            onChange={(e) => onTitle(e.target.value.replace(/\n/g, " "))}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            onFocus={onFocus}
            placeholder={isSub ? "Название подраздела" : section.level === 1 ? "Заголовок статьи" : "Название раздела"}
            aria-label={`Заголовок H${section.level}`}
            aria-invalid={invalid || undefined}
            className={cn(
              "block min-w-0 flex-1 resize-none bg-transparent px-1.5 [field-sizing:content] placeholder:font-normal placeholder:text-zinc-400 focus:outline-none",
              titleStyles[section.level],
            )}
          />
        </div>

        {!locked && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Удалить «${section.title || "без названия"}»`}
            title="Удалить"
            className="pressable flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-300 hover:bg-red-500/10 hover:text-red-600 group-hover:text-zinc-400"
          >
            <Trash className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}
