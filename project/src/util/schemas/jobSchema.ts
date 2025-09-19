// project/src/util/schemas/jobSchema.ts
import { z } from "zod";

export const JobSchema = z.object({
  valuation: z
    .number()
    .min(0, "Must be a positive number")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: "Max 2 decimal places",
    })
    .optional()
    .nullable(),
  status: z.enum([
    "waiting_diagnosis",
    "waiting_work",
    "waiting_parts",
    "waiting_listing",
    "listed",
    "waiting_customer",
    "waiting_delivery",
    "complete",
    "delivered",
    "cancelled",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  scheduled_start_date: z.date().optional().nullable(),
  completed_date: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type JobFormData = z.infer<typeof JobSchema>;

export const defaultJobValues: JobFormData = {
  valuation: 0,
  status: "waiting_work",
  priority: "medium",
  scheduled_start_date: null,
  completed_date: null,
  notes: "",
};

export const TaskSchema = z.object({
  status: z.enum([
    "waiting_work",
    "waiting_parts",
    "waiting_customer",
    "complete",
    "cancelled",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  scheduled_start_date: z.date().optional().nullable(),
  // completed_date: z.date().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type TaskFormData = z.infer<typeof TaskSchema>;

export const defaultTaskValues: TaskFormData = {
  status: "waiting_work",
  priority: "medium",
  scheduled_start_date: null,
  // completed_date: null,
  description: "",
  notes: "",
};
