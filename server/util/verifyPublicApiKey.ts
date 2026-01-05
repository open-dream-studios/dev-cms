// server/util/verifyPublicApiKey
import type { Request, Response, NextFunction } from "express";

export function verifyPublicApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;

  if (!auth || auth !== `Bearer ${process.env.PUBLIC_API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
