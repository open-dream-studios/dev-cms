// project/src/types/project.ts
import { ReactNode } from "react";

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
  | "add-customer-product"
  | "edit-customer-product"
  | "customer-products-table"
  | "tasks";

export type Modal =
  | { type: "mediaUpload" }
  | { type: "confirmDelete"; payload: { id: string } }
  | { type: "custom"; content: ReactNode };

export type UIState = {
  screen: Screen;
  modals: Modal[];
  sidebar: "none" | "mediaFolders" | "settings";
  setScreen: (s: Screen) => void;
  pushModal: (m: Modal) => void;
  popModal: () => void;
  setSidebar: (s: UIState["sidebar"]) => void;
};
