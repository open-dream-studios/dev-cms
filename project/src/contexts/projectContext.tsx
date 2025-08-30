// project/src/contexts/ProjectContext.tsx
"use client";

import { Project } from "@/types/project";
import { createContext, useContext, useState, ReactNode } from "react";

type ProjectContextType = {
  currentProject: Project |  null;
  currentProjectId: number | null;
  setProjectData: (project: Project | null) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const setProjectData = (project: Project | null) => {
    setCurrentProjectId(project ? project.id : null);
    setCurrentProject(project);
  };

  return (
    <ProjectContext.Provider value={{ currentProjectId, currentProject, setProjectData }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectContextProvider");
  return ctx;
};