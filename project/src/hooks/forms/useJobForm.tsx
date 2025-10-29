// project/src/hooks/useJobForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  JobSchema,
  JobFormData,
  defaultJobValues,
  TaskFormData,
  TaskSchema,
  defaultTaskValues,
} from "@/util/schemas/jobSchema";

export const useJobForm = (initialData?: Partial<JobFormData>) => {
  return useForm<JobFormData>({
    resolver: zodResolver(JobSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultJobValues,
      ...initialData,
    },
  });
};

export const useTaskForm = (initialData?: Partial<TaskFormData>) => {
  return useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultTaskValues,
      ...initialData,
    },
  });
};
