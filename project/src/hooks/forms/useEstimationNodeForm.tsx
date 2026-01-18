// project/src/hooks/forms/useEstimationNodeForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  NodeSchema,
  NodeFormData,
  nodeToForm,
} from "@/util/schemas/estimationNodeSchema";
import type { EstimationGraphNode } from "@open-dream/shared";

export function useEstimationNodeForm(node?: EstimationGraphNode | null) {
  return useForm<NodeFormData>({
    resolver: zodResolver(NodeSchema),
    defaultValues: nodeToForm(node),
    mode: "onChange",
  });
}
