// src/util/schemas/updatesSchema.ts
import { z } from "zod";

export const UpdateItemSchema = z.object({
  id: z.number().nullable().optional(),
  project_idx: z.number().nullable(),

  title: z.string().min(1),

  description: z.string().nullable(),
  requested_by: z.string().nullable(),
  assignee: z.string().nullable(),

  status: z.enum(["requested", "upcoming", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),

  created_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export type UpdateItemForm = z.infer<typeof UpdateItemSchema>;