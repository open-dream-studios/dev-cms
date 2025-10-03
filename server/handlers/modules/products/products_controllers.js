// server/handlers/modules/products/products_controllers.js
import { db } from "../../../connection/connect.js";

// ---------- PRODUCT CONTROLLERS ----------
export const getProducts = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const products = await getProductsFunction(project_idx);
  return res.json({ products });
};

export const upsertProducts = async (req, res) => {
  const project_idx = req.user?.project_idx;
  const { products } = req.body;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json("Missing products");
  }
  const { productIds, success } = await upsertProductsFunction(
    project_idx,
    products
  );
  return res.status(success ? 200 : 500).json({ success, productIds });
};

export const deleteProducts = async (req, res) => {
  const { serial_numbers } = req.body;
  const project_idx = req.user?.project_idx;
  if (
    !project_idx ||
    !serial_numbers ||
    !Array.isArray(serial_numbers) ||
    serial_numbers.length === 0
  ) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteProductsFunction(project_idx, serial_numbers);
  return res.status(success ? 200 : 500).json({ success });
};
