// src/context/queryContext/queries/jobs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Job } from "@/types/jobs";
import { utcToProjectTimezone, utcToLocal } from "@/util/functions/Time";

export function useJobs(isLoggedIn: boolean, currentProjectId: number | null) {
  const queryClient = useQueryClient();

  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useQuery<Job[]>({
    queryKey: ["jobs", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/jobs", {
        project_idx: currentProjectId,
      });

      const jobs: Job[] = (res.data.jobs || []).map((job: Job) => ({
        ...job,
        scheduled_start_date: job.scheduled_start_date
          ? new Date(utcToProjectTimezone(job.scheduled_start_date as string)!)
          : null,
        completed_date: job.completed_date
          ? new Date(utcToProjectTimezone(job.completed_date as string)!)
          : null,
        updated_at: job.updated_at
          ? new Date(utcToLocal(job.updated_at as string)!)
          : null,
      }));

      return jobs;
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertJobMutation = useMutation({
    mutationFn: async (job: Job) => {
      const res = await makeRequest.post("/api/jobs/upsert", {
        ...job,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", currentProjectId] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (job_id: string) => {
      await makeRequest.post("/api/jobs/delete", {
        job_id,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", currentProjectId] });
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
