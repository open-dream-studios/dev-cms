// utils/withTransaction.js
import { db } from "../connection/connect.js";
import { asyncHandler } from "./asyncHandler.js";

export const withTransaction = (fn) =>
  asyncHandler(async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();
      const result = await fn(req, res, connection);
      await connection.commit();
      res.json(result);
    } catch (err) {
      await connection.rollback();
      throw err;  
    } finally {
      connection.release();
    }
  });