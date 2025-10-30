// project/src/contexts/queryContext.tsx
"use client";
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  RefObject,
} from "react";
import { QueryObserverResult } from "@tanstack/react-query";
import { AuthContext } from "../authContext";
import {
  useMediaLinks,
  useCustomers,
  useJobDefinitions,
  useProjectModules,
  useProjects,
  useProducts,
  useProjectUsers,
  useIntegrations,
  useModuleDefinitions,
  useMediaFolders,
  useMedia,
  usePageDefinitions,
  useProjectPages,
  useSections,
  useSectionDefinitions,
  useJobs,
  useTasks,
  useEmployees,
} from "./queries";
import {
  PageDefinition,
  ProjectPage,
  Section,
  SectionDefinition,
} from "@/types/pages";
import { Customer } from "@/types/customers";
import { Job, JobDefinition, Task } from "@/types/jobs";
import { Employee, EmployeeAssignment } from "@/types/employees";
import { Media, MediaFolder, MediaLink } from "@/types/media";
import {
  Integration,
  ModuleDefinition,
  Project,
  ProjectModule,
  ProjectUser,
} from "@/types/project";
import { Product } from "@/types/products";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useTheme } from "./queries/theme";

export type QueryContextType = {
  handleThemeChange: () => void;
  isOptimisticUpdate: RefObject<boolean>;

  // ---- Products ----
  productsData: Product[];
  isLoadingProductsData: boolean;
  refetchProductsData: () => Promise<QueryObserverResult<Product[], Error>>;
  upsertProducts: (updatedProducts: Product[]) => Promise<number[]>;
  deleteProducts: (product_ids: string[]) => void;

  // ---- Projects ----
  projectsData: Project[];
  isLoadingProjects: boolean;
  refetchProjects: () => void;
  upsertProject: (project: Project) => Promise<Project>;
  deleteProject: (project_id: string) => Promise<void>;

  // ---- Project Users ----
  projectUsers: ProjectUser[];
  isLoadingProjectUsers: boolean;
  refetchProjectUsers: () => void;
  upsertProjectUser: (projectUser: ProjectUser) => Promise<void>;
  deleteProjectUser: (projectUser: ProjectUser) => Promise<void>;

  // ---- Project Modules ----
  projectModules: ProjectModule[];
  isLoadingProjectModules: boolean;
  refetchProjectModules: () => Promise<
    QueryObserverResult<ProjectModule[], Error>
  >;
  upsertProjectModule: (data: ProjectModule) => Promise<void>;
  deleteProjectModule: (module_id: string) => Promise<void>;
  hasProjectModule: (identifier: string) => boolean;

  // ---- Integrations ----
  integrations: Integration[];
  isLoadingIntegrations: boolean;
  refetchIntegrations: () => Promise<any>;
  upsertIntegration: (data: Integration) => Promise<void>;
  deleteIntegration: (integration_id: string) => Promise<void>;

  // ---- Modules Definitions ----
  moduleDefinitions: ModuleDefinition[];
  isLoadingModuleDefinitions: boolean;
  refetchModuleDefinitions: () => Promise<any>;
  upsertModuleDefinition: (data: ModuleDefinition) => Promise<void>;
  deleteModuleDefinition: (module_definition_id: string) => Promise<void>;

  // ---- Media ----
  media: Media[];
  isLoadingMedia: boolean;
  refetchMedia: () => void;
  upsertMedia: (data: Media[]) => Promise<Media[]>;
  deleteMedia: (media_id: string) => Promise<void>;

  mediaFolders: MediaFolder[];
  isLoadingMediaFolders: boolean;
  refetchMediaFolders: () => void;
  upsertMediaFolders: (data: MediaFolder[]) => Promise<number[]>;
  deleteMediaFolder: (folder_id: string) => Promise<void>;

  // ---- Media Links ----
  mediaLinks: MediaLink[];
  isLoadingMediaLinks: boolean;
  refetchMediaLinks: () => void;
  upsertMediaLinks: (items: MediaLink[]) => Promise<void>;
  deleteMediaLinks: (mediaLinks: MediaLink[]) => Promise<void>;

  // ---- Page Definitions ----
  pageDefinitions: PageDefinition[];
  isLoadingPageDefinitions: boolean;
  refetchPageDefinitions: () => Promise<any>;
  upsertPageDefinition: (data: PageDefinition) => Promise<void>;
  deletePageDefinition: (page_definition_id: string) => Promise<void>;

  // ---- Project Pages ----
  projectPages: ProjectPage[];
  isLoadingProjectPages: boolean;
  refetchProjectPages: () => Promise<any>;
  upsertProjectPage: (page: ProjectPage) => Promise<string>;
  deleteProjectPage: (page_id: string) => Promise<void>;
  reorderProjectPages: (
    parent_page_id: number | null,
    orderedIds: string[]
  ) => Promise<void>;

  // ---- SECTIONS ----
  sectionDefinitions: SectionDefinition[];
  isLoadingSectionDefinitions: boolean;
  refetchSectionDefinitions: () => Promise<any>;
  upsertSectionDefinition: (data: SectionDefinition) => Promise<void>;
  deleteSectionDefinition: (section_definition_id: string) => Promise<void>;

  projectSections: Section[];
  isLoadingSections: boolean;
  refetchSections: () => Promise<any>;
  upsertSection: (data: Section) => Promise<string>;
  deleteSection: (section_id: string) => Promise<void>;
  reorderSections: (data: {
    project_idx: number;
    project_page_id: number;
    parent_section_id: number | null;
    orderedIds: string[];
  }) => void;

  // Customers
  customers: Customer[];
  isLoadingCustomers: boolean;
  refetchCustomers: () => Promise<any>;
  upsertCustomer: (data: Customer) => Promise<{
    id: number;
    customer_id: string;
  }>;
  deleteCustomer: (customer_id: string) => Promise<void>;

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

  // ---- Tasks ----
  tasks: Task[];
  isLoadingTasks: boolean;
  refetchTasks: () => Promise<any>;
  upsertTask: (task: Task) => Promise<any>;
  deleteTask: (task_id: string) => Promise<void>;

  // ---- Employees ----
  employees: Employee[];
  isLoadingEmployees: boolean;
  refetchEmployees: () => Promise<any>;
  upsertEmployee: (employee: Employee) => Promise<string>;
  deleteEmployee: (employee_id: string) => Promise<void>;

  // ---- EmployeeTasks ----
  employeeAssignments: EmployeeAssignment[];
  isLoadingEmployeeAssignments: boolean;
  refetchEmployeeAssignments: () => Promise<any>;
  addEmployeeAssignment: (assignment: {
    employee_id: string;
    task_id?: string;
    job_id?: string;
  }) => Promise<void>;
  deleteEmployeeAssignment: (assignment_id: number) => Promise<void>;
};

const QueryContext = createContext<QueryContextType | undefined>(undefined);

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentProjectId, currentPageId } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const isLoggedIn = useMemo(
    () => !!currentUser?.user_id,
    [currentUser?.user_id]
  );
  const isOptimisticUpdate = useRef(false);

  const { handleThemeChange } = useTheme(currentUser);
  const {
    projectsData,
    isLoadingProjects,
    refetchProjects,
    upsertProject,
    deleteProject,
  } = useProjects(isLoggedIn, currentProjectId);
  const {
    productsData,
    isLoadingProductsData,
    refetchProductsData,
    upsertProducts,
    deleteProducts,
  } = useProducts(isLoggedIn, currentProjectId, isOptimisticUpdate);
  const {
    projectUsersData,
    isLoadingProjectUsers,
    refetchProjectUsers,
    upsertProjectUser,
    deleteProjectUser,
  } = useProjectUsers(isLoggedIn, currentProjectId);
  const {
    projectModules,
    isLoadingProjectModules,
    refetchProjectModules,
    upsertProjectModule,
    deleteProjectModule,
    hasProjectModule,
  } = useProjectModules(isLoggedIn, currentProjectId);
  const {
    integrations,
    isLoadingIntegrations,
    refetchIntegrations,
    upsertIntegration,
    deleteIntegration,
  } = useIntegrations(isLoggedIn, currentProjectId);
  const {
    moduleDefinitions,
    isLoadingModuleDefinitions,
    refetchModuleDefinitions,
    upsertModuleDefinition,
    deleteModuleDefinition,
  } = useModuleDefinitions(isLoggedIn, currentProjectId);
  const { media, isLoadingMedia, refetchMedia, upsertMedia, deleteMedia } =
    useMedia(isLoggedIn, currentProjectId);
  const {
    mediaLinks,
    isLoadingMediaLinks,
    refetchMediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
  } = useMediaLinks(isLoggedIn, currentProjectId);
  const {
    mediaFolders,
    isLoadingMediaFolders,
    refetchMediaFolders,
    upsertMediaFolders,
    deleteMediaFolder,
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
    upsertProjectPage,
    deleteProjectPage,
    reorderProjectPages,
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
    upsertSection,
    deleteSection,
    reorderSections,
  } = useSections(isLoggedIn, currentProjectId, currentPageId);
  const {
    customers,
    isLoadingCustomers,
    refetchCustomers,
    upsertCustomer,
    deleteCustomer,
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
  const { tasksData, isLoadingTasks, refetchTasks, upsertTask, deleteTask } =
    useTasks(isLoggedIn, currentProjectId);

  const {
    employeesData,
    isLoadingEmployees,
    refetchEmployees,
    upsertEmployee,
    deleteEmployee,
    employeeAssignments,
    isLoadingEmployeeAssignments,
    refetchEmployeeAssignments,
    addEmployeeAssignment,
    deleteEmployeeAssignment,
  } = useEmployees(isLoggedIn, currentProjectId);

  return (
    <QueryContext.Provider
      value={{
        handleThemeChange,
        isOptimisticUpdate,
        productsData: productsData ?? [],
        isLoadingProductsData,
        refetchProductsData,
        upsertProducts,
        deleteProducts,
        projectsData: projectsData ?? [],
        isLoadingProjects,
        refetchProjects,
        upsertProject,
        deleteProject,
        projectUsers: projectUsersData ?? [],
        isLoadingProjectUsers,
        refetchProjectUsers,
        upsertProjectUser,
        deleteProjectUser,
        projectModules,
        isLoadingProjectModules,
        refetchProjectModules,
        upsertProjectModule,
        deleteProjectModule,
        hasProjectModule,
        integrations,
        isLoadingIntegrations,
        refetchIntegrations,
        upsertIntegration,
        deleteIntegration,
        moduleDefinitions,
        isLoadingModuleDefinitions,
        refetchModuleDefinitions,
        upsertModuleDefinition,
        deleteModuleDefinition,
        media,
        mediaFolders,
        isLoadingMedia,
        isLoadingMediaFolders,
        refetchMedia,
        refetchMediaFolders,
        upsertMedia,
        deleteMedia,
        mediaLinks,
        isLoadingMediaLinks,
        refetchMediaLinks,
        upsertMediaLinks,
        deleteMediaLinks,
        upsertMediaFolders,
        deleteMediaFolder,
        pageDefinitions,
        isLoadingPageDefinitions,
        refetchPageDefinitions,
        upsertPageDefinition,
        deletePageDefinition,
        projectPages,
        isLoadingProjectPages,
        refetchProjectPages,
        upsertProjectPage,
        deleteProjectPage,
        reorderProjectPages,
        sectionDefinitions,
        isLoadingSectionDefinitions,
        refetchSectionDefinitions,
        upsertSectionDefinition,
        deleteSectionDefinition,
        projectSections,
        isLoadingSections,
        refetchSections,
        upsertSection,
        deleteSection,
        reorderSections,
        customers,
        isLoadingCustomers,
        refetchCustomers,
        upsertCustomer,
        deleteCustomer,
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
        tasks: tasksData ?? [],
        isLoadingTasks,
        refetchTasks,
        upsertTask,
        deleteTask,
        employees: employeesData ?? [],
        isLoadingEmployees,
        refetchEmployees,
        upsertEmployee,
        deleteEmployee,
        employeeAssignments: employeeAssignments ?? [],
        isLoadingEmployeeAssignments,
        refetchEmployeeAssignments,
        addEmployeeAssignment,
        deleteEmployeeAssignment,
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
