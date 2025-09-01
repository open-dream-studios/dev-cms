// project/src/contexts/ProjectContext.tsx
"use client";

import { ProjectPage, Section } from "@/types/pages";
import { Project } from "@/types/project";
import { createContext, useContext, useState, ReactNode } from "react";

type ProjectContextType = {
  currentProject: Project | null;
  currentProjectId: number | null;
  setCurrentProjectData: (project: Project | null) => void;
  currentPage: ProjectPage | null;
  currentPageId: number | null;
  setCurrentPageData: (page: ProjectPage | null) => void;
  currentSection: Section | null;
  currentSectionId: number | null;
  setCurrentSectionData: (section: Section | null) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentPageId, setCurrentPageId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<ProjectPage | null>(null);
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);

  const setCurrentProjectData = (project: Project | null) => {
    setCurrentProjectId(project ? project.id : null);
    setCurrentProject(project);
  };

  const setCurrentPageData = (page: ProjectPage | null) => {
    setCurrentPageId(page ? page.id : null);
    setCurrentPage(page);
  };

  const setCurrentSectionData = (section: Section | null) => {
    setCurrentSectionId(section ? section.id : null);
    setCurrentSection(section);
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProjectId,
        currentProject,
        setCurrentProjectData,
        currentPage,
        currentPageId,
        setCurrentPageData,
        currentSection,
        currentSectionId,
        setCurrentSectionData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx)
    throw new Error(
      "useProjectContext must be used within ProjectContextProvider"
    );
  return ctx;
};
