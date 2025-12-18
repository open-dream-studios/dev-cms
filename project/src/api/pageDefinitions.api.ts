// src/api/pageDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import { PageDefinition } from "@open-dream/shared";

export async function fetchProjectPageDefinitionsApi() {
  const res = await makeRequest.post("/api/pages/page-definitions/get-all");
  return (res.data.pageDefinitions || []) as PageDefinition[];
}

export async function upsertProjectPageDefinitionApi(
  definition: PageDefinition
) {
  await makeRequest.post("/api/pages/page-definitions/upsert", definition);
}

export async function deleteProjectPageDefinitionApi(
  page_definition_id: string
) {
  await makeRequest.post("/api/pages/page-definitions/delete", {
    page_definition_id,
  });
}
