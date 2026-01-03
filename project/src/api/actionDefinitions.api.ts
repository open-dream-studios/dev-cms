// project/src/api/actionDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import { ActionDefinition, ActionDefinitionInput } from "@open-dream/shared";

export async function fetchActionDefinitionsApi(project_idx: number) {
  if (!project_idx) return [];
  const res = await makeRequest.post("/actions/definitions", {
    project_idx,
  });
  return (res.data.actionDefinitions || []) as ActionDefinition[];
}

export async function upsertActionDefinitionApi(
  definition: ActionDefinitionInput
) {
  const res = await makeRequest.post("/actions/definitions/upsert", {
    ...definition,
  });
  return res.data;
}

export async function deleteActionDefinitionApi(
  project_idx: number,
  action_definition_id: string
) {
  if (!project_idx) return null;
  await makeRequest.post("/actions/definitions/delete", {
    action_definition_id,
    project_idx,
  });
}
