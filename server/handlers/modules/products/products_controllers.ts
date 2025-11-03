// server/handlers/modules/products/products_controllers.ts
import {
  deleteProductsFunction,
  getProductsFunction,
  upsertProductsFunction,
} from "./products_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import type { Product } from "@open-dream/shared";

// ---------- PRODUCT CONTROLLERS ----------
export const getProducts = async (req: Request, res: Response) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const products: Product[] = await getProductsFunction(project_idx);
  return { success: true, products };
};

export const upsertProducts = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  const { products } = req.body;
  if (!project_idx) throw new Error("Missing project_idx");
  if (!products || !Array.isArray(products) || products.length === 0)
    throw new Error("Missing required fields");
  return await upsertProductsFunction(connection, project_idx, products);
};

export const deleteProducts = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { product_ids } = req.body;
  const project_idx = req.user?.project_idx;
  if (
    !project_idx ||
    !product_ids ||
    !Array.isArray(product_ids) ||
    !product_ids.length
  )
    throw new Error("Missing required fields");
  return await deleteProductsFunction(connection, project_idx, product_ids);
};
