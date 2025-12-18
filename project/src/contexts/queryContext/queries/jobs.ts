// src/context/queryContext/queries/jobs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Job } from "@open-dream/shared";
import {
  deleteProjectJobApi,
  fetchProjectJobsApi,
  upsertProjectJobApi,
} from "@/api/jobs.api";

export function useJobs(isLoggedIn: boolean, currentProjectId: number | null) {
  const queryClient = useQueryClient();

  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useQuery<Job[]>({
    queryKey: ["jobs", currentProjectId],
    queryFn: async () => fetchProjectJobsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertJobMutation = useMutation({
    mutationFn: async (job: Job) => upsertProjectJobApi(currentProjectId!, job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", currentProjectId] });
    },
    onError: (error) => {
      console.error("❌ Upsert job failed:", error);
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (job_id: string) =>
      deleteProjectJobApi(currentProjectId!, job_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", currentProjectId] });
    },
    onError: (error) => {
      console.error("❌ Delete job failed:", error);
    },
  });

  const upsertJob = async (job: Job) => {
    return await upsertJobMutation.mutateAsync(job);
  };

  const deleteJob = async (job_id: string) => {
    await deleteJobMutation.mutateAsync(job_id);
  };

  return {
    jobsData,
    isLoadingJobs,
    refetchJobs,
    upsertJob,
    deleteJob,
  };
}
