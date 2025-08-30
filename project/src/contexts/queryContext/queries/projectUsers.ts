// src/context/queryContext/queries/projectUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { ProjectUser } from "@/types/project";

export function useProjectUsers(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();
  const {
    data: projectUsers = [],
    isLoading: isLoadingProjectUsers,
    refetch: refetchProjectUsers,
  } = useQuery<ProjectUser[]>({
    queryKey: ["projectUsers", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.get("/api/projects/project-users", {
        params: { project_idx: currentProjectId },
      });
      return res.data.projectUsers;
    },
    enabled: isLoggedIn && !!currentProjectId,
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

  return {
    projectUsers,
    isLoadingProjectUsers,
    refetchProjectUsers,
    updateProjectUser,
    deleteProjectUser,
  };
}
