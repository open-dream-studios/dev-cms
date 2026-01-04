// project/src/hooks/useJobDefinitionsForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobDefinitionFormData, JobDefinitionSchema } from "@/util/schemas/jobDefinitionsSchema";

export function useJobDefinitionsForm(defaultValues?: Partial<JobDefinitionFormData>) {
  return useForm<JobDefinitionFormData>({
    resolver: zodResolver(JobDefinitionSchema),
    defaultValues: {
      type: defaultValues?.type || "",
      identifier: defaultValues?.identifier || "",
      description: defaultValues?.description || "", 
    },
  });
}