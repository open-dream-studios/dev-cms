// project/src/util/schemas/estimationNodeSchema.ts
import { z } from "zod";
import type { EstimationGraphNode } from "@open-dream/shared";

export const NodeInputTypeSchema = z.enum([
  "text",
  "number",
  "boolean",
  "select",
]);
export const SelectModeSchema = z.enum(["single", "multi"]);

export const NodeSchema = z.object({
  label: z.string().min(1, "Label required"),
  prompt: z.string().min(1, "Prompt required"),
  input_type: NodeInputTypeSchema,

  required: z.boolean().catch(false),  
  select_mode: SelectModeSchema.catch("single"),

  produces_facts_json: z
    .string()
    .catch("[]")
    .refine((val) => {
      try {
        return Array.isArray(JSON.parse(val));
      } catch {
        return false;
      }
    }, "produces_facts must be valid JSON array"),

  options_json: z
    .string()
    .catch("[]")
    .refine((val) => {
      try {
        return Array.isArray(JSON.parse(val));
      } catch {
        return false;
      }
    }, "options_json must be valid JSON array"),

  visibility_rules_json: z
    .string()
    .catch("{}")
    .refine((val) => {
      try {
        const parsed = JSON.parse(val);
        return (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        );
      } catch {
        return false;
      }
    }, "visibility_rules must be valid JSON object"),
});

export type NodeFormData = z.infer<typeof NodeSchema>;

export function nodeToForm(node?: EstimationGraphNode | null): NodeFormData {
  return {
    label: node?.label ?? "",
    prompt: node?.config?.prompt ?? node?.label ?? "",
    input_type: (node?.config?.input_type ?? "text") as any,

    required: !!node?.config?.required, 
    select_mode: (node?.config?.select_mode ?? "single") as any,

    options_json: JSON.stringify(node?.config?.options ?? [], null, 2),
    produces_facts_json: JSON.stringify(
      node?.config?.produces_facts ?? [],
      null,
      2
    ),
    visibility_rules_json: JSON.stringify(
      node?.config?.visibility_rules ?? {},
      null,
      2
    ),
  };
}
