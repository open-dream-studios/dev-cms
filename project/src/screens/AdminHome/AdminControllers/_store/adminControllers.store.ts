// project/src/AdminHome/AdminControllers/_store/adminControllers.store.ts
import { createStore } from "@/store/createStore";
import {
  ActionDefinition,
  JobDefinition,
  PageDefinition,
  SectionDefinition,
} from "@open-dream/shared";

export type DefinitionItem = JobDefinition | ActionDefinition | PageDefinition | SectionDefinition;

export const useAdminControllersUIStore = createStore({
  showForm: false,
  selectedDefinition: null as DefinitionItem | null,
  editingDefinition: null as DefinitionItem | null,
  allowedSections: [] as | any[],
  newSection: "" as string
});
