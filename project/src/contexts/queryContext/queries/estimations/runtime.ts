// project/src/contexts/queryContext/queries/estimations/runtime.ts
import { useMutation } from "@tanstack/react-query";
import {
  startRuntimeApi,
  fetchRuntimeStateApi,
  answerNodeApi,
  goBackApi,
} from "@/api/estimations/runtime.api";

export function useEstimationRuntime(enabled: boolean) {
  const startRun = useMutation({
    mutationFn: startRuntimeApi,
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

  return {
    startRun,
    fetchState: stateQuery,
    answerNode,
    goBack,
  };
}
