// project/src/contexts/queryContext.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  RefObject,
} from "react";
import {
  useQuery,
  useMutation,
  QueryObserverResult,
  useQueryClient,
} from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { AuthContext } from "./authContext";
import {
  AddProjectInput,
  Integration,
  Module,
  Project,
  ProjectModule,
  ProjectUser,
} from "@/types/project";
import { Product } from "@/types/products";
import { useProjectContext } from "./projectContext";

export type QueryContextType = {
  isOptimisticUpdate: RefObject<boolean>;
  productsData: Product[];
  isLoadingProductsData: boolean;
  refetchProductsData: () => Promise<QueryObserverResult<Product[], Error>>;
  updateProducts: (updatedProducts: Product[]) => void;
  deleteProducts: (serial_numbers: string[]) => void;
  projectsData: Project[];
  isLoadingProjects: boolean;
  refetchProjects: () => void;
  addProject: (projectData: AddProjectInput) => Promise<void>;
  deleteProject: (project: Project) => Promise<void>;
  projectUsers: ProjectUser[];
  isLoadingProjectUsers: boolean;
  refetchProjectUsers: () => void;
  updateProjectUser: (projectUser: ProjectUser) => Promise<void>;
  deleteProjectUser: (projectUser: ProjectUser) => Promise<void>;
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
  modules: Module[];
  isLoadingModules: boolean;
  refetchModules: () => Promise<any>;
  upsertModule: (data: {
    id?: number;
    name: string;
    description?: string;
    identifier: string;
  }) => Promise<void>;
  deleteModule: (id: number) => Promise<void>;
};

const QueryContext = createContext<QueryContextType | undefined>(undefined);

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentProject } = useProjectContext();
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const isLoggedIn = useMemo(
    () => !!currentUser?.user_id,
    [currentUser?.user_id]
  );

  const {
    data: productsData,
    isLoading: isLoadingProductsData,
    refetch: refetchProductsData,
  } = useQuery<Product[]>({
    queryKey: ["products", currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const res = await makeRequest.get("/api/products", {
        params: { project_idx: currentProject.id },
      });
      const result = res.data.products || [];
      return result.sort(
        (a: Product, b: Product) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
      );
    },
    enabled: isLoggedIn && !!currentProject,
  });

  const updateProductsMutation = useMutation({
    mutationFn: async (products: Product[]) => {
      if (!currentProject) return;
      await makeRequest.post("/api/products/update", {
        project_idx: currentProject.id,
        products,
      });
    },
    onMutate: async (updatedProducts: Product[]) => {
      const queryKey = ["products"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Product[]>(queryKey);
      if (!previousData) return { previousData, queryKey };
      const newData = previousData.map((product) => {
        const updated = updatedProducts.find(
          (p) => p.serial_number === product.serial_number
        );
        return updated ? updated : product;
      });
      queryClient.setQueryData(queryKey, newData);
      isOptimisticUpdate.current = true;
      return { previousData, queryKey };
    },
    onError: (_err, _newData, context) => {
      if (context?.queryKey && context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _err, _variables, context) => {
      isOptimisticUpdate.current = false;
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  type DeleteContext = {
    previousData: any[] | undefined;
    queryKey: string[];
  };

  const deleteProductsMutation = useMutation<
    void,
    Error,
    string[],
    DeleteContext
  >({
    mutationFn: async (serial_numbers: string[]) => {
      if (!currentProject) return;
      await makeRequest.post("/api/products/delete", {
        project_idx: currentProject.id,
        serial_numbers,
      });
    },
    onMutate: async (serial_numbers: string[]) => {
      const queryKey = ["products"];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = previousData.filter(
        (product) => !serial_numbers.includes(product.serial_number)
      );

      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const updateProducts = async (updatedProducts: Product[]) => {
    await updateProductsMutation.mutateAsync(updatedProducts);
  };

  const deleteProducts = async (serial_numbers: string[]) => {
    await deleteProductsMutation.mutateAsync(serial_numbers);
  };

  const isOptimisticUpdate = useRef(false);

  const {
    data: projectsData = [],
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await makeRequest.get("/api/projects");
      return res.data.projects;
    },
    enabled: isLoggedIn,
  });

  const mutation = useMutation({
    mutationFn: async (projectData: AddProjectInput) => {
      await makeRequest.post("/api/projects/add", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const addProject = async (projectData: AddProjectInput) => {
    await mutation.mutateAsync(projectData);
  };

  const deleteProjectMutation = useMutation<
    void,
    Error,
    string[],
    { previousData: Project[] | undefined; queryKey: string[] }
  >({
    mutationFn: async (ids: string[]) => {
      await makeRequest.post("/api/projects/delete", {
        ids,
      });
    },
    onMutate: async (ids: string[]) => {
      const queryKey = ["projects"];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<Project[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = previousData.filter(
        (project) => !ids.includes(project.project_id)
      );
      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const deleteProject = async (project: Project) => {
    await deleteProjectMutation.mutateAsync([project.project_id]);
  };

  const {
    data: projectUsers = [],
    isLoading: isLoadingProjectUsers,
    refetch: refetchProjectUsers,
  } = useQuery<ProjectUser[]>({
    queryKey: ["projectUsers", currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const res = await makeRequest.get("/api/projects/project-users", {
        params: { project_idx: currentProject.id },
      });
      return res.data.projectUsers;
    },
    enabled: isLoggedIn && !!currentProject,
  });

  const updateProjectUserMutation = useMutation({
    mutationFn: async (data: ProjectUser) => {
      await makeRequest.post("/api/projects/update-project-user", data);
      return data;
    },
    onMutate: async (newUser) => {
      const queryKey = ["projectUsers"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<ProjectUser[]>(queryKey);
      if (!previousData) return { previousData, queryKey };
      let newData: ProjectUser[];
      const existingIndex = previousData.findIndex(
        (u) =>
          u.email === newUser.email && u.project_idx === newUser.project_idx
      );

      if (existingIndex >= 0) {
        newData = previousData.map((u, i) =>
          i === existingIndex ? { ...u, ...newUser } : u
        );
      } else {
        newData = [...previousData, newUser];
      }
      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _newUser, context) => {
      if (context?.queryKey && context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _err, _newUser, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const updateProjectUser = async (projectUser: ProjectUser) => {
    await updateProjectUserMutation.mutateAsync(projectUser);
  };

  const deleteProjectUserMutation = useMutation({
    mutationFn: async (user: ProjectUser) => {
      await makeRequest.post("/api/projects/delete-project-user", {
        email: user.email,
        project_idx: user.project_idx,
      });
      return user;
    },
    onMutate: async (deletedUser) => {
      const queryKey = ["projectUsers"];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<ProjectUser[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = previousData.filter(
        (u) =>
          !(
            u.email === deletedUser.email &&
            u.project_idx === deletedUser.project_idx
          )
      );

      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _deletedUser, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _err, _deletedUser, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const deleteProjectUser = async (user: ProjectUser) => {
    await deleteProjectUserMutation.mutateAsync(user);
  };

  const {
    data: projectModules = [],
    isLoading: isLoadingProjectModules,
    refetch: refetchProjectModules,
  } = useQuery<ProjectModule[]>({
    queryKey: ["projectModules", currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const res = await makeRequest.post("/api/modules/get", {
        project_idx: currentProject.id,
      });
      return res.data.projectModules;
    },
    enabled: isLoggedIn && !!currentProject,
  });

  const addProjectModuleMutation = useMutation({
    mutationFn: async (data: {
      project_idx: number;
      module_id: number;
      settings?: any;
    }) => {
      await makeRequest.post("/api/modules/add", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProject?.id],
      });
    },
  });

  const deleteProjectModuleMutation = useMutation({
    mutationFn: async (data: { project_idx: number; module_id: number }) => {
      await makeRequest.post("/api/modules/delete", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectModules", currentProject?.id],
      });
    },
  });

  const hasProjectModule = (identifier: string): boolean => {
    return projectModules?.some((pm) => pm.identifier === identifier);
  };

  const {
    data: integrations = [],
    isLoading: isLoadingIntegrations,
    refetch: refetchIntegrations,
  } = useQuery<Integration[]>({
    queryKey: ["integrations", currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const res = await makeRequest.get("/api/integrations", {
        params: { project_idx: currentProject.id },
      });
      return res.data.integrations || [];
    },
    enabled: isLoggedIn && !!currentProject,
  });
  const upsertIntegrationMutation = useMutation({
    mutationFn: async (data: {
      module_id: number;
      config: Record<string, string>;
    }) => {
      await makeRequest.post("/api/integrations/update", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["integrations", currentProject?.id],
      });
    },
  });

  const upsertIntegration = async (data: {
    module_id: number;
    config: Record<string, string>;
  }) => {
    await upsertIntegrationMutation.mutateAsync(data);
  };

  const deleteIntegrationKeyMutation = useMutation({
    mutationFn: async (integration: {
      project_idx: number;
      module_id: number;
      key: string;
    }) => {
      await makeRequest.post("/api/integrations/key", {
        project_idx: integration.project_idx,
        module_id: integration.module_id,
        key: integration.key,
      });
      return integration;
    },
    onMutate: async (deletedIntegration) => {
      const queryKey = ["integrations", currentProject?.id];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = previousData.map((integration) => {
        if (integration.module_id !== deletedIntegration.module_id)
          return integration;

        const newConfig = { ...integration.config };
        delete newConfig[deletedIntegration.key];

        return { ...integration, config: newConfig };
      });

      queryClient.setQueryData(queryKey, newData);
      return { previousData, queryKey };
    },
    onError: (_err, _deletedIntegration, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _err, _deletedIntegration, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const deleteIntegrationKey = async (data: {
    project_idx: number;
    module_id: number;
    key: string;
  }) => {
    await deleteIntegrationKeyMutation.mutateAsync(data);
  };

  const {
    data: modules = [],
    isLoading: isLoadingModules,
    refetch: refetchModules,
  } = useQuery<Module[]>({
    queryKey: ["modules"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/modules/get-all");
      return res.data.modules;
    },
    enabled: isLoggedIn,
  });

  const upsertModuleMutation = useMutation({
    mutationFn: async (data: {
      id?: number;
      name: string;
      description?: string;
      identifier: string;
    }) => {
      await makeRequest.post("/api/modules/upsert", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  const upsertModule = async (data: {
    id?: number;
    name: string;
    description?: string;
    identifier: string;
  }) => {
    await upsertModuleMutation.mutateAsync(data);
  };

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await makeRequest.post("/api/modules/delete-module", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  const deleteModule = async (id: number) => {
    await deleteModuleMutation.mutateAsync(id);
  };

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
