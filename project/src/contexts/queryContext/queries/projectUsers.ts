// project/src/context/queryContext/queries/projectUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectUser } from "@open-dream/shared";
import {
  deleteProjectUserApi,
  fetchProjectUsersApi,
  upsertProjectUserApi,
} from "@/api/projectUsers.api";

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
    queryFn: async () => fetchProjectUsersApi(),
    enabled: isLoggedIn,
  });

  const upsertProjectUserMutation = useMutation({
    mutationFn: async (projectUser: ProjectUser) =>
      upsertProjectUserApi(projectUser),
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
    mutationFn: async (projectUser: ProjectUser) =>
      deleteProjectUserApi(projectUser),
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
