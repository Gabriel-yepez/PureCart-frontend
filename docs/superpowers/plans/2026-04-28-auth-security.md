# Auth Security — JWT to HttpOnly Cookies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate JWT storage from `localStorage` to HttpOnly cookies to eliminate XSS token theft vulnerability.

**Architecture:** Auth Server Actions set `pca-access` (15 min) and `pca-refresh` (7 days) HttpOnly cookies after login. `client.ts` resolves the token from the cookie on the server side instead of reading `localStorage`. Client components stop passing `accessToken` as a parameter — all authenticated calls go through Server Actions that read the cookie automatically.

**Tech Stack:** Next.js 16 App Router, `next/headers` cookies API, Zustand, TypeScript.

---

## File Map

| File | Action | Change |
|------|--------|--------|
| `frontend/lib/api/client.ts` | Modify | Replace `getAccessToken()` with async `resolveToken()` that reads HttpOnly cookie server-side; add `nextOptions` to `RequestOptions` |
| `frontend/lib/api/actions/auth.actions.ts` | Modify | Set `pca-access` + `pca-refresh` cookies after login; change return type to remove `tokens`; add `logoutAction` |
| `frontend/store/authStore.ts` | Modify | Remove `accessToken` + `refreshToken` fields; update `setSession` signature to `(user, role)` |
| `frontend/app/signin/page.tsx` | Modify | Call `setSession(result.user, result.role)` instead of `setSession(result.tokens, result.user)` |
| `frontend/app/signup/page.tsx` | Modify | Same as signin |
| `frontend/app/auth/callback/AuthCallbackClient.tsx` | Modify | Same as signin |
| `frontend/lib/api/actions/favorites.actions.ts` | Modify | Remove `token` parameter from all three functions |
| `frontend/lib/api/actions/orders.actions.ts` | Modify | Remove `token` parameter from `createOrderAction`, `getMyOrdersAction`, `getOrderByIdAction`, `cancelOrderAction` |
| `frontend/components/Header.tsx` | Modify | Call `logoutAction()` + `logout()` on sign-out |
| `frontend/components/ProductGrid.tsx` | Modify | Remove `accessToken` from `getFavoritesAction`, `addFavoriteAction`, `removeFavoriteAction` calls |
| `frontend/app/product/[id]/ProductDetail.tsx` | Modify | Same as ProductGrid |
| `frontend/app/favorites/page.tsx` | Modify | Remove `accessToken` from action calls |
| `frontend/app/orders/page.tsx` | Modify | Remove `accessToken` from action calls |

---

## Task 1: Update `client.ts` — async token resolution from cookie

**Files:**
- Modify: `frontend/lib/api/client.ts`

- [ ] **Step 1: Replace `getAccessToken` with async `resolveToken` and add `nextOptions`**

Replace the entire file content:

```typescript
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
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api/client.ts
git commit -m "refactor(client): resolve token from HttpOnly cookie server-side"
```

---

## Task 2: Update `auth.actions.ts` — set cookies, add `logoutAction`

**Files:**
- Modify: `frontend/lib/api/actions/auth.actions.ts`

- [ ] **Step 1: Replace file content**

```typescript
// frontend/lib/api/actions/auth.actions.ts
"use server";

import { cookies } from "next/headers";
import { authService } from "../services";
import { usersService } from "../services";
import { ApiError } from "../client";
import type { User } from "../types";

export interface AuthActionResult {
  ok: boolean;
  messages: string;
  user?: User;
  role?: string;
}

const COOKIE_OPTS_ACCESS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 15,
};

const COOKIE_OPTS_REFRESH = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const store = await cookies();
  store.set("pca-access", accessToken, COOKIE_OPTS_ACCESS);
  store.set("pca-refresh", refreshToken, COOKIE_OPTS_REFRESH);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete("pca-access");
  store.delete("pca-refresh");
}

export async function loginAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.login({ email, password });
    const tokens = tokenRes.data!;
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: tokenRes.messages,
      user: userRes.data ?? undefined,
      role: tokens.role,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[loginAction]", detail);
    return { ok: false, messages: `Login failed: ${detail}` };
  }
}

export async function registerAction(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.register({
      email,
      password,
      full_name: fullName,
      role: "customer",
    });
    const tokens = tokenRes.data!;
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: tokenRes.messages,
      user: userRes.data ?? undefined,
      role: tokens.role,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[registerAction]", detail);
    return { ok: false, messages: `Registration failed: ${detail}` };
  }
}

export async function refreshTokenAction(
  refreshToken: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.refresh(refreshToken);
    const tokens = tokenRes.data!;
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: "Token refreshed",
      user: userRes.data ?? undefined,
      role: tokens.role,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[refreshTokenAction]", detail);
    return { ok: false, messages: `Session refresh failed: ${detail}` };
  }
}

export async function getOAuthUrlAction(
  provider: "google" | "facebook" | "twitter",
  codeChallenge: string,
): Promise<{ ok: boolean; url?: string; messages: string }> {
  try {
    const res = await authService.getOAuthUrl(provider, codeChallenge);
    return { ok: true, url: res.data?.url, messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getOAuthUrlAction]", detail);
    return { ok: false, messages: `OAuth URL failed: ${detail}` };
  }
}

export async function exchangeOAuthCodeAction(
  code: string,
  codeVerifier: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.exchangeOAuthCode(code, codeVerifier);
    const tokens = tokenRes.data!;
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: tokenRes.messages,
      user: userRes.data ?? undefined,
      role: tokens.role,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[exchangeOAuthCodeAction]", detail);
    return { ok: false, messages: `OAuth exchange failed: ${detail}` };
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: TypeScript errors on signin/signup/callback (they still use old `result.tokens`). That's expected — we fix them in Task 4.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api/actions/auth.actions.ts
git commit -m "feat(auth): set HttpOnly pca-access/pca-refresh cookies on login"
```

---

## Task 3: Update `authStore.ts` — remove token fields

**Files:**
- Modify: `frontend/store/authStore.ts`

- [ ] **Step 1: Replace file content**

```typescript
// frontend/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/api/types';

interface AuthState {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  setSession: (user: User, role: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      setSession: (user, role) => set({ user, role, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, role: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

- [ ] **Step 2: Verify lint passes**

```bash
cd frontend && npm run lint
```

Expected: TypeScript errors on signin/signup/callback (old `setSession` call signature). Expected — fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add frontend/store/authStore.ts
git commit -m "refactor(store): remove token fields from authStore, simplify setSession"
```

---

## Task 4: Update auth pages to use new `setSession(user, role)` signature

**Files:**
- Modify: `frontend/app/signin/page.tsx`
- Modify: `frontend/app/signup/page.tsx`
- Modify: `frontend/app/auth/callback/AuthCallbackClient.tsx`

- [ ] **Step 1: Update `signin/page.tsx`**

In `onSubmit`, change:
```typescript
// BEFORE
if (result.ok && result.tokens && result.user) {
  setSession(result.tokens, result.user);
  toast.success("Signed in successfully!");
  router.push("/");
} else {
  toast.error(result.messages || "Login failed");
}

// AFTER
if (result.ok && result.user && result.role) {
  setSession(result.user, result.role);
  toast.success("Signed in successfully!");
  router.push("/");
} else {
  toast.error(result.messages || "Login failed");
}
```

- [ ] **Step 2: Update `signup/page.tsx`**

In `onSubmit`, change:
```typescript
// BEFORE
if (result.ok && result.tokens && result.user) {
  setSession(result.tokens, result.user);
  toast.success("Account created successfully!");
  router.push("/");
} else {
  toast.error(result.messages || "Registration failed");
}

// AFTER
if (result.ok && result.user && result.role) {
  setSession(result.user, result.role);
  toast.success("Account created successfully!");
  router.push("/");
} else {
  toast.error(result.messages || "Registration failed");
}
```

- [ ] **Step 3: Update `auth/callback/AuthCallbackClient.tsx`**

Open the file and find the `exchangeOAuthCodeAction` call. Update the result handling:
```typescript
// BEFORE (pattern)
if (result.ok && result.tokens && result.user) {
  setSession(result.tokens, result.user);

// AFTER
if (result.ok && result.user && result.role) {
  setSession(result.user, result.role);
```

- [ ] **Step 4: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: No TypeScript errors on the auth pages.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/signin/page.tsx frontend/app/signup/page.tsx frontend/app/auth/callback/AuthCallbackClient.tsx
git commit -m "refactor(auth-pages): update setSession call to new (user, role) signature"
```

---

## Task 5: Update `favorites.actions.ts` — remove token parameter

**Files:**
- Modify: `frontend/lib/api/actions/favorites.actions.ts`

- [ ] **Step 1: Replace file content**

```typescript
// frontend/lib/api/actions/favorites.actions.ts
"use server";

import { favoritesService } from "../services";
import { ApiError } from "../client";
import type { Favorite } from "../types";

export async function getFavoritesAction(): Promise<{
  ok: boolean;
  favorites: Favorite[];
  messages: string;
}> {
  try {
    const res = await favoritesService.getAll();
    return { ok: true, favorites: res.data ?? [], messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, favorites: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getFavoritesAction]", detail);
    return { ok: false, favorites: [], messages: `Failed to load favorites: ${detail}` };
  }
}

export async function addFavoriteAction(
  productId: string,
): Promise<{ ok: boolean; messages: string }> {
  try {
    const res = await favoritesService.add(productId);
    return { ok: true, messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[addFavoriteAction]", detail);
    return { ok: false, messages: `Failed to add to favorites: ${detail}` };
  }
}

export async function removeFavoriteAction(
  productId: string,
): Promise<{ ok: boolean; messages: string }> {
  try {
    await favoritesService.remove(productId);
    return { ok: true, messages: "Removed from favorites" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[removeFavoriteAction]", detail);
    return { ok: false, messages: `Failed to remove from favorites: ${detail}` };
  }
}
```

- [ ] **Step 2: Verify lint**

```bash
cd frontend && npm run lint
```

Expected: Errors in ProductGrid, ProductDetail, FavoritesPage (old call signatures). Expected — fixed in Task 7.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api/actions/favorites.actions.ts
git commit -m "refactor(favorites): remove token parameter, cookie resolved automatically"
```

---

## Task 6: Update `orders.actions.ts` — remove token parameter

**Files:**
- Modify: `frontend/lib/api/actions/orders.actions.ts`

- [ ] **Step 1: Replace file content**

```typescript
// frontend/lib/api/actions/orders.actions.ts
"use server";

import { ordersService } from "../services";
import { paymentMethodsService } from "../services";
import { ApiError } from "../client";
import type { Order, OrderCreate, OrderSummary, PaymentMethod } from "../types";

export interface OrderResult {
  ok: boolean;
  order: Order | null;
  messages: string;
}

export async function createOrderAction(data: OrderCreate): Promise<OrderResult> {
  try {
    const res = await ordersService.create(data);
    return { ok: true, order: res.data ?? null, messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, order: null, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[createOrderAction]", detail);
    return { ok: false, order: null, messages: `Failed to create order: ${detail}` };
  }
}

export async function getMyOrdersAction(): Promise<{
  ok: boolean;
  orders: OrderSummary[];
  messages: string;
}> {
  try {
    const res = await ordersService.listMine();
    return { ok: true, orders: res.data ?? [], messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, orders: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getMyOrdersAction]", detail);
    return { ok: false, orders: [], messages: `Failed to load orders: ${detail}` };
  }
}

export async function getOrderByIdAction(orderId: string): Promise<OrderResult> {
  try {
    const res = await ordersService.getById(orderId);
    return { ok: true, order: res.data ?? null, messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, order: null, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getOrderByIdAction]", detail);
    return { ok: false, order: null, messages: `Failed to load order: ${detail}` };
  }
}

export async function cancelOrderAction(orderId: string): Promise<OrderResult> {
  try {
    const res = await ordersService.cancel(orderId);
    return { ok: true, order: res.data ?? null, messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, order: null, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[cancelOrderAction]", detail);
    return { ok: false, order: null, messages: `Failed to cancel order: ${detail}` };
  }
}

export async function getPaymentMethodsAction(): Promise<{
  ok: boolean;
  methods: PaymentMethod[];
  messages: string;
}> {
  try {
    const res = await paymentMethodsService.list();
    return { ok: true, methods: res.data ?? [], messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, methods: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getPaymentMethodsAction]", detail);
    return { ok: false, methods: [], messages: `Failed to load payment methods: ${detail}` };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/lib/api/actions/orders.actions.ts
git commit -m "refactor(orders): remove token parameter from order actions"
```

---

## Task 7: Update Header — call `logoutAction` on sign-out

**Files:**
- Modify: `frontend/components/Header.tsx`

- [ ] **Step 1: Import `logoutAction`**

At the top of `Header.tsx`, add to the existing import from `@/lib/api/actions`:
```typescript
import { logoutAction } from "@/lib/api/actions";
```

- [ ] **Step 2: Update the logout click handler**

Find the dropdown menu logout item and the mobile logout button. Replace:
```typescript
// BEFORE (desktop dropdown)
<DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
  Log out
</DropdownMenuItem>

// AFTER
<DropdownMenuItem
  onClick={async () => {
    await logoutAction();
    logout();
  }}
  className="text-red-600 focus:text-red-600"
>
  Log out
</DropdownMenuItem>
```

```typescript
// BEFORE (mobile)
<Button variant="outline" className="flex-1" onClick={() => logout()}>
  Log out
</Button>

// AFTER
<Button
  variant="outline"
  className="flex-1"
  onClick={async () => {
    await logoutAction();
    logout();
  }}
>
  Log out
</Button>
```

- [ ] **Step 3: Verify build passes**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/Header.tsx
git commit -m "feat(header): call logoutAction to clear HttpOnly cookies on sign-out"
```

---

## Task 8: Update component call sites — remove `accessToken` from action calls

**Files:**
- Modify: `frontend/components/ProductGrid.tsx`
- Modify: `frontend/app/product/[id]/ProductDetail.tsx`
- Modify: `frontend/app/favorites/page.tsx`
- Modify: `frontend/app/orders/page.tsx`

- [ ] **Step 1: Update `ProductGrid.tsx`**

Remove `accessToken` from the `useAuthStore` destructure:
```typescript
// BEFORE
const { isAuthenticated, accessToken } = useAuthStore();

// AFTER
const { isAuthenticated } = useAuthStore();
```

Update `loadFavs` in the favorites `useEffect`:
```typescript
// BEFORE
const result = await getFavoritesAction(accessToken!);

// AFTER
const result = await getFavoritesAction();
```

Update `handleToggleFavorite`:
```typescript
// BEFORE
if (!isAuthenticated || !accessToken) {
  toast.error("Inicia sesión para agregar favoritos");
  return;
}
// ...
const result = await removeFavoriteAction(productId, accessToken);
// ...
const result = await addFavoriteAction(productId, accessToken);

// AFTER
if (!isAuthenticated) {
  toast.error("Inicia sesión para agregar favoritos");
  return;
}
// ...
const result = await removeFavoriteAction(productId);
// ...
const result = await addFavoriteAction(productId);
```

Also remove `accessToken` from the favorites `useEffect` dependency array:
```typescript
// BEFORE
}, [isAuthenticated, accessToken]);

// AFTER
}, [isAuthenticated]);
```

- [ ] **Step 2: Update `ProductDetail.tsx`**

Remove `accessToken` from destructure:
```typescript
// BEFORE
const { isAuthenticated, accessToken } = useAuthStore();

// AFTER
const { isAuthenticated } = useAuthStore();
```

Update `loadFav` in `useEffect`:
```typescript
// BEFORE
const result = await getFavoritesAction(accessToken!);
// ...
}, [isAuthenticated, accessToken, product.id]);

// AFTER
const result = await getFavoritesAction();
// ...
}, [isAuthenticated, product.id]);
```

Update `handleToggleFavorite`:
```typescript
// BEFORE
if (!isAuthenticated || !accessToken) {
  toast.error("Sign in to add favorites");
  return;
}
// ...
const result = await removeFavoriteAction(product.id, accessToken);
// ...
const result = await addFavoriteAction(product.id, accessToken);

// AFTER
if (!isAuthenticated) {
  toast.error("Sign in to add favorites");
  return;
}
// ...
const result = await removeFavoriteAction(product.id);
// ...
const result = await addFavoriteAction(product.id);
```

- [ ] **Step 3: Update `favorites/page.tsx`**

Remove `accessToken` from destructure:
```typescript
// BEFORE
const { isAuthenticated, accessToken } = useAuthStore();

// AFTER
const { isAuthenticated } = useAuthStore();
```

Update `load` function:
```typescript
// BEFORE
const result = await getFavoritesAction(accessToken);

// AFTER
const result = await getFavoritesAction();
```

Update `handleRemove`:
```typescript
// BEFORE
async function handleRemove(productId: string) {
  if (!accessToken) return;
  // ...
  const result = await removeFavoriteAction(productId, accessToken);

// AFTER
async function handleRemove(productId: string) {
  // ...
  const result = await removeFavoriteAction(productId);
```

- [ ] **Step 4: Update `orders/page.tsx`**

Remove `accessToken` from destructure:
```typescript
// BEFORE
const { isAuthenticated, accessToken } = useAuthStore();

// AFTER
const { isAuthenticated } = useAuthStore();
```

Update `load` function:
```typescript
// BEFORE
const result = await getMyOrdersAction(accessToken);

// AFTER
const result = await getMyOrdersAction();
```

Update `handleCancel`:
```typescript
// BEFORE
async function handleCancel(orderId: string) {
  if (!accessToken) return;
  // ...
  const result = await cancelOrderAction(orderId, accessToken);

// AFTER
async function handleCancel(orderId: string) {
  // ...
  const result = await cancelOrderAction(orderId);
```

- [ ] **Step 5: Check and update checkout OrderSummary if it passes token**

Open `frontend/components/checkout/OrderSummary.tsx`. If it calls `createOrderAction(data, accessToken)`, update to `createOrderAction(data)` and remove `accessToken` from props/store destructure.

- [ ] **Step 6: Full build verification**

```bash
cd frontend && npm run build
```

Expected: Clean build with zero TypeScript errors.

- [ ] **Step 7: Manual verification**

```bash
cd frontend && npm run dev
```

1. Open `http://localhost:3000`
2. Sign in — open DevTools → Application → Cookies → verify `pca-access` and `pca-refresh` are present with `HttpOnly` flag checked
3. Verify `localStorage["auth-storage"]` no longer contains `accessToken` or `refreshToken`
4. Navigate to `/favorites` — confirm favorites load correctly
5. Add/remove a favorite — confirm it works
6. Navigate to `/orders` — confirm orders load
7. Sign out — verify both cookies are deleted from DevTools

- [ ] **Step 8: Commit**

```bash
git add \
  frontend/components/ProductGrid.tsx \
  frontend/app/product/[id]/ProductDetail.tsx \
  frontend/app/favorites/page.tsx \
  frontend/app/orders/page.tsx \
  frontend/components/checkout/OrderSummary.tsx
git commit -m "refactor: remove accessToken from component call sites, use cookie-based auth"
```
