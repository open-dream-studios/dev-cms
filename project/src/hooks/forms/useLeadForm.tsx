// project/src/hooks/useLeadForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LeadSchema,
  LeadFormData,
  defaultLeadValues,
} from "@/util/schemas/leadSchema";

export const useLeadForm = (initialData?: Partial<LeadFormData>) => {
  return useForm<LeadFormData>({
    resolver: zodResolver(LeadSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultLeadValues,
      ...initialData,
    },
  });
};
