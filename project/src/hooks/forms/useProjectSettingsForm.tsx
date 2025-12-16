// project/src/hooks/useProjectSettingsForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectSettingsSchema,
  ProjectSettingsFormData,
  projectSettingsToForm,
} from "@/util/schemas/projectSettingsSchema";
import { SubmitHandler } from "react-hook-form";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { setCurrentProjectData, useCurrentDataStore } from "@/store/currentDataStore";
import { Project } from "@open-dream/shared";

export function useProjectSettingsForm(projectSettings?: any | null) {
  return useForm<ProjectSettingsFormData>({
    resolver: zodResolver(ProjectSettingsSchema),
    defaultValues: projectSettingsToForm(projectSettings),
    mode: "onChange",
  });
}

export function useProjectSettingsFormSubmit() {
  const { upsertProject } = useContextQueries();
  const { currentProject } = useCurrentDataStore();

  const onProjectSettingsFormSubmit: SubmitHandler<
    ProjectSettingsFormData
  > = async (data) => {
    if (!currentProject) return;

    const newProjectSettings: Project = {
      project_id: currentProject.project_id,
      name: data.name,
      short_name: data.short_name ?? null,
      domain: data.domain ?? null,
      backend_domain: data.backend_domain ?? null,
      brand: data.brand ?? null,
      logo_media_id: data.logo_media_id ?? null,
    };

    try {
      const upsertedProject = await upsertProject(newProjectSettings);
      if (upsertedProject) {
        setCurrentProjectData(upsertedProject);
      }
    } catch (err) {
      console.error("❌ Project settings upsert failed in form:", err);
    }
  };

  return { onProjectSettingsFormSubmit };
}
