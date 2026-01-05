// server/util/verifyWixRequest
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const ALLOWED_DOMAINS = [
  "https://tannyspaacquisitions.com",
  "https://www.tannyspaacquisitions.com",
];

export function verifyWixRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // ---- 1. API KEY CHECK ----
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.PUBLIC_API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ---- 2. DOMAIN CHECK ----
  const sourceDomain = req.headers["x-source-domain"];
  if (!sourceDomain || !ALLOWED_DOMAINS.includes(sourceDomain as string)) {
    return res.status(403).json({ error: "Invalid source domain" });
  }

  // ---- 3. TIMESTAMP CHECK (THIS IS WHERE IT GOES) ----
  const timestamp = req.headers["x-timestamp"];
  if (!timestamp) {
    return res.status(401).json({ error: "Missing timestamp" });
  }

  const now = Date.now();
  if (Math.abs(now - Number(timestamp)) > 5 * 60 * 1000) {
    return res.status(401).json({ error: "Request expired" });
  }

  // ---- 4. SIGNATURE CHECK ----
  const signature = req.headers["x-signature"];
  if (!signature) {
    return res.status(401).json({ error: "Missing signature" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.PUBLIC_API_KEY!)
    .update(JSON.stringify(req.body) + timestamp)
    .digest("hex");

  if (signature !== expected) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}

export function getProjectDomainFromWixRequest(req: Request): string {
  const domain = req.headers["x-source-domain"];
  if (typeof domain !== "string") {
    throw new Error("Missing or invalid source domain");
  }
  return domain.toLowerCase().replace(/\/$/, "");
}
