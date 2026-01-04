// project/src/screens/AdminHome/AdminControllers/_hooks/useEditJobDefinitionsController.ts
import { useEffect, useMemo } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useAdminControllersUIStore } from "../_store/adminControllers.store";
import { isJobDefinition } from "../_actions/adminControllers.actions";
import { UseFormReturn } from "react-hook-form";

export function useJobDefinitionsController(form: UseFormReturn<any>) {
  const { jobDefinitions, isLoadingJobDefinitions } = useContextQueries();
  const { showForm, editingDefinition, selectedDefinition } =
    useAdminControllersUIStore();

  useEffect(() => {
    if (showForm) {
      form.setFocus("type");
    }
  }, [showForm, form]);

  const filteredDefinitions = useMemo(() => {
    if (selectedDefinition === null) {
      return jobDefinitions.filter((p) => p.parent_job_definition_id === null);
    }
    if (!isJobDefinition(selectedDefinition)) return [];
    return jobDefinitions.filter(
      (p) => p.parent_job_definition_id === selectedDefinition.job_definition_id
    );
  }, [jobDefinitions, selectedDefinition]);

  return {
    showForm,
    editingDefinition,
    selectedDefinition,
    jobDefinitions,
    filteredDefinitions,
    isLoadingJobDefinitions,
  };
}
