// src/contexts/uiContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type Screen = "dashboard" | "products" | "products-table" | "media" | "pages" | "settings";

type Modal =
  | { type: "mediaUpload" }
  | { type: "confirmDelete"; payload: { id: string } }
  | { type: "custom"; content: ReactNode };

type UIState = {
  screen: Screen;
  modals: Modal[];
  sidebar: "none" | "mediaFolders" | "settings";
  setScreen: (s: Screen) => void;
  pushModal: (m: Modal) => void;
  popModal: () => void;
  setSidebar: (s: UIState["sidebar"]) => void;
};

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [modals, setModals] = useState<Modal[]>([]);
  const [sidebar, setSidebar] = useState<UIState["sidebar"]>("none");

  const pushModal = (m: Modal) => setModals((prev) => [...prev, m]);
  const popModal = () => setModals((prev) => prev.slice(0, -1));

  return (
    <UIContext.Provider
      value={{ screen, modals, sidebar, setScreen, pushModal, popModal, setSidebar }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}