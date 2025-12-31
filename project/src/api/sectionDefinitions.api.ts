// src/api/sectionDefinitions.api.ts
import { makeRequest } from "@/util/axios";
import { SectionDefinition } from "@open-dream/shared";

export async function fetchProjectSectionDefinitionsApi() {
  const res = await makeRequest.post(
    "/sections/section-definitions/get-all"
  );
  return res.data.sectionDefinitions as SectionDefinition[];
}

export async function upsertProjectSectionDefinitionsApi(
  data: SectionDefinition
) {
  await makeRequest.post("/sections/section-definitions/upsert", data);
}

export async function deleteProjectSectionDefinitionsApi(
  section_definition_id: string
) {
  await makeRequest.post("/sections/section-definitions/delete", {
    section_definition_id,
  });
}
