// project/src/context/queryContext/queries/estimations/pemdasGraphs.ts
import { useMutation } from "@tanstack/react-query";
import {
  upsertPemdasGraphApi,
  getPemdasGraphApi,
  deletePemdasGraphApi,
  PemdasGraphType,
  calculatePemdasGraphApi,
} from "@/api/estimations/pemdasGraphs.api";
import type { PemdasSerialized } from "@/modules/EstimationModule/EstimationPEMDAS/_helpers/pemdas.serialize";

export function usePemdasGraphs(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const upsertGraphMutation = useMutation({
    mutationFn: (payload: {
      process_id: number;
      pemdas_type: PemdasGraphType;
      conditional_id?: string;
      config: PemdasSerialized;
    }) => upsertPemdasGraphApi(currentProjectId!, payload),
  });

  const getGraphMutation = useMutation({
    mutationFn: (payload: {
      process_id: number;
      pemdas_type: PemdasGraphType;
      conditional_id?: string;
    }) => getPemdasGraphApi(currentProjectId!, payload),
  });

  const deleteGraphMutation = useMutation({
    mutationFn: (payload: {
      process_id: number;
      pemdas_type: PemdasGraphType;
      conditional_id?: string;
    }) => deletePemdasGraphApi(currentProjectId!, payload),
  });

  const calculateGraphMutation = useMutation({
    mutationFn: (payload: {
      process_id: number;
      process_run_id: number;
      fact_inputs: Record<string, string>;
    }) => calculatePemdasGraphApi(currentProjectId!, payload),
  });

  return {
    upsertPemdasGraph: (p: {
      process_id: number;
      pemdas_type: PemdasGraphType;
      conditional_id?: string;
      config: PemdasSerialized;
    }) => upsertGraphMutation.mutateAsync(p),

    getPemdasGraph: (p: {
      process_id: number;
      pemdas_type: PemdasGraphType;
      conditional_id?: string;
    }) => getGraphMutation.mutateAsync(p),

    deletePemdasGraph: (p: {
      process_id: number;
      pemdas_type: PemdasGraphType;
      conditional_id?: string;
    }) => deleteGraphMutation.mutateAsync(p),

    calculatePemdasGraph: (p: {
      process_id: number;
      process_run_id: number;
      fact_inputs: Record<string, string>;
    }) => calculateGraphMutation.mutateAsync(p),
  };
}
