// server/util/roles.js
import type { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2/promise";
export const adminEmail = "opendreamstudios@gmail.com";
import { db } from "../connection/connect.js";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const email = req.user?.email;
  if (!email) {
    res.status(403).json("Admins only");
    return;
  }
  const q = "SELECT * FROM users WHERE email = ?";
  const [rows] = await db.promise().query<RowDataPacket[]>(q, [email]);
  const user = rows.length ? rows[0] : null;
  if (!user || user.admin === 0) {
    res.status(403).json("Admins only");
    return;
  }
  next();
};
