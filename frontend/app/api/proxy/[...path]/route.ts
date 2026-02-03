/**
 * Backend Proxy API Route
 *
 * Proxies authenticated requests from the frontend to the FastAPI backend.
 * This route runs server-side where it can read HttpOnly cookies set by Better Auth,
 * then forwards them to the backend for authentication.
 *
 * This solves the problem where client-side JavaScript cannot read HttpOnly cookies
 * (document.cookie returns empty for HttpOnly cookies).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyRequest(request: NextRequest, path: string[]) {
  try {
    // Construct target URL from path segments
    const pathname = "/" + path.join("/");
    const url = new URL(request.url);
    const queryString = url.search;
    const targetUrl = `${BACKEND_URL}${pathname}${queryString}`;

    // Get all cookies from the request (includes HttpOnly Better Auth session cookies)
    const cookieHeader = request.headers.get("cookie");

    // Prepare headers for backend request
    const headers: Record<string, string> = {};

    const contentType = request.headers.get("Content-Type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    // Forward the session cookie to backend if present
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    // Get request body for non-GET requests
    let body: BodyInit | undefined = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const clonedRequest = request.clone();
      const textBody = await clonedRequest.text();
      if (textBody) {
        body = textBody;
      }
    }

    // Make the request to the backend
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // Get the response data
    const responseData = await response.text();

    // Return the response with appropriate status
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[PROXY] Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}
