// project/src/util/schemas/updatesSchema.ts
import { z } from "zod";
import { UpdateInput } from "@open-dream/shared";

export const UpdateItemSchema = z.object({
  id: z.number().nullable().optional(),
  project_idx: z.number().nullable(),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable(),
  requested_by: z.string().nullable(),
  assignee: z.string().nullable(),
  status: z.enum(["requested", "upcoming", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  created_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export type UpdateItemForm = z.infer<typeof UpdateItemSchema>;

export function updateToForm(
  update?: Partial<UpdateInput> | null
): UpdateItemForm {
  return {
    id: update?.id ?? null,
    project_idx: update?.project_idx ?? null,
    title: update?.title ?? "",
    description: update?.description ?? null,
    requested_by: update?.requested_by ?? null,
    assignee: update?.assignee ?? null,
    status: update?.status ?? "requested",
    priority: update?.priority ?? "medium",
    created_at: update?.created_at ?? new Date().toISOString(),
    completed_at: update?.completed_at ?? null,
  };
}