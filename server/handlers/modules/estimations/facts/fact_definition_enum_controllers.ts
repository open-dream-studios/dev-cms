// server/handlers/modules/estimations/fact_definition_enum_controllers.ts
import type { PoolConnection } from "mysql2/promise";
import {
  deleteEnumOption,
  getEnumOptionsByFactDefinition,
  reorderEnumOptions,
  upsertEnumOption,
} from "./fact_definition_enum_repositories.js";
import { Request } from "express";

export const getEnumOptions = async (req: Request) => {
  const { fact_definition_idx } = req.body;
  if (!fact_definition_idx) throw new Error("Missing fact_definition_idx");
  const options = await getEnumOptionsByFactDefinition(fact_definition_idx);
  return { success: true, options };
};

export const upsertEnumOptionController = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { fact_definition_idx, option } = req.body;
  if (!fact_definition_idx || !option) {
    throw new Error("Missing fields");
  }
  return await upsertEnumOption(connection, fact_definition_idx, option);
};

export const deleteEnumOptionController = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { option_id } = req.body;
  if (!option_id) throw new Error("Missing option_id");
  await deleteEnumOption(connection, option_id);
  return { success: true };
};

export const reorderEnumOptionsController = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const { fact_definition_idx, orderedOptionIds } = req.body;
  if (!fact_definition_idx || !Array.isArray(orderedOptionIds)) {
    throw new Error("Invalid payload");
  }
  await reorderEnumOptions(connection, fact_definition_idx, orderedOptionIds);
  return { success: true };
};
