# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `frontend/` directory:

```bash
cd frontend

npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Start production server
```

There is no test suite configured.

## Environment

Create `frontend/.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The API client defaults to `http://localhost:8000` and logs a warning if `NEXT_PUBLIC_API_URL` is unset.

## Architecture

### Project Layout

The frontend lives entirely under `frontend/`. The root of the repo is just a container.

```
frontend/
  app/              # Next.js App Router pages and layouts (Server Components by default)
  components/       # Domain-specific shared components (Header, Cart, ProductGrid, etc.)
  components/ui/    # Shadcn UI primitive components — no business logic here
  components/checkout/  # Checkout flow sub-components (ShippingForm, PaymentMethod, OrderSummary)
  lib/api/
    client.ts       # Thin fetch wrapper — handles base URL, auth header, ApiResponse envelope
    types.ts        # TypeScript interfaces mirroring FastAPI/Pydantic models
    services/       # Direct API calls (products, auth, orders, favorites, users, etc.)
    actions/        # Next.js Server Actions that wrap services (run on server, called from client)
  lib/pkce.ts       # PKCE utilities for OAuth 2.0 flow
  lib/utils.ts      # `cn()` helper (clsx + tailwind-merge)
  store/
    authStore.ts    # Zustand store — user, tokens, role; persisted as "auth-storage"
    cartStore.ts    # Zustand store — cart items, open state; persisted as "cart-storage"
```

### Data Flow

Pages/components call **Server Actions** (in `lib/api/actions/`), which call **services** (in `lib/api/services/`), which use the **API client** (`lib/api/client.ts`) to reach the FastAPI backend.

Server Actions return plain objects (never throw across the server/client boundary). Client components receive the result and call `useAuthStore().setSession()` or similar to update Zustand state.

### API Response Envelope

Every backend response follows this shape, typed as `ApiResponse<T>` in `lib/api/types.ts`:

```ts
{ ok: boolean; data: T | null; messages: string }
```

The HTTP client throws `ApiError` on `ok: false` or non-2xx status. Server Actions catch `ApiError` and return `{ ok: false, messages: error.messages }`. Always surface errors to users via `toast.error(result.messages)` (Sonner).

### Authentication

- Tokens (JWT access + refresh) are stored by `useAuthStore` via Zustand `persist` to `localStorage` key `"auth-storage"`.
- The API client reads `accessToken` from localStorage automatically on the client side.
- For server-side calls requiring auth, pass the token explicitly via `opts.token` to `api.*()`.
- OAuth uses PKCE: `lib/pkce.ts` generates challenge/verifier; `app/auth/callback/` handles the redirect.

### Conventions

- **Server Components by default.** Add `"use client"` only when the component uses hooks, browser APIs, or interactivity.
- **No `any`.** Always define interfaces/types for props, state, and API responses. Use types from `lib/api/types.ts`.
- **Shadcn UI first.** Use existing `components/ui/` primitives before building from scratch. Add new Shadcn components with `npx shadcn@latest add <component>` from the `frontend/` directory.
- **State mutations only through Zustand.** Never mutate store state directly.
- **Errors via Sonner.** Use `toast.error()` / `toast.success()` — never `alert()`.
- **`cn()` for dynamic classes.** Import from `@/lib/utils` and combine clsx + tailwind-merge safely.

### Styling

Tailwind CSS v4 via `@tailwindcss/postcss`. Dark mode is managed by `next-themes`. Aim for a premium feel: glassmorphism, subtle borders, dark backgrounds (`dark:bg-slate-950`), `hover:` and `transition-all` on interactive elements. Use GSAP for complex animations; `tw-animate-css` for CSS-based enter/exit transitions.

### Adding New API Endpoints

1. Add types to `lib/api/types.ts`.
2. Add the service method in the appropriate `lib/api/services/*.service.ts`.
3. If the call needs to run on the server (auth-gated or data-fetching on page load), wrap it in a Server Action in `lib/api/actions/*.actions.ts` with `"use server"` at the top.
4. Call the Server Action from the component; update Zustand if needed.
