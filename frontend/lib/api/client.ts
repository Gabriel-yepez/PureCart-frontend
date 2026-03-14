// ============================================================================
// PureCart HTTP Client - Centralizes all communication with the FastAPI backend
// ============================================================================
// This module provides a thin, type-safe wrapper over `fetch` that:
//   1. Prepends the backend base URL automatically.
//   2. Sends & parses JSON + the standard ApiResponse envelope.
//   3. Injects the Authorization header when a token is available.
//   4. Works seamlessly in **Server Components**, **Server Actions** and the browser.
// ============================================================================

import type { ApiResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

// ─── Token helpers (client-side only) ───────────────────────────────────────
// On the server side we receive tokens explicitly; on the client we fall back
// to localStorage (managed by the auth store via Zustand-persist).

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

// ─── Generic request helper ─────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Pass an explicit token (useful from Server Actions / middleware) */
  token?: string;
  /** If true, skip parsing JSON (e.g. 204 No Content) */
  rawResponse?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public messages: string,
    public data: unknown = null,
  ) {
    super(messages);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, token, rawResponse, headers: extraHeaders, ...fetchOptions } = options;

  const resolvedToken = token ?? getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (e.g. logout, delete)
  if (response.status === 204 || rawResponse) {
    return { ok: true, data: null as T, messages: "Success" };
  }

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.ok) {
    throw new ApiError(
      response.status,
      json.messages || `Request failed with status ${response.status}`,
      json.data,
    );
  }

  return json;
}

// ─── Public HTTP verbs ──────────────────────────────────────────────────────

export const api = {
  get<T>(endpoint: string, opts?: RequestOptions) {
    return request<T>(endpoint, { ...opts, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(endpoint, { ...opts, method: "POST", body });
  },

  put<T>(endpoint: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(endpoint, { ...opts, method: "PUT", body });
  },

  patch<T>(endpoint: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(endpoint, { ...opts, method: "PATCH", body });
  },

  delete<T>(endpoint: string, opts?: RequestOptions) {
    return request<T>(endpoint, { ...opts, method: "DELETE", rawResponse: true });
  },
} as const;
