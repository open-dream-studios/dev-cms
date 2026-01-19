// project/src/contexts/queryContext/queries/estimations/pricing.ts
import { useMutation } from "@tanstack/react-query";
import {
  listPricingGraphsApi,
  createPricingGraphApi,
  publishPricingGraphApi,
  listPricingNodesApi,
  createPricingNodeApi,
  updatePricingNodeApi,
  deletePricingNodeApi,
} from "@/api/estimations/pricing.api";

export function usePricingGraphs() {
  return {
    list: useMutation({ mutationFn: listPricingGraphsApi }),
    create: useMutation({ mutationFn: createPricingGraphApi }),
    publish: useMutation({ mutationFn: publishPricingGraphApi }),
  };
}

export function usePricingNodes() {
  return {
    list: useMutation({ mutationFn: listPricingNodesApi }),
    create: useMutation({ mutationFn: createPricingNodeApi }),
    update: useMutation({ mutationFn: updatePricingNodeApi }),
    remove: useMutation({ mutationFn: deletePricingNodeApi }),
  };
}
