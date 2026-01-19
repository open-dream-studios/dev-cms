// server/handlers/modules/estimations/graphs/graph_validation_controller.ts
import type { Request } from "express";
import { loadGraph } from "../../../runtime/graph_loader.js";
import { validateGraphStructure } from "./graph_validation.js";

export const validateGraph = async (req: Request) => {
  const { graph_idx } = req.body;

  if (!graph_idx) {
    return {
      valid: false,
      errors: ["graph_idx required"],
      warnings: [],
    };
  }

  const graph = await loadGraph(graph_idx);
  return validateGraphStructure(graph);
};