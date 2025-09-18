// project/src/hooks/useJobForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobSchema, JobFormData, defaultJobValues } from "@/util/schemas/jobSchema";

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