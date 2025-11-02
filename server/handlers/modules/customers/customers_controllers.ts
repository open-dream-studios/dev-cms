// server/handlers/modules/customers/customers_controller.ts
import type { Request, Response } from "express";
import type { Customer } from "@shared/types/models/customer.js";
import {
  getCustomersFunction,
  upsertCustomerFunction,
  deleteCustomerFunction,
} from "./customers_repositories.js";
import type { PoolConnection } from "mysql2/promise";

// ---------- CUSTOMER CONTROLLERS ----------
export const getCustomers = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const customers: Customer[] = await getCustomersFunction(project_idx);
  return { success: true, customers };
};

export const upsertCustomer = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertCustomerFunction(connection, project_idx, req.body);
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { customer_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !customer_id) throw new Error("Missing required fields");
  return await deleteCustomerFunction(connection, project_idx, customer_id);
};
