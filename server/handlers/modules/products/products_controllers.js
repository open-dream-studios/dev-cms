// server/handlers/modules/products/products_controllers.js
import {
  deleteProductsFunction,
  getProductsFunction,
  upsertProductsFunction,
} from "./products_repositories.js";

// ---------- PRODUCT CONTROLLERS ----------
export const getProducts = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const products = await getProductsFunction(project_idx);
  return { success: true, products };
};

export const upsertProducts = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  const { products } = req.body;
  if (!project_idx) throw new Error("Missing project_idx");
  if (!products || !Array.isArray(products) || products.length === 0)
    throw new Error("Missing required fields");
  return await upsertProductsFunction(connection, project_idx, products);
};

export const deleteProducts = async (req, res, connection) => {
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
