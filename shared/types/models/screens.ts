// shared/types/models/project.ts
export type Screen =
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
  | "edit-customer-product"
  | "tasks"
  | "employees"
  | "gmail";

export type Modal =
  | { type: "mediaUpload" }
  | { type: "confirmDelete"; payload: { id: string } }
  | { type: "custom"; content: React.ReactNode };

export type UIState = {
  screen: Screen;
  modals: Modal[];
  sidebar: "none" | "mediaFolders" | "settings";
  setScreen: (s: Screen) => void;
  pushModal: (m: Modal) => void;
  popModal: () => void;
  setSidebar: (s: UIState["sidebar"]) => void;
};
