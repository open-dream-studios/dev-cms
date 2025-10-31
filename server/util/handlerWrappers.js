// server/util/handlerWrappers
import { db } from "../connection/connect.js";

/**
 * Logs and catches controller errors.
 * Provides the function name automatically.
 */
export const errorHandler = (fn) => {
  return async (req, res, next) => {
    const functionName = fn.name || "anonymous";
    try {
      const result = await fn(req, res, next);
      if (result !== undefined) res.json(result);
    } catch (err) {
      console.error(`❌ Error in ${functionName}:`, err.message);
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: `Error in ${functionName}`,
      });
    }
  };
};

/**
 * Wraps a controller function in a MySQL transaction.
 * Automatically commits/rolls back and logs errors with function name.
 */
export const transactionHandler = (fn) => {
  return async (req, res, next) => {
    const connection = await db.promise().getConnection();
    const functionName = fn.name || "anonymous";
    try {
      await connection.beginTransaction();
      const result = await fn(req, res, connection);
      await connection.commit();

      if (result?.cookies) {
        result.cookies.forEach(({ name, value, options }) => {
          res.cookie(name, value, options);
        });
      }
      const { cookies, ...body } = result || {};

      return res.json(body);
    } catch (err) {
      await connection.rollback();
      console.error(`❌ Transaction failed in ${functionName}:`, err.message);
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: `Transaction failed in ${functionName}`,
      });
    } finally {
      connection.release();
    }
  };
};
