// project/src/contexts/queryContext/queries/estimations/runtime.ts
import { useMutation } from "@tanstack/react-query";
import {
  startRuntimeApi,
  fetchRuntimeStateApi,
  answerNodeApi,
  goBackApi,
  resumeRuntimeApi,
  fetchRunsApi,
  getBreakDownApi
} from "@/api/estimations/runtime.api";

export function useEstimationRuntime(enabled: boolean) {
  const runs = useMutation({
    mutationFn: fetchRunsApi,
  });

  const startRun = useMutation({
    mutationFn: startRuntimeApi,
  });

  const resumeRun = useMutation({
    mutationFn: resumeRuntimeApi,
  });

  const stateQuery = useMutation({
    mutationFn: fetchRuntimeStateApi,
  });

  const answerNode = useMutation({
    mutationFn: answerNodeApi,
  });

  const goBack = useMutation({
    mutationFn: goBackApi,
  });

  const getBreakdown = useMutation({
    mutationFn: getBreakDownApi,
  });

  return {
    runs,
    startRun,
    resumeRun,
    fetchState: stateQuery,
    answerNode,
    goBack,
    getBreakdown
  };
}
