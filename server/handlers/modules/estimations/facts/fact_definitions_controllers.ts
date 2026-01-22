import type { Response, Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  getFactDefinitionsFunction,
  upsertFactDefinitionFunction,
  deleteFactDefinitionFunction,
  reorderFactDefinitionsFunction
} from "./fact_definitions_repositories.js";

export const getFactDefinitions = async (req: Request) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const facts = await getFactDefinitionsFunction(project_idx);
  return { success: true, fact_definitions: facts };
};

export const upsertFactDefinition = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertFactDefinitionFunction(connection, project_idx, req.body);
};

export const deleteFactDefinition = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { fact_id } = req.body;
  if (!project_idx || !fact_id) throw new Error("Missing required fields");

  return await deleteFactDefinitionFunction(connection, project_idx, fact_id);
};

export const reorderFactDefinitions = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const {orderedIds, process_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !Array.isArray(orderedIds) || !process_id) {
    throw new Error("Missing required fields");
  }
  const result = await reorderFactDefinitionsFunction(
    connection,
    project_idx,
    req.body
  );
  return { success: true, updated: result.affectedRows };
};
