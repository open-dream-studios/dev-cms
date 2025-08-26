// project/src/hooks/useIntegrationForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IntegrationSchema,
  IntegrationFormData,
} from "@/util/schemas/integrationSchema";

export function useIntegrationForm() {
  return useForm<IntegrationFormData>({
    resolver: zodResolver(IntegrationSchema),
    defaultValues: { key: "", value: "" },
  });
}