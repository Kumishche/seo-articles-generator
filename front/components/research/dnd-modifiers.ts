import type { Modifier } from "@dnd-kit/core";

/** Перемещение только по вертикали (аналог @dnd-kit/modifiers без лишней зависимости) */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
