// project/src/contexts/queryContext.tsx
"use client";
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  RefObject,
} from "react";
import { QueryObserverResult, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../authContext";
import {
  AddProjectInput,
  Integration,
  Module,
  Project,
  ProjectModule,
  ProjectUser,
} from "@/types/project";
import { Product } from "@/types/products";
import { useProjectContext } from "../projectContext";
import { Media, MediaFolder, MediaInsert, MediaLink } from "@/types/media";
import { useMediaLinks } from "./queries/mediaLinks";
import {
  useProjectModules,
  useProjects,
  useProducts,
  useProjectUsers,
  useIntegrations,
  useModules,
  useMediaFolders,
  useMedia,
  usePageDefinitions,
  useProjectPages,
} from "./queries";
import {
  PageDefinition,
  ProjectPage,
  Section,
  SectionDefinition,
} from "@/types/pages";
import { useSectionDefinitions } from "./queries/sectionDefinitions";
import { useSections } from "./queries/sections";
import { useCustomers } from "./queries/customers";
import { Customer } from "@/types/customers";
import { Job, JobDefinition, Task, TaskDefinition } from "@/types/jobs";
import { useJobDefinitions } from "./queries/jobDefinitions";
import { useJobs } from "./queries/jobs";
import { useTasks } from "./queries/tasks";
import { useTaskDefinitions } from "./queries/taskDefinitions";

export type QueryContextType = {
  isOptimisticUpdate: RefObject<boolean>;

  // ---- Products ----
  productsData: Product[];
  isLoadingProductsData: boolean;
  refetchProductsData: () => Promise<QueryObserverResult<Product[], Error>>;
  updateProducts: (updatedProducts: Product[]) => Promise<number[]>;
  deleteProducts: (serial_numbers: string[]) => void;

  // ---- Projects ----
  projectsData: Project[];
  isLoadingProjects: boolean;
  refetchProjects: () => void;
  addProject: (projectData: AddProjectInput) => Promise<void>;
  deleteProject: (project: Project) => Promise<void>;
  updateProject: (data: {
    project_idx: number;
    name: string;
    short_name?: string;
    domain?: string;
    backend_domain?: string;
    brand?: string;
    logo?: string | null;
  }) => Promise<void>;

  // ---- Project Users ----
  projectUsers: ProjectUser[];
  isLoadingProjectUsers: boolean;
  refetchProjectUsers: () => void;
  updateProjectUser: (projectUser: ProjectUser) => Promise<void>;
  deleteProjectUser: (projectUser: ProjectUser) => Promise<void>;

  // ---- Project Modules ----
  projectModules: ProjectModule[];
  isLoadingProjectModules: boolean;
  refetchProjectModules: () => Promise<
    QueryObserverResult<ProjectModule[], Error>
  >;
  addProjectModule: (data: {
    project_idx: number;
    module_id: number;
    settings?: any;
  }) => Promise<void>;
  deleteProjectModule: (data: {
    project_idx: number;
    module_id: number;
  }) => Promise<void>;
  hasProjectModule: (identifier: string) => boolean;

  // ---- Integrations ----
  integrations: Integration[];
  isLoadingIntegrations: boolean;
  refetchIntegrations: () => Promise<any>;
  upsertIntegration: (data: {
    project_idx: number;
    module_id: number;
    config: Record<string, string>;
  }) => Promise<void>;
  deleteIntegrationKey: (data: {
    project_idx: number;
    module_id: number;
    key: string;
  }) => Promise<void>;

  // ---- Modules ----
  modules: Module[];
  isLoadingModules: boolean;
  refetchModules: () => Promise<any>;
  upsertModule: (data: {
    id?: number;
    name: string;
    description?: string;
    identifier: string;
    config_schema?: string[];
    parent_module_id: number | null;
  }) => Promise<void>;
  deleteModule: (id: number) => Promise<void>;

  // ---- Media ----
  media: Media[];
  mediaFolders: MediaFolder[];
  isLoadingMedia: boolean;
  isLoadingMediaFolders: boolean;
  refetchMedia: () => void;
  refetchMediaFolders: () => void;
  addMedia: (data: MediaInsert[]) => Promise<Media[]>;
  deleteMedia: (id: number) => Promise<void>;
  reorderMedia: (data: {
    folder_id: number | null;
    orderedIds: number[];
  }) => Promise<void>;
  addMediaFolder: (data: {
    project_idx: number;
    parent_id?: number | null;
    name: string;
  }) => Promise<number>;
  deleteMediaFolder: (id: number) => Promise<void>;
  reorderMediaFolders: (data: {
    parent_id: number | null;
    orderedIds: number[];
  }) => Promise<void>;
  renameMediaFolder: (data: {
    folder_id: number;
    name: string;
  }) => Promise<void>;

  // ---- Media Links ----
  mediaLinks: MediaLink[];
  isLoadingMediaLinks: boolean;
  refetchMediaLinks: () => void;
  upsertMediaLinks: (items: MediaLink[]) => Promise<void>;
  deleteMediaLinks: (ids: number[]) => Promise<void>;
  reorderMediaLinks: (orderedIds: number[]) => Promise<void>;

  // ---- Page Definitions ----
  pageDefinitions: PageDefinition[];
  isLoadingPageDefinitions: boolean;
  refetchPageDefinitions: () => Promise<any>;
  upsertPageDefinition: (data: {
    id?: number;
    identifier: string;
    name: string;
    parent_page_definition_id?: number | null;
    allowed_sections?: string[];
    config_schema?: Record<string, any>;
  }) => Promise<void>;
  deletePageDefinition: (id: number) => Promise<void>;

  // ---- Project Pages ----
  projectPages: ProjectPage[];
  isLoadingProjectPages: boolean;
  refetchProjectPages: () => Promise<any>;
  addProjectPage: (data: any) => Promise<void>;
  deleteProjectPage: (data: {
    project_idx: number;
    id: number;
  }) => Promise<void>;
  reorderProjectPages: (data: {
    project_idx: number;
    parent_page_id: number | null;
    orderedIds: number[];
  }) => void;

  // ---- SECTIONS ----
  sectionDefinitions: SectionDefinition[];
  isLoadingSectionDefinitions: boolean;
  refetchSectionDefinitions: () => Promise<any>;
  upsertSectionDefinition: (data: {
    id?: number;
    identifier: string;
    name: string;
    parent_section_definition_id?: number | null;
    allowed_elements?: string[];
    config_schema?: Record<string, any>;
  }) => Promise<void>;
  deleteSectionDefinition: (id: number) => Promise<void>;

  projectSections: Section[];
  isLoadingSections: boolean;
  refetchSections: () => Promise<any>;
  addSection: (data: any) => Promise<void>;
  deleteSection: (data: { project_idx: number; id: number }) => Promise<void>;
  reorderSections: (data: {
    project_idx: number;
    project_page_id: number;
    parent_section_id: number | null;
    orderedIds: number[];
  }) => void;

  // Customers
  customers: Customer[];
  isLoadingCustomers: boolean;
  refetchCustomers: () => Promise<any>;
  upsertCustomer: (data: any) => Promise<Customer>;
  deleteCustomer: (data: { project_idx: number; id: number }) => Promise<void>;

  // ---- Job Definitions ----
  jobDefinitions: JobDefinition[];
  isLoadingJobDefinitions: boolean;
  refetchJobDefinitions: () => Promise<any>;
  upsertJobDefinition: (definition: JobDefinition) => Promise<any>;
  deleteJobDefinition: (definition_id: string) => Promise<void>;

  // ---- Jobs ----
  jobs: Job[];
  isLoadingJobs: boolean;
  refetchJobs: () => Promise<any>;
  upsertJob: (job: Job) => Promise<any>;
  deleteJob: (job_id: string) => Promise<void>;

  // ---- Task Definitions ----
  taskDefinitions: TaskDefinition[];
  isLoadingTaskDefinitions: boolean;
  refetchTaskDefinitions: () => Promise<any>;
  upsertTaskDefinition: (definition: TaskDefinition) => Promise<any>;
  deleteTaskDefinition: (definition_id: string) => Promise<void>;

  // ---- Tasks ----
  tasks: Task[];
  isLoadingTasks: boolean;
  refetchTasks: () => Promise<any>;
  upsertTask: (task: Task) => Promise<any>;
  deleteTask: (task_id: string) => Promise<void>;
};

const QueryContext = createContext<QueryContextType | undefined>(undefined);

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentProjectId, currentPageId } = useProjectContext();
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const isLoggedIn = useMemo(
    () => !!currentUser?.user_id,
    [currentUser?.user_id]
  );
  const isOptimisticUpdate = useRef(false);

  const {
    projectsData,
    isLoadingProjects,
    refetchProjects,
    updateProject,
    addProject,
    deleteProject,
  } = useProjects(isLoggedIn, currentProjectId);
  const {
    productsData,
    isLoadingProductsData,
    refetchProductsData,
    updateProducts,
    deleteProducts,
  } = useProducts(isLoggedIn, currentProjectId, isOptimisticUpdate);
  const {
    projectUsers,
    isLoadingProjectUsers,
    refetchProjectUsers,
    updateProjectUser,
    deleteProjectUser,
  } = useProjectUsers(isLoggedIn, currentProjectId);
  const {
    projectModules,
    isLoadingProjectModules,
    refetchProjectModules,
    addProjectModuleMutation,
    deleteProjectModuleMutation,
    hasProjectModule,
  } = useProjectModules(isLoggedIn, currentProjectId);
  const {
    integrations,
    isLoadingIntegrations,
    refetchIntegrations,
    upsertIntegration,
    deleteIntegrationKey,
  } = useIntegrations(isLoggedIn, currentProjectId, currentUser, projectUsers);
  const {
    modules,
    isLoadingModules,
    refetchModules,
    upsertModule,
    deleteModule,
  } = useModules(isLoggedIn, currentProjectId);
  const {
    media,
    isLoadingMedia,
    refetchMedia,
    addMedia,
    deleteMedia,
    reorderMedia,
  } = useMedia(isLoggedIn, currentProjectId);
  const {
    mediaLinks,
    isLoadingMediaLinks,
    refetchMediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
    reorderMediaLinks,
  } = useMediaLinks(isLoggedIn, currentProjectId);
  const {
    mediaFolders,
    isLoadingMediaFolders,
    refetchMediaFolders,
    addMediaFolder,
    deleteMediaFolder,
    renameMediaFolder,
    reorderMediaFolders,
  } = useMediaFolders(isLoggedIn, currentProjectId);
  const {
    pageDefinitions,
    isLoadingPageDefinitions,
    refetchPageDefinitions,
    upsertPageDefinition,
    deletePageDefinition,
  } = usePageDefinitions(isLoggedIn);
  const {
    projectPages,
    isLoadingProjectPages,
    refetchProjectPages,
    addProjectPageMutation,
    deleteProjectPageMutation,
    reorderProjectPagesMutation,
  } = useProjectPages(isLoggedIn, currentProjectId);
  const {
    sectionDefinitions,
    isLoadingSectionDefinitions,
    refetchSectionDefinitions,
    upsertSectionDefinition,
    deleteSectionDefinition,
  } = useSectionDefinitions(isLoggedIn);
  const {
    projectSections,
    isLoadingSections,
    refetchSections,
    addSection,
    deleteSection,
    reorderSections,
  } = useSections(isLoggedIn, currentProjectId, currentPageId);
  const {
    customers,
    isLoadingCustomers,
    refetchCustomers,
    upsertCustomerMutation,
    deleteCustomerMutation,
  } = useCustomers(isLoggedIn, currentProjectId);

  const {
    jobDefinitionsData,
    isLoadingJobDefinitions,
    refetchJobDefinitions,
    upsertJobDefinition,
    deleteJobDefinition,
  } = useJobDefinitions(isLoggedIn, currentProjectId);
  const { jobsData, isLoadingJobs, refetchJobs, upsertJob, deleteJob } =
    useJobs(isLoggedIn, currentProjectId);

  const {
    taskDefinitionsData,
    isLoadingTaskDefinitions,
    refetchTaskDefinitions,
    upsertTaskDefinition,
    deleteTaskDefinition,
  } = useTaskDefinitions(isLoggedIn, currentProjectId);
  const { tasksData, isLoadingTasks, refetchTasks, upsertTask, deleteTask } =
    useTasks(isLoggedIn, currentProjectId);

  return (
    <QueryContext.Provider
      value={{
        isOptimisticUpdate,
        productsData: productsData ?? [],
        isLoadingProductsData,
        refetchProductsData,
        updateProducts,
        deleteProducts,
        projectsData,
        isLoadingProjects,
        refetchProjects,
        addProject,
        deleteProject,
        projectUsers,
        isLoadingProjectUsers,
        refetchProjectUsers,
        updateProjectUser,
        deleteProjectUser,
        projectModules,
        isLoadingProjectModules,
        refetchProjectModules,
        addProjectModule: (data: {
          project_idx: number;
          module_id: number;
          settings?: any;
        }) => addProjectModuleMutation.mutateAsync(data),
        deleteProjectModule: (data: {
          project_idx: number;
          module_id: number;
        }) => deleteProjectModuleMutation.mutateAsync(data),
        hasProjectModule,
        integrations,
        isLoadingIntegrations,
        refetchIntegrations,
        upsertIntegration,
        deleteIntegrationKey,
        modules,
        isLoadingModules,
        refetchModules,
        upsertModule,
        deleteModule,
        updateProject,
        media,
        mediaFolders,
        isLoadingMedia,
        isLoadingMediaFolders,
        refetchMedia,
        refetchMediaFolders,
        addMedia,
        deleteMedia,
        reorderMedia,
        mediaLinks,
        isLoadingMediaLinks,
        refetchMediaLinks,
        upsertMediaLinks,
        deleteMediaLinks,
        reorderMediaLinks,
        addMediaFolder,
        deleteMediaFolder,
        reorderMediaFolders,
        renameMediaFolder,
        pageDefinitions,
        isLoadingPageDefinitions,
        refetchPageDefinitions,
        upsertPageDefinition,
        deletePageDefinition,
        projectPages,
        isLoadingProjectPages,
        refetchProjectPages,
        addProjectPage: (data: any) => addProjectPageMutation.mutateAsync(data),
        deleteProjectPage: (data: { project_idx: number; id: number }) =>
          deleteProjectPageMutation.mutateAsync(data),
        reorderProjectPages: (data: {
          project_idx: number;
          parent_page_id: number | null;
          orderedIds: number[];
        }) => reorderProjectPagesMutation.mutateAsync(data),
        sectionDefinitions,
        isLoadingSectionDefinitions,
        refetchSectionDefinitions,
        upsertSectionDefinition,
        deleteSectionDefinition,
        projectSections,
        isLoadingSections,
        refetchSections,
        addSection,
        deleteSection,
        reorderSections,
        customers,
        isLoadingCustomers,
        refetchCustomers,
        upsertCustomer: (data: any) => upsertCustomerMutation.mutateAsync(data),
        deleteCustomer: (data) => deleteCustomerMutation.mutateAsync(data),
        jobDefinitions: jobDefinitionsData ?? [],
        isLoadingJobDefinitions,
        refetchJobDefinitions,
        upsertJobDefinition,
        deleteJobDefinition,
        jobs: jobsData ?? [],
        isLoadingJobs,
        refetchJobs,
        upsertJob,
        deleteJob,
        taskDefinitions: taskDefinitionsData ?? [],
        isLoadingTaskDefinitions,
        refetchTaskDefinitions,
        upsertTaskDefinition,
        deleteTaskDefinition,
        tasks: tasksData ?? [],
        isLoadingTasks,
        refetchTasks,
        upsertTask,
        deleteTask,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
};

export const useContextQueries = () => {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error("useQueries must be used within a QueryProvider");
  }
  return context;
};
