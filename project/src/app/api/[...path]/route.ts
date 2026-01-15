// src/app/api/[...path]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

if (!process.env.BACKEND_URL) {
  throw new Error("BACKEND_URL is not defined");
}
if (!process.env.INTERNAL_PROXY_SECRET) {
  throw new Error("INTERNAL_PROXY_SECRET is not defined");
}

const BACKEND_URL = process.env.BACKEND_URL!;
const PROXY_SECRET = process.env.INTERNAL_PROXY_SECRET!;
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);

async function proxy(req: NextRequest) {
  if (!ALLOWED_METHODS.has(req.method)) {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const path = req.nextUrl.pathname.replace("/api", "");

  const headers: Record<string, string> = {
    "x-vercel-proxy-secret": PROXY_SECRET,
    "x-project-domain": req.headers.get("host") || "",
  };

  const cookie = req.headers.get("cookie");
  if (cookie) headers.cookie = cookie;

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers["content-type"] = contentType;
  }

  const isMultipart =
    !!contentType && contentType.includes("multipart/form-data");

  if (isMultipart) {
    const backendResponse = await fetch(`${BACKEND_URL}/api${path}`, {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : req.body,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: backendResponse.headers,
    });
  }

  // ✅ JSON / NON-MULTIPART
  const response = await axios({
    method: req.method,
    url: `${BACKEND_URL}/api${path}`,
    headers,
    withCredentials: true,
    data:
      req.method !== "GET"
        ? await req.json().catch(() => undefined)
        : undefined,
  });

  const nextResponse = NextResponse.json(response.data, {
    status: response.status,
  });

  const setCookie = response.headers["set-cookie"];
  if (setCookie) {
    (Array.isArray(setCookie) ? setCookie : [setCookie]).forEach((c) =>
      nextResponse.headers.append("set-cookie", c)
    );
  }

  return nextResponse;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
