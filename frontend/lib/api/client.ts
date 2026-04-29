// frontend/lib/api/client.ts
import type { ApiResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

if (typeof window === "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "[PureCart API Client] ⚠️  NEXT_PUBLIC_API_URL is not set — defaulting to http://localhost:8000. " +
      "This will fail in production (Vercel). Set this env var in your deployment environment.",
  );
}

async function resolveToken(explicitToken?: string): Promise<string | null> {
  if (explicitToken) return explicitToken;
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    return (await cookies()).get("pca-access")?.value ?? null;
  }
  return null;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
  rawResponse?: boolean;
  nextOptions?: NextFetchRequestConfig;
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
  const { body, token, rawResponse, nextOptions, headers: extraHeaders, ...fetchOptions } = options;

  const resolvedToken = await resolveToken(token);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      next: nextOptions,
    });
  } catch (networkError) {
    const reason =
      networkError instanceof Error ? networkError.message : String(networkError);
    console.error(`[PureCart API] Network error fetching ${url}: ${reason}`);
    throw new ApiError(
      0,
      `Cannot reach API server at ${API_BASE_URL}. ${reason}`,
    );
  }

  if (response.status === 204 || rawResponse) {
    return { ok: true, data: null as T, messages: "Success" };
  }

  const json = await response.json();

  if (!response.ok || !json.ok) {
    const errorMessage =
      json.messages || json.detail || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMessage, json.data ?? null);
  }

  return json as ApiResponse<T>;
}

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
