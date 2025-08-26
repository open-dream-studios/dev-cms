"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Project } from "@/types/project";

type ProjectContextType = {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error(
      "useProjectContext must be used within ProjectContextProvider"
    );
  }
  return ctx;
};
