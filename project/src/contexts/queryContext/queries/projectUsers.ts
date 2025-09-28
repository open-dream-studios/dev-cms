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
    data: projectUsersData,
    isLoading: isLoadingProjectUsers,
    refetch: refetchProjectUsers,
  } = useQuery<ProjectUser[]>({
    queryKey: ["projectUsers"],
    queryFn: async () => {
      const res = await makeRequest.get("/api/projects/project-users");
      return res.data.projectUsers;
    },
    enabled: isLoggedIn
  });

  const upsertProjectUserMutation = useMutation({
    mutationFn: async (projectUser: ProjectUser) => {
      const res = await makeRequest.post(
        "/api/projects/upsert-project-user",
        projectUser
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectUsers"],
      });
    },
  });

  const upsertProjectUser = async (projectUser: ProjectUser) => {
    return await upsertProjectUserMutation.mutateAsync(projectUser);
  };

  const deleteProjectUserMutation = useMutation({
    mutationFn: async (projectUser: ProjectUser) => {
      await makeRequest.post("/api/projects/delete-project-user", projectUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectUsers"],
      });
    },
  });

  const deleteProjectUser = async (projectUser: ProjectUser) => {
    await deleteProjectUserMutation.mutateAsync(projectUser);
  };

  return {
    projectUsersData,
    isLoadingProjectUsers,
    refetchProjectUsers,
    upsertProjectUser,
    deleteProjectUser,
  };
}
