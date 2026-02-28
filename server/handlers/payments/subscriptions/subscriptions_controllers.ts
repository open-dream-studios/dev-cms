// server/handlers/payments/subscriptions/subscriptions_controllers.ts
import type { Request, Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import Stripe from "stripe";
import {
  syncActiveSubscriptionsFromStripeFunction,
  clearActiveSubscriptionsForProjectFunction,
  getActiveSubscriptionsForProjectFunction,
} from "./subscriptions_repositories.js";

export const getActiveSubscriptions = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const subscriptions =
    await getActiveSubscriptionsForProjectFunction(connection, project_idx);

  return { success: true, subscriptions };
};

export const syncActiveSubscriptions = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const { test_mode } = req.body;

  const stripe = test_mode
    ? new Stripe(process.env.STRIPE_TEST_SECRET_KEY!)
    : new Stripe(process.env.STRIPE_SECRET_KEY!);

  await syncActiveSubscriptionsFromStripeFunction(
    connection,
    stripe,
    project_idx,
    Boolean(test_mode)
  );

  return { success: true };
};

export const clearActiveSubscriptions = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  await clearActiveSubscriptionsForProjectFunction(
    connection,
    project_idx
  );

  return { success: true };
};