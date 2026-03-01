// server/handlers/payments/subscriptions/subscriptions_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import {
  syncStripeSubscriptionsFromStripeFunction,
  getStripeSubscriptionsForProjectFunction,
} from "./subscriptions_repositories.js";

export const getStripeSubscriptions = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const subscriptions = await getStripeSubscriptionsForProjectFunction(
    connection,
    project_idx
  );

  return { success: true, subscriptions };
};

export const syncStripeSubscriptions = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const { test_mode } = req.body;

  await syncStripeSubscriptionsFromStripeFunction(
    connection,
    project_idx,
    Boolean(test_mode)
  );

  return { success: true };
};
