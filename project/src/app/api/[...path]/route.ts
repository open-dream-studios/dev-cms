// src/app/api/[...path]/route.ts
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
  };

  const cookie = req.headers.get("cookie");
  if (cookie) headers.cookie = cookie;

  const axiosConfig = {
    method: req.method,
    url: `${BACKEND_URL}/api${path}`,
    headers,
    withCredentials: true,
    data:
      req.method !== "GET"
        ? await req.json().catch(() => undefined)
        : undefined,
  };
  try {
    const response = await axios(axiosConfig);

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const nextResponse = NextResponse.json(response.data, {
      status: response.status,
    });

    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach((cookie) => {
          nextResponse.headers.append("set-cookie", cookie);
        });
      } else {
        nextResponse.headers.set("set-cookie", setCookie);
      }
    }

    return nextResponse;
  } catch (err: any) {
    if (err.response) {
      return NextResponse.json(err.response.data, {
        status: err.response.status,
      });
    }
    throw err;
  }
}

export async function GET(req: NextRequest) {
  return proxy(req);
}
export async function POST(req: NextRequest) {
  return proxy(req);
}
export async function PUT(req: NextRequest) {
  return proxy(req);
}
export async function DELETE(req: NextRequest) {
  return proxy(req);
}
