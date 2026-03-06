// server/handlers/modules/estimation_forms/estimation_forms_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import type {
  EstimationFormGraph,
  EstimationFormStatus,
  EstimationValidationResult,
} from "@open-dream/shared";
import {
  deleteFormDefinitionFunction,
  getFormDefinitionByIdFunction,
  getFormDefinitionsFunction,
  upsertFormDefinitionFunction,
  updateFormDefinitionStatusFunction,
} from "./estimation_forms_repositories.js";

export const getFormDefinitions = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const include_archived = Boolean(req.body?.include_archived);
  const formDefinitions = await getFormDefinitionsFunction(
    project_idx,
    include_archived
  );

  return { success: true, formDefinitions };
};

export const getFormDefinition = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  const { form_id } = req.body as { form_id?: string };
  if (!project_idx || !form_id) throw new Error("Missing required fields");

  const formDefinition = await getFormDefinitionByIdFunction(project_idx, form_id);
  return { success: true, formDefinition };
};

export const upsertFormDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const {
    form_id,
    name,
    description,
    status,
    root,
    validation,
    bump_version,
  } = req.body as {
    form_id?: string;
    name: string;
    description?: string;
    status?: EstimationFormStatus;
    root: EstimationFormGraph;
    validation?: EstimationValidationResult | null;
    bump_version?: boolean;
  };

  return await upsertFormDefinitionFunction(connection, project_idx, {
    form_id,
    name,
    description,
    status,
    root,
    validation,
    bump_version,
  });
};

export const updateFormDefinitionStatus = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { form_id, status } = req.body as {
    form_id?: string;
    status?: EstimationFormStatus;
  };

  if (!project_idx || !form_id || !status) {
    throw new Error("Missing required fields");
  }
  if (!["draft", "published", "archived"].includes(status)) {
    throw new Error("Invalid status");
  }

  return await updateFormDefinitionStatusFunction(
    connection,
    project_idx,
    form_id,
    status
  );
};

export const deleteFormDefinition = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { form_id } = req.body as { form_id?: string };
  const project_idx = req.user?.project_idx;
  if (!project_idx || !form_id) throw new Error("Missing required fields");
  return await deleteFormDefinitionFunction(connection, project_idx, form_id);
};
