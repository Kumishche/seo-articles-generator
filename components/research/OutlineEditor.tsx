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
import { DotsSixVertical, Plus, TreeStructure, Trash } from "@phosphor-icons/react/ssr";
import type { HeadingLevel, OutlineSection } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

interface OutlineEditorProps {
  sections: OutlineSection[];
  onChange: (sections: OutlineSection[]) => void;
  showErrors?: boolean;
}

const levelStyles: Record<HeadingLevel, string> = {
  1: "bg-accent text-white",
  2: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70",
  3: "bg-slate-100 text-slate-600",
};

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
    const input = listRef.current?.querySelector<HTMLInputElement>(`[data-section="${focusId}"]`);
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
      <CardHeader
        icon={<TreeStructure className="size-[18px]" />}
        title="Структура статьи"
        description="Система сформировала структуру на основе поисковой выдачи. Вы можете изменить заголовки перед генерацией."
      />
      <div className="px-3 pb-5 pt-4 sm:px-4 sm:pb-6">
        <ol ref={listRef} className="space-y-1.5" aria-label="Заголовки статьи">
          {h1 && (
            <OutlineRow
              section={h1}
              locked
              invalid={showErrors && !h1.title.trim()}
              onTitle={(title) => update(h1.id, { title })}
              onFocus={() => (lastFocused.current = h1.id)}
            />
          )}
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            <SortableContext items={rest.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {rest.map((section, i) => (
                <SortableRow
                  key={section.id}
                  section={section}
                  invalid={showErrors && !section.title.trim()}
                  canIndent={i > 0}
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
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            В статье пока нет разделов. Добавьте хотя бы один раздел H2.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 px-1">
          <Button variant="subtle" size="sm" onClick={addSection}>
            <Plus weight="bold" className="size-3.5" />
            Добавить раздел
          </Button>
          <Button variant="ghost" size="sm" onClick={addSubsection} disabled={!canAddSubsection}>
            <Plus weight="bold" className="size-3.5" />
            Добавить подраздел
          </Button>
          <p className="ml-auto hidden items-center text-xs text-slate-400 md:flex">
            Перетащите строку за <DotsSixVertical weight="bold" className="mx-1 size-3.5" /> чтобы изменить порядок
          </p>
        </div>
      </div>
    </Card>
  );
}

interface RowProps {
  section: OutlineSection;
  invalid?: boolean;
  locked?: boolean;
  canIndent?: boolean;
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
          className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        >
          <DotsSixVertical weight="bold" className="size-4" />
        </button>
      }
    />
  );
}

function OutlineRow({
  section,
  invalid,
  locked,
  canIndent,
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
      className={cn("relative", isSub && "pl-6 sm:pl-9", dragging && "z-10")}
    >
      {isSub && <span aria-hidden className="absolute bottom-1/2 left-3 top-0 w-3 rounded-bl-md border-b border-l border-slate-200 sm:left-[18px]" />}
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-lg border bg-white py-1 pl-1 pr-1.5 transition-[border-color,box-shadow] duration-150",
          locked ? "border-indigo-100 bg-indigo-50/30" : "border-slate-200 hover:border-slate-300",
          "focus-within:border-indigo-400 focus-within:ring-[3px] focus-within:ring-indigo-500/10",
          invalid && "border-red-300",
          dragging && "border-indigo-300 shadow-raised",
        )}
      >
        {dragHandle ?? (
          <span
            aria-hidden
            title="Заголовок H1 всегда стоит первым"
            className="flex size-7 shrink-0 cursor-not-allowed items-center justify-center rounded-md text-slate-300"
          >
            <DotsSixVertical weight="bold" className="size-4" />
          </span>
        )}

        <button
          type="button"
          disabled={!toggleable}
          onClick={() => onLevel?.(isSub ? 2 : 3)}
          title={toggleable ? (isSub ? "Сделать разделом H2" : "Сделать подразделом H3") : undefined}
          aria-label={toggleable ? `Уровень ${section.level}. Изменить уровень заголовка` : `Уровень ${section.level}`}
          className={cn(
            "pressable flex h-6 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums",
            levelStyles[section.level],
            toggleable && "hover:brightness-95",
            !toggleable && "cursor-default",
          )}
        >
          H{section.level}
        </button>

        <input
          data-section={section.id}
          value={section.title}
          onChange={(e) => onTitle(e.target.value)}
          onFocus={onFocus}
          placeholder={isSub ? "Название подраздела" : section.level === 1 ? "Заголовок статьи" : "Название раздела"}
          aria-label={`Заголовок H${section.level}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-9 min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none",
            section.level === 1 && "text-[15px] font-semibold",
            section.level === 2 && "font-medium",
          )}
        />

        <button
          type="button"
          onClick={onRemove}
          disabled={locked}
          aria-label={`Удалить «${section.title || "без названия"}»`}
          title={locked ? "Заголовок H1 удалить нельзя" : "Удалить"}
          className="pressable flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-200 disabled:hover:bg-transparent [@media(hover:hover)]:opacity-60 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        >
          <Trash className="size-4" />
        </button>
      </div>
    </li>
  );
}
