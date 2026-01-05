// server/util/verifyWixRequest.ts
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const ALLOWED_DOMAINS = [
  "https://tannyspaacquisitions.com",
  "https://www.tannyspaacquisitions.com",
];

/**
 * Build the canonical payload used for signature verification.
 * - GET: sorted query string
 * - POST/PUT: JSON body
 */
function getSignedPayload(req: Request): string {
  if (req.method === "GET") {
    const params = new URLSearchParams(req.query as any);
    params.sort();
    return params.toString(); // e.g. "date=2026-01-05"
  }

  return JSON.stringify(req.body ?? {});
}

/**
 * Verify incoming Wix backend requests
 */
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
  if (
    typeof sourceDomain !== "string" ||
    !ALLOWED_DOMAINS.includes(sourceDomain)
  ) {
    return res.status(403).json({ error: "Invalid source domain" });
  }

  // ---- 3. TIMESTAMP CHECK ----
  const rawTimestamp = req.headers["x-timestamp"];
  if (!rawTimestamp) {
    return res.status(401).json({ error: "Missing timestamp" });
  }

  const timestamp =
    typeof rawTimestamp === "string"
      ? Number(rawTimestamp) || Date.parse(rawTimestamp)
      : NaN;

  if (!timestamp || isNaN(timestamp)) {
    return res.status(401).json({ error: "Invalid timestamp" });
  }

  const now = Date.now();
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    return res.status(401).json({ error: "Request expired" });
  }

  // ---- 4. SIGNATURE CHECK ----
  const signature = req.headers["x-signature"];
  if (typeof signature !== "string") {
    return res.status(401).json({ error: "Missing signature" });
  }

  const payload = getSignedPayload(req);

  const expected = crypto
    .createHmac("sha256", process.env.PUBLIC_API_KEY!)
    .update(payload + timestamp)
    .digest("hex");

  if (signature !== expected) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}

/**
 * Extract normalized project domain from Wix request
 */
export function getProjectDomainFromWixRequest(req: Request): string {
  const domain = req.headers["x-source-domain"];
  if (typeof domain !== "string") {
    throw new Error("Missing or invalid source domain");
  }

  return domain.toLowerCase().replace(/\/$/, "");
}
