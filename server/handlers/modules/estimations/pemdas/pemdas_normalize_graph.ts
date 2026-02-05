// server/handlers/modules/estimations/pemdas/pemdas_normalize_graph.ts
import {
  PemdasGraphConfig,
  PemdasLineConfig,
  PemdasNodeConfig,
} from "./pemdas_types.js";
import { normalizeKey } from "./pemdas_helpers.js";

const normalizeFactKey = (n: any): string => {
  // ALWAYS use fact_key for runtime
  if (n.fact_key) return n.fact_key;
  if (n.variable) {
    return normalizeKey(n.variable);
  }
  throw new Error("Fact node missing fact_key");
};

export const normalizePemdasGraph = (raw: any): PemdasGraphConfig => {
  if (!raw?.layers || !raw?.nodes) {
    throw new Error("Invalid PEMDAS graph");
  }

  const contributorLabels: Record<string, string> = {};

  // PASS 1: collect contributors + ensure buckets
  for (const [id, node] of Object.entries(raw.nodes as Record<string, any>)) {
    if (node.nodeType === "contributor-node") {
      contributorLabels[id] = node.variable; // ✅ name
      ensureBucketLayers(raw, id);
    }
  }

  // PASS 2: build lines
  const lines: PemdasLineConfig[] = raw.layers.map((layer: any) => {
    const nodes: PemdasNodeConfig[] = (layer.nodeIds ?? []).flatMap(
      (nodeId: string) => {
        const n = raw.nodes[nodeId];
        if (!n) throw new Error(`Missing node ${nodeId}`);

        switch (n.nodeType) {
          case "constant":
            return [
              {
                kind: "constant",
                operand: normalizeOperand(n.operand),
                value: Number(n.constantValue ?? 0),
              },
            ];

          case "fact":
            return [
              {
                kind: "fact",
                operand: normalizeOperand(n.operand),
                fact_key: normalizeKey(n.variable),
              },
            ];

          case "geometric": {
            const key = normalizeKey(n.variable);
            if (!key) throw new Error("Variable node missing variable key");

            return [
              {
                kind: "variable",
                operand: normalizeOperand(n.operand),
                var_key: key,
              },
            ];
          }

          case "contributor-node":
            return ensureBucketLayers(raw, nodeId).map((bucketId) => ({
              kind: "contributor-bucket",
              operand: normalizeOperand(n.operand),
              target_line_id: bucketId,
            }));

          default:
            throw new Error(`Unsupported nodeType ${n.nodeType}`);
        }
      }
    );

    return { line_id: layer.id, nodes };
  });

  return { lines, contributorLabels };
};

const normalizeOperand = (op: string): "+" | "-" | "*" | "/" => {
  if (op === "×") return "*";
  if (op === "÷") return "/";
  if (["+", "-", "*", "/"].includes(op)) return op as any;
  throw new Error(`Invalid operand ${op}`);
};

const BUCKETS = ["labor", "materials", "misc"];

const ensureBucketLayers = (raw: any, contributorNodeId: string): string[] => {
  const existingIds = new Set(
    raw.layers
      .filter((l: any) => l.id.includes(`__${contributorNodeId}`))
      .map((l: any) => l.id)
  );

  for (const b of BUCKETS) {
    const id = `bucket-${b}__${contributorNodeId}`;
    if (!existingIds.has(id)) {
      raw.layers.push({
        id,
        y: 0,
        width: 0,
        nodeIds: [],
      });
    }
  }

  return BUCKETS.map((b) => `bucket-${b}__${contributorNodeId}`);
};
