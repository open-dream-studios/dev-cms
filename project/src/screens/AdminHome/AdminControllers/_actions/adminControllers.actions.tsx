// project/src/screens/AdminHome/AdminControllers/_actions_AdminControllers.actions.tsx
import { JobDefinitionFormData } from "@/util/schemas/jobDefinitionsSchema";
import {
  DefinitionItem,
  useAdminControllersUIStore,
} from "../_store/adminControllers.store";
import {
  ActionDefinition,
  ActionDefinitionInput,
  JobDefinition,
  JobDefinitionInput,
  PageDefinition,
  PageDefinitionInput,
  SectionDefinition,
  SectionDefinitionInput,
} from "@open-dream/shared";
import {
  deleteJobDefinitionApi,
  upsertJobDefinitionApi,
} from "@/api/jobDefinitions.api";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useUiStore } from "@/store/useUIStore";
import Modal2Continue from "@/modals/Modal2Continue";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useJobDefinitionsForm } from "@/hooks/forms/useJobDefinitionsForm";
import {
  usePageDefinitionsForm,
  useSectionDefinitionsForm,
} from "@/hooks/forms/usePageDefinitionsForm";
import { useActionDefinitionsForm } from "@/hooks/forms/useActionDefinitionsForm";
import {
  PageDefinitionFormData,
  SectionDefinitionFormData,
} from "@/util/schemas/pageDefinitionsSchema";
import { ActionDefinitionFormData } from "@/util/schemas/actionDefinitionsSchema";
import {
  deleteProjectPageDefinitionApi,
  upsertProjectPageDefinitionApi,
} from "@/api/pageDefinitions.api";
import {
  deleteProjectSectionDefinitionsApi,
  upsertProjectSectionDefinitionsApi,
} from "@/api/sectionDefinitions.api";
import { upsertActionDefinitionApi } from "@/api/actionDefinitions.api";
import { queryClient } from "@/lib/queryClient";

export type TypedDefinitionAdapter<
  TFormData extends FieldValues,
  TDefinition extends DefinitionItem
> = {
  useForm: () => UseFormReturn<TFormData>;
  useDefinitions: () => {
    definitions: TDefinition[];
    isLoading: boolean;
  };
  submit: (form: UseFormReturn<TFormData>, data: TFormData) => Promise<void>;
  delete: (definition: TDefinition) => void;
  isParent: (child: TDefinition, parent: TDefinition | null) => boolean;
};

export type DefinitionAdapter = {
  useForm: () => UseFormReturn<FieldValues>;
  useDefinitions: () => {
    definitions: DefinitionItem[];
    isLoading: boolean;
  };
  submit: (
    form: UseFormReturn<FieldValues>,
    data: FieldValues
  ) => Promise<void>;
  delete: (definition: DefinitionItem) => void;
  isParent: (child: DefinitionItem, parent: DefinitionItem | null) => boolean;
};

function defineAdapter<
  TFormData extends FieldValues,
  TDefinition extends DefinitionItem
>(adapter: TypedDefinitionAdapter<TFormData, TDefinition>): DefinitionAdapter {
  return {
    useForm: adapter.useForm as () => UseFormReturn<FieldValues>,

    useDefinitions: () => {
      const result = adapter.useDefinitions();
      return {
        definitions: result.definitions as DefinitionItem[],
        isLoading: result.isLoading,
      };
    },

    submit: (form, data) =>
      adapter.submit(form as UseFormReturn<TFormData>, data as TFormData),

    delete: (definition) => adapter.delete(definition as TDefinition),

    isParent: (child, parent) =>
      adapter.isParent(child as TDefinition, parent as TDefinition | null),
  };
}

export type DefinitionType = "job" | "action" | "page" | "section";

export function isJobDefinition(
  def: DefinitionItem | null
): def is JobDefinition {
  return !!def && "job_definition_id" in def;
}

export function isActionDefinition(
  def: DefinitionItem | null
): def is ActionDefinition {
  return !!def && "action_definition_id" in def;
}

export function isPageDefinition(
  def: DefinitionItem | null
): def is PageDefinition {
  return !!def && "page_definition_id" in def;
}

export function isSectionDefinition(
  def: DefinitionItem | null
): def is SectionDefinition {
  return !!def && "section_definition_id" in def;
}

export const resetDefinitionDisplay = () => {
  const { setEditingDefinition, setShowForm, setAllowedSections } =
    useAdminControllersUIStore.getState();
  setShowForm(false);
  setEditingDefinition(null);
  setAllowedSections([]);
};

export const resetDefinitionDisplayForm = (
  form: UseFormReturn<any>,
  definition: DefinitionItem | null
) => {
  form.reset({
    identifier: definition?.identifier ?? "",
    type: definition?.type ?? "",
    description: definition?.description ?? "",
    allowed_sections:
      definition && isPageDefinition(definition)
        ? definition.allowed_sections ?? []
        : [],
  });
};

export const handleCancelAdminControllerForm = (form: UseFormReturn<any>) => {
  resetDefinitionDisplay();
  resetDefinitionDisplayForm(form, null);
};

export const onJobDefinitionSubmit = async (
  form: UseFormReturn<any>,
  data: JobDefinitionFormData
) => {
  const { selectedDefinition, editingDefinition } =
    useAdminControllersUIStore.getState();

  const { currentProjectId } = useCurrentDataStore.getState();

  if (!currentProjectId) return;

  const parentId =
    selectedDefinition && isJobDefinition(selectedDefinition)
      ? selectedDefinition.job_definition_id
      : null;

  const jobDefinitionId =
    editingDefinition && isJobDefinition(editingDefinition)
      ? editingDefinition.job_definition_id
      : null;

  await upsertJobDefinitionApi({
    project_idx: currentProjectId,
    job_definition_id: jobDefinitionId,
    parent_job_definition_id: parentId,
    identifier: data.identifier,
    type: data.type,
    description: data.description,
  } as JobDefinitionInput);

  queryClient.invalidateQueries({
    queryKey: ["jobDefinitions", currentProjectId],
  });

  resetDefinitionDisplay();
  resetDefinitionDisplayForm(form, null);
};

export const onActionDefinitionSubmit = async (
  form: UseFormReturn<any>,
  data: ActionDefinitionFormData
) => {
  const { selectedDefinition, editingDefinition } =
    useAdminControllersUIStore.getState();

  const { currentProjectId } = useCurrentDataStore.getState();

  if (!currentProjectId) return;

  const parentId =
    selectedDefinition && isActionDefinition(selectedDefinition)
      ? selectedDefinition.action_definition_id
      : null;

  const actionDefinitionId =
    editingDefinition && isActionDefinition(editingDefinition)
      ? editingDefinition.action_definition_id
      : null;

  await upsertActionDefinitionApi({
    project_idx: currentProjectId,
    action_definition_id: actionDefinitionId,
    parent_action_definition_id: parentId,
    identifier: data.identifier,
    type: data.type,
    description: data.description,
  } as ActionDefinitionInput);

  queryClient.invalidateQueries({
    queryKey: ["actionDefinitions", currentProjectId],
  });

  resetDefinitionDisplay();
  resetDefinitionDisplayForm(form, null);
};

export const onPageDefinitionSubmit = async (
  form: UseFormReturn<any>,
  data: PageDefinitionFormData
) => {
  const { allowedSections, selectedDefinition, editingDefinition } =
    useAdminControllersUIStore.getState();

  const { currentProjectId } = useCurrentDataStore.getState();

  if (!currentProjectId) return;

  const parentId =
    selectedDefinition && isPageDefinition(selectedDefinition)
      ? selectedDefinition.page_definition_id
      : null;

  const pageDefinitionId =
    editingDefinition && isPageDefinition(editingDefinition)
      ? editingDefinition.page_definition_id
      : null;

  const config_schema =
    editingDefinition && isPageDefinition(editingDefinition)
      ? editingDefinition.config_schema
      : {};

  await upsertProjectPageDefinitionApi({
    page_definition_id: pageDefinitionId,
    identifier: data.identifier,
    type: data.type,
    description: data.description,
    allowed_sections: allowedSections,
    parent_page_definition_id: parentId,
    config_schema: config_schema,
  } as PageDefinitionInput);

  queryClient.invalidateQueries({
    queryKey: ["pageDefinitions"],
  });

  resetDefinitionDisplay();
  resetDefinitionDisplayForm(form, null);
};

export const onSectionDefinitionSubmit = async (
  form: UseFormReturn<any>,
  data: SectionDefinitionFormData
) => {
  const { allowedSections, selectedDefinition, editingDefinition } =
    useAdminControllersUIStore.getState();

  const { currentProjectId } = useCurrentDataStore.getState();

  if (!currentProjectId) return;

  const parentId =
    selectedDefinition && isSectionDefinition(selectedDefinition)
      ? selectedDefinition.section_definition_id
      : null;

  const sectionDefinitionId =
    editingDefinition && isSectionDefinition(editingDefinition)
      ? editingDefinition.section_definition_id
      : null;

  const config_schema =
    editingDefinition && isSectionDefinition(editingDefinition)
      ? editingDefinition.config_schema
      : {};

  await upsertProjectSectionDefinitionsApi({
    section_definition_id: sectionDefinitionId,
    identifier: data.identifier,
    type: data.type,
    description: data.description,
    allowed_elements: allowedSections,
    parent_section_definition_id: parentId,
    config_schema: config_schema,
  } as SectionDefinitionInput);

  queryClient.invalidateQueries({
    queryKey: ["sectionDefinitions"],
  });

  resetDefinitionDisplay();
  resetDefinitionDisplayForm(form, null);
};

export const handleDeleteDefinition = (definition: DefinitionItem) => {
  const { modal2, setModal2 } = useUiStore.getState();
  setModal2({
    ...modal2,
    open: !modal2.open,
    content: (
      <Modal2Continue
        text={`Delete definition "${definition.type}"?`}
        onContinue={() => {
          if (isJobDefinition(definition)) {
            executeDeleteJobDefinition(definition as JobDefinition);
          }
          if (isActionDefinition(definition)) {
            executeDeleteActionDefinition(definition as ActionDefinition);
          }
          if (isPageDefinition(definition)) {
            executeDeletePageDefinition(definition as PageDefinition);
          }
          if (isSectionDefinition(definition)) {
            executeDeleteSectionDefinition(definition as SectionDefinition);
          }
        }}
        threeOptions={false}
      />
    ),
  });
};

const executeDeleteJobDefinition = async (definition: JobDefinition) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !definition.job_definition_id) return;
  await deleteJobDefinitionApi(currentProjectId, definition.job_definition_id);
  queryClient.invalidateQueries({
    queryKey: ["jobDefinitions", currentProjectId],
  });
};

const executeDeleteActionDefinition = async (definition: ActionDefinition) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !definition.action_definition_id) return;
  await deleteJobDefinitionApi(
    currentProjectId,
    definition.action_definition_id
  );
  queryClient.invalidateQueries({
    queryKey: ["actionDefinitions", currentProjectId],
  });
};

const executeDeletePageDefinition = async (definition: PageDefinition) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !definition.page_definition_id) return;
  await deleteProjectPageDefinitionApi(definition.page_definition_id);
  queryClient.invalidateQueries({
    queryKey: ["pageDefinitions"],
  });
};

const executeDeleteSectionDefinition = async (
  definition: SectionDefinition
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !definition.section_definition_id) return;
  await deleteProjectSectionDefinitionsApi(definition.section_definition_id);
  queryClient.invalidateQueries({
    queryKey: ["sectionDefinitions"],
  });
};

export const handleAdminControllerBackClick = (form: UseFormReturn<any>) => {
  const {
    setShowForm,
    setSelectedDefinition,
    setEditingDefinition,
    setAllowedSections,
  } = useAdminControllersUIStore.getState();

  setSelectedDefinition(null);
  setShowForm(false);
  setEditingDefinition(null);
  resetDefinitionDisplayForm(form, null);
  setAllowedSections([]);
};

export const handleDefinitionClick = (definition: DefinitionItem) => {
  const { selectedDefinition, setSelectedDefinition } =
    useAdminControllersUIStore.getState();
  if (selectedDefinition === null) setSelectedDefinition(definition);
};

export const handleEditDefinitionClick = (
  e: React.MouseEvent,
  definition: DefinitionItem,
  form: UseFormReturn<any>
) => {
  const { setEditingDefinition, setAllowedSections, setShowForm } =
    useAdminControllersUIStore.getState();
  e.stopPropagation();
  setEditingDefinition(definition);
  if (isPageDefinition(definition)) {
    setAllowedSections(definition.allowed_sections || []);
  }
  resetDefinitionDisplayForm(form, definition);
  setShowForm(true);
};

export const handleShowDefinitionForm = (form: UseFormReturn<any>) => {
  const { setShowForm } = useAdminControllersUIStore.getState();
  setShowForm(true);
  resetDefinitionDisplayForm(form, null);
};

export const definitionAdapters = {
  jobs: defineAdapter<JobDefinitionFormData, JobDefinition>({
    useForm: useJobDefinitionsForm,
    useDefinitions: () => {
      const { jobDefinitions, isLoadingJobDefinitions } = useContextQueries();
      return {
        definitions: jobDefinitions,
        isLoading: isLoadingJobDefinitions,
      };
    },
    submit: onJobDefinitionSubmit,
    delete: handleDeleteDefinition,
    isParent: (child: any, parent: any) => {
      if (!parent) return child.parent_job_definition_id === null;
      return (
        isJobDefinition(parent) &&
        child.parent_job_definition_id === parent.job_definition_id
      );
    },
  }),

  pages: defineAdapter<PageDefinitionFormData, PageDefinition>({
    useForm: usePageDefinitionsForm,
    useDefinitions: () => {
      const { pageDefinitions, isLoadingPageDefinitions } = useContextQueries();
      return {
        definitions: pageDefinitions,
        isLoading: isLoadingPageDefinitions,
      };
    },
    submit: onPageDefinitionSubmit,
    delete: handleDeleteDefinition,
    isParent: () => true,
  }),

  sections: defineAdapter<SectionDefinitionFormData, SectionDefinition>({
    useForm: useSectionDefinitionsForm,
    useDefinitions: () => {
      const { sectionDefinitions, isLoadingSectionDefinitions } =
        useContextQueries();
      return {
        definitions: sectionDefinitions,
        isLoading: isLoadingSectionDefinitions,
      };
    },
    submit: onSectionDefinitionSubmit,
    delete: handleDeleteDefinition,
    isParent: () => true,
  }),

  actions: defineAdapter<ActionDefinitionFormData, ActionDefinition>({
    useForm: useActionDefinitionsForm,
    useDefinitions: () => {
      const { actionDefinitions, isLoadingActionDefinitions } =
        useContextQueries();
      return {
        definitions: actionDefinitions,
        isLoading: isLoadingActionDefinitions,
      };
    },
    submit: onActionDefinitionSubmit,
    delete: handleDeleteDefinition,
    isParent: () => true,
  }),
} as const;
