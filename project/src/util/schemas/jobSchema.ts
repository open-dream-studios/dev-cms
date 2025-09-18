// project/src/util/schemas/jobSchema.ts
import { z } from "zod";

export const JobSchema = z.object({
  // job_definition_id: z.number().min(1, "Definition required"),
  status: z.enum([
    "work_required",
    "waiting_parts",
    "waiting_customer",
    "complete",
    "cancelled",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  scheduled_date: z.date().optional().nullable(),
  completed_date: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type JobFormData = z.infer<typeof JobSchema>;

export const defaultJobValues: JobFormData = {
  // job_definition_id: 0,
  status: "work_required",
  priority: "medium",
  scheduled_date: null,
  completed_date: null,
  notes: "",
};