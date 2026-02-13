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

export type Screen =
  | "none"
  | "dashboard"
  | "add-product"
  | "edit-product"
  | "products"
  | "products-table"
  | "media"
  | "pages"
  | "settings"
  | "customers"
  | "customer-products"
  | "tasks"
  | "employees"
  | "gmail"
  | "google-ads"
  | "updates"
  | "estimations"
  | "estimations-builder"
  | "estimations-pricing"
  | "estimations-calculation"

export type Modal =
  | { type: "mediaUpload" }
  | { type: "confirmDelete"; payload: { id: string } }
  | { type: "custom"; content: any };

export type UIState = {
  screen: Screen;
  modals: Modal[];
  sidebar: "none" | "settings";
  setScreen: (s: Screen) => void;
  pushModal: (m: Modal) => void;
  popModal: () => void;
  setSidebar: (s: UIState["sidebar"]) => void;
};
