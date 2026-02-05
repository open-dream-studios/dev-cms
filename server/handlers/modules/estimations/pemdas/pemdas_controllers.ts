// server/handlers/modules/estimations/pemdas/pemdas_controllers.ts
import type { Request } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  upsertPemdasGraph,
  getPemdasGraph,
  deletePemdasGraph,
  calculateEstimationRepo,
} from "./pemdas_repositories.js";
import { validatePemdasGraph } from "./pemdas_validation.js";

type PemdasType = "estimation" | "variable";

const assertInputs = (pemdas_type: PemdasType, conditional_id?: number) => {
  if (pemdas_type === "variable" && !conditional_id) {
    throw new Error("conditional_id required for variable pemdas graph");
  }
  if (pemdas_type === "estimation" && conditional_id) {
    throw new Error("conditional_id not allowed for estimation pemdas graph");
  }
};

export const upsertGraph = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { process_id, pemdas_type, conditional_id, config } = req.body;

  if (!project_idx || !process_id || !pemdas_type || !config) {
    throw new Error("Missing fields");
  }

  assertInputs(pemdas_type, conditional_id);
  validatePemdasGraph(config);

  await upsertPemdasGraph(
    connection,
    project_idx,
    process_id,
    pemdas_type,
    conditional_id ?? null,
    config
  );

  return { success: true };
};

export const getGraph = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { process_id, pemdas_type, conditional_id } = req.body;

  if (!project_idx || !process_id || !pemdas_type) {
    throw new Error("Missing fields");
  }

  assertInputs(pemdas_type, conditional_id);

  return {
    config: await getPemdasGraph(
      connection,
      project_idx,
      process_id,
      pemdas_type,
      conditional_id ?? null
    ),
  };
};

export const deleteGraph = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { process_id, pemdas_type, conditional_id } = req.body;

  if (!project_idx || !process_id || !pemdas_type) {
    throw new Error("Missing fields");
  }

  assertInputs(pemdas_type, conditional_id);

  await deletePemdasGraph(
    connection,
    project_idx,
    process_id,
    pemdas_type,
    conditional_id ?? null
  );

  return { success: true };
};

export const calculateEstimation = async (
  req: Request,
  _: any,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { process_id, process_run_id, fact_inputs } = req.body;

  if (!project_idx || !process_id || !process_run_id || !fact_inputs) {
    throw new Error("Missing fields");
  }

  const estimation = await calculateEstimationRepo(
    connection,
    project_idx,
    process_id,
    process_run_id,
    fact_inputs
  );

  return { success: true, estimation };
};
