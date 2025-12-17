// shared/types/models/ui.ts
export type ContextMenuPosition = {
  x: number;
  y: number;
};

export type ContextMenuItem<T = unknown> = {
  id: string;
  label: string;
  onClick: (target: T) => void | Promise<void>;
  disabled?: boolean | ((target: T) => boolean);
  danger?: boolean;
};

export type ContextMenuDefinition<T = unknown> = {
  items: ContextMenuItem<T>[];
};

export type ContextMenuState<T = unknown> = {
  position: ContextMenuPosition;
  target: T;
  menu: ContextMenuDefinition<T>;
};