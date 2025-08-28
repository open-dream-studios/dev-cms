// project/src/contexts/ProjectContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ProjectContextType = {
  currentProjectId: number | null;
  setCurrentProjectId: (id: number | null) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  return (
    <ProjectContext.Provider value={{ currentProjectId, setCurrentProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectContextProvider");
  return ctx;
};