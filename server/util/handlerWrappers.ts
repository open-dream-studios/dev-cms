// server/util/handlerWrappers.ts
import type { Request, Response, NextFunction } from "express";
import type { PoolConnection } from "mysql2/promise";
import { db } from "../connection/connect.js";

type ControllerReturn = any | void;

type ControllerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<ControllerReturn>;

type TransactionFn = (
  req: Request,
  res: Response,
  connection: PoolConnection
) => Promise<any>;

export const errorHandler = (fn: ControllerFn) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const functionName = fn.name || "anonymous";
    try {
      const result = await fn(req, res, next);
      if (result !== undefined) res.json(result);
    } catch (err: any) {
      console.error(`❌ Error in ${functionName}:`, err.message);
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: `Error in ${functionName}`,
      });
    }
  };
};

export const transactionHandler = (fn: TransactionFn) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const connection = await db.promise().getConnection();
    const functionName = fn.name || "anonymous";
    try {
      await connection.beginTransaction();
      const result = await fn(req, res, connection);
      await connection.commit();

      if (result?.cookies) {
        result.cookies.forEach(
          ({
            name,
            value,
            options,
          }: {
            name: string;
            value: string;
            options: any;
          }) => {
            res.cookie(name, value, options);
          }
        );
      }
      const { cookies, ...body } = result || {};

      return res.json(body);
    } catch (err: any) {
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
