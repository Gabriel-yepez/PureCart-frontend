# PureCart Frontend — Performance & Foundation Improvements

**Date:** 2026-04-27  
**Scope:** Performance, Core Web Vitals, infrastructure stability  
**Priority order:** Foundation → Images → Bundle → Caching → SEO  
**Target:** Improve Lighthouse scores globally; fix structural issues found in code review  

---

## Context

PureCart is a Next.js 16 (App Router) e-commerce frontend deployed on Vercel. After a full code review the following systemic issues were identified that hurt Lighthouse scores and user experience:

- No `ThemeProvider` — dark mode non-functional in production
- Auth-gated pages use client-side `useEffect` redirect, causing flash of protected content and CLS
- `<img>` tags used everywhere — no WebP, no lazy loading, no CLS prevention
- Favorites data fetched independently in two components — redundant API calls
- No Next.js fetch cache on any server call — every request hits FastAPI cold
- GSAP (~100KB) used for simple CSS-level animations
- `mounted` anti-pattern on full pages — extra render cycle, hurts LCP and CLS
- `<a>` tags in Header nav — full page reloads instead of client-side navigation
- No `error.tsx`, `not-found.tsx`, `loading.tsx` — bare Next.js defaults
- No `generateMetadata` on dynamic routes — all products indexed with same title/description
- No `sitemap.ts` or `robots.ts`

---

## Section 1 — Foundation Layer

### 1.1 ThemeProvider

**Problem:** `next-themes` is installed but `ThemeProvider` is never added to `RootLayout`. Dark mode is broken in production.

**Fix:** Wrap `RootLayout` children with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` in `app/layout.tsx`.

### 1.2 Route Protection via `proxy.ts`

**Problem:** `checkout/page.tsx`, `favorites/page.tsx`, `orders/page.tsx`, and `profile/page.tsx` use `useEffect` to detect unauthenticated state and redirect. This runs on the client after hydration — causing a visible flash of protected content and layout shift.

**Fix:** Create `frontend/proxy.ts` (Next.js 16 convention — replaces `middleware.ts`) that intercepts protected routes before rendering.

**Auth cookie strategy:** Since tokens live in Zustand/localStorage (not accessible server-side), the auth Server Actions (`loginAction`, `registerAction`, `exchangeOAuthCodeAction`) will also call `cookies().set('pca-session', '1', { path: '/', sameSite: 'lax' })`. The `proxy.ts` reads this cookie as an optimistic auth signal. If someone forges the cookie without a valid JWT, the API will reject their requests anyway.

```ts
// frontend/proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/checkout', '/favorites', '/orders', '/profile']

export function proxy(req: NextRequest) {
  const isProtected = PROTECTED.some(p => req.nextUrl.pathname.startsWith(p))
  const hasSession = req.cookies.has('pca-session')

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone()
    const redirect = encodeURIComponent(req.nextUrl.pathname)
    url.pathname = '/signin'
    url.search = `?redirect=${redirect}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:png|ico|svg)$).*)'],
}
```

**Cookie cleanup:** `logout()` in `authStore` must also call a Server Action that does `cookies().delete('pca-session')`.

### 1.3 Error & Not-Found Pages

**Problem:** No `app/error.tsx` or `app/not-found.tsx`. Any unhandled error or missing route shows Next.js bare defaults.

**Fix:**
- `app/error.tsx` — Client component with `"use client"`, displays a friendly error message with a "Try again" button that calls `reset()` and a link back to home.
- `app/not-found.tsx` — Server component with CTA to browse products.

Both must follow PureCart's visual style (dark backgrounds, Tailwind, consistent with the rest of the app).

### 1.4 Loading Skeletons

**Problem:** Server-rendered pages (`/`, `/category/[slug]`, `/product/[id]`) show blank white until the server responds. No `loading.tsx` files exist.

**Fix:** Add `loading.tsx` at these levels:
- `app/loading.tsx` — global fallback skeleton
- `app/product/[id]/loading.tsx` — product detail skeleton (image + info columns)
- `app/category/[slug]/loading.tsx` — product grid skeleton (4-column card grid)

Skeletons use `animate-pulse` from Tailwind and match the exact layout dimensions of the real content to prevent CLS.

---

## Section 2 — Images & Media

### 2.1 Replace `<img>` with `next/image`

**Problem:** All product images use native `<img>` tags in `ProductGrid`, `ProductDetail`, and `FavoritesPage`. No WebP conversion, no automatic lazy loading, no built-in CLS prevention.

**`next.config.ts` is already configured** with `remotePatterns` for Supabase and Unsplash — no config changes needed.

**Fix:** Replace every `<img src={product.image_url}>` with `<Image src={...} fill alt={...} />` inside a `relative` container, or with explicit `width`/`height` where the layout allows.

For the `aspect-square` card layout, use `fill` + `object-cover`:

```tsx
<div className="relative aspect-square overflow-hidden">
  <Image
    src={product.image_url}
    alt={product.name}
    fill
    className="object-cover group-hover:scale-110 transition-transform duration-500"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  />
</div>
```

### 2.2 `sizes` Prop for Responsive Loading

**Problem:** Without `sizes`, the browser downloads the largest image variant regardless of viewport. On mobile, a 4-column grid card image is downloaded at desktop resolution.

**Fix per context:**
- Product grid cards: `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"`
- Product detail hero: `sizes="(max-width: 1024px) 100vw, 50vw"`
- Favorites grid: same as product grid cards

### 2.3 `priority` on LCP Image

**Problem:** No image has `priority`, so all images are lazy-loaded including the first visible one, hurting LCP.

**Fix:** Add `priority` prop to:
- The Hero section's main visual (if it has an image)
- The first product card in `ProductGrid` when `index === 0`

```tsx
<Image ... priority={index === 0} />
```

---

## Section 3 — Data & Caching

### 3.1 Centralize Favorites in Zustand

**Problem:** `ProductGrid` and `ProductDetail` independently call `getFavoritesAction` on mount. Two separate round-trips to the backend for identical data.

**Fix:** Create `frontend/store/favoritesStore.ts` following the same pattern as `cartStore`:

```ts
interface FavoritesState {
  ids: Set<string>
  loaded: boolean
  load: (token: string) => Promise<void>
  add: (productId: string, token: string) => Promise<void>
  remove: (productId: string, token: string) => Promise<void>
}
```

- `load()` calls `getFavoritesAction` and populates `ids`. Sets `loaded = true`.
- `add()` / `remove()` call the respective actions and update `ids` optimistically.
- Components read `ids` from the store — no local fetch.
- The store is initialized once when the user authenticates (in `Header` or an `AuthProvider`).

### 3.2 Next.js Fetch Cache on Public Data

**Problem:** `api.get()` in `client.ts` calls `fetch` with no cache options. Every SSR render of the home page and category pages makes a cold request to FastAPI.

**Fix:** Extend `RequestOptions` in `client.ts` with `nextOptions?: NextFetchRequestConfig` and pass it to `fetch`:

```ts
const response = await fetch(url, {
  ...fetchOptions,
  headers,
  body: body ? JSON.stringify(body) : undefined,
  next: options.nextOptions,
})
```

Services that fetch public data add:
```ts
// products.service.ts
getProducts(filters?) {
  return api.get('/products', {
    nextOptions: { revalidate: 300, tags: ['products'] }
  })
}
```

Private data services (`favorites`, `orders`, `users`) use:
```ts
nextOptions: { revalidate: 0 }  // equivalent to cache: 'no-store'
```

### 3.3 Cache Invalidation on Mutations

**Problem:** When a user places an order, the products cache (stock levels, sales_count) on Vercel is stale until the `revalidate` timer expires.

**Fix:** Import `revalidateTag` from `next/cache` and call it in the order creation Server Action:

```ts
import { revalidateTag } from 'next/cache'

export async function createOrderAction(...) {
  const result = await ordersService.create(...)
  if (result.ok) {
    revalidateTag('products')
  }
  return result
}
```

---

## Section 4 — Bundle & Client Rendering

### 4.1 Remove `mounted` Anti-Pattern

**Problem:** `favorites/page.tsx` and `orders/page.tsx` are fully `"use client"` and gate all rendering behind `const [mounted, setMounted] = useState(false)`. This causes an extra render cycle and CLS because the page renders twice: once empty, once with real content.

**Fix:** Since `proxy.ts` now guarantees only authenticated users reach these routes, the `isAuthenticated` guard is redundant. The fix stays entirely within `"use client"` (the access token lives in localStorage — moving to Server Components would require a bigger auth refactor):

- Remove `const [mounted, setMounted] = useState(false)` and its `useEffect`
- Remove all `mounted &&` conditionals
- Remove the "not authenticated" empty state block — `proxy.ts` handles that redirect
- Keep `loading = true` as the initial state — the existing loading spinner covers the hydration window
- The `useEffect` that calls `getFavoritesAction` / `getMyOrdersAction` remains unchanged

This eliminates the double render and the blank intermediate state without changing the component's client architecture.

### 4.2 Replace GSAP with CSS Animations for Simple Cases

**Problem:** GSAP adds ~100KB to the JS bundle. It is currently used only for:
- `Header`: `gsap.from(logoRef, { opacity: 0, y: -20 })` — a simple fade-in
- `ProductGrid`: `gsap.from(cards, { opacity: 0, y: 50, stagger: 0.1 })` — scroll-triggered card entrance

`tw-animate-css` is already installed and covers these cases.

**Fix:**
- `Header` logo: replace GSAP `useEffect` with `animate-fade-in-down` class from `tw-animate-css`
- `ProductGrid` cards: replace GSAP ScrollTrigger with CSS `@keyframes` via `tw-animate-css` + `animation-delay` inline style for stagger effect

GSAP remains as a dependency for future complex animations (scroll storytelling, SVG morphing) but is removed from the critical path.

### 4.3 Remove Unnecessary `dynamic()` Wrappers

**Problem:** In `app/page.tsx`, `ProductGrid` and `Categories` are wrapped in `dynamic(..., { ssr: true })`. `ssr: true` is the default — this wrapper adds chunk-splitting overhead with zero benefit for Server Components.

**Fix:** Remove the `dynamic()` wrappers and use direct static imports.

### 4.4 `<a>` → `<Link>` in Header Navigation

**Problem:** Nav items (`Mens`, `Womens`, `Kids`, `Sale`) in `Header.tsx` use native `<a href>` tags, triggering full page reloads on every navigation.

**Fix:** Replace with `<Link href>` from `next/link`.

### 4.5 Remove `<style jsx>` from Header

**Problem:** The `fadeInDown` keyframe animation is defined inline as a `<style jsx>` block. `tw-animate-css` already provides this animation.

**Fix:** Replace `<style jsx>` with the appropriate `tw-animate-css` class on the nav items and delete the style block.

---

## Section 5 — SEO & Metadata

### 5.1 Dynamic `generateMetadata` on Product and Category Pages

**Problem:** All pages share the same static metadata from `RootLayout`. Product and category pages are indexed by Google with identical title and description.

**Fix:** Add `generateMetadata` to:

`app/product/[id]/page.tsx`:
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const result = await getProductAction((await params).id)
  if (!result.product) return {}
  return {
    title: `${result.product.name} — PureCart`,
    description: result.product.description ?? `Buy ${result.product.name} at PureCart`,
    openGraph: {
      title: result.product.name,
      images: result.product.image_url ? [result.product.image_url] : [],
    },
  }
}
```

`app/category/[slug]/page.tsx`:
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params
  const title = slug === 'all' ? 'All Products' : `${slug.charAt(0).toUpperCase() + slug.slice(1)} Collection`
  return {
    title: `${title} — PureCart`,
    description: `Browse ${title.toLowerCase()} at PureCart.`,
  }
}
```

### 5.2 `app/sitemap.ts`

Generate a sitemap that includes all product URLs, fetched from the API at build time:

```ts
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://purecart.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await getProductsAction({ limit: 1000 })
  const productUrls = result.products.map(p => ({
    url: `${BASE_URL}/product/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  return [
    { url: BASE_URL, priority: 1.0 },
    { url: `${BASE_URL}/category/all`, priority: 0.9 },
    ...productUrls,
  ]
}
```

**Requires:** Add `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app` to Vercel environment variables.

### 5.3 `app/robots.ts`

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/checkout', '/profile', '/orders'] },
    sitemap: 'https://purecart.com/sitemap.xml',
  }
}
```

### 5.4 Standardize `lang` Attribute

**Problem:** `<html lang="en">` but UI has Spanish strings in several pages. Decide on one primary language and update the `lang` attribute accordingly.

**Fix:** If the primary language is Spanish, change to `lang="es"`. If English, translate all Spanish UI strings to English. Do not mix.

---

## Execution Order

```
Phase 1 (Foundation — independent, highest impact):
  ├── 1.1 ThemeProvider
  ├── 1.2 proxy.ts + pca-session cookie in auth actions
  ├── 1.3 error.tsx + not-found.tsx
  └── 1.4 loading.tsx + skeletons

Phase 2 (Images — independent, direct LCP/CLS impact):
  ├── 2.1 next/image everywhere
  ├── 2.2 sizes prop
  └── 2.3 priority on LCP image

Phase 3 (Bundle — depends on Phase 1 for mounted removal):
  ├── 4.1 Remove mounted anti-pattern
  ├── 4.2 Replace GSAP simple animations
  ├── 4.3 Remove dynamic() wrappers
  ├── 4.4 <a> → <Link> in Header
  └── 4.5 Remove <style jsx>

Phase 4 (Caching — independent):
  ├── 3.1 favoritesStore
  ├── 3.2 nextOptions in client.ts
  └── 3.3 revalidateTag on mutations

Phase 5 (SEO — independent, do last):
  ├── 5.1 generateMetadata
  ├── 5.2 sitemap.ts
  ├── 5.3 robots.ts
  └── 5.4 Standardize lang
```

---

## Files to Create

| File | Type |
|------|------|
| `frontend/proxy.ts` | New |
| `frontend/app/error.tsx` | New |
| `frontend/app/not-found.tsx` | New |
| `frontend/app/loading.tsx` | New |
| `frontend/app/product/[id]/loading.tsx` | New |
| `frontend/app/category/[slug]/loading.tsx` | New |
| `frontend/store/favoritesStore.ts` | New |
| `frontend/app/sitemap.ts` | New |
| `frontend/app/robots.ts` | New |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/app/layout.tsx` | Add ThemeProvider |
| `frontend/app/page.tsx` | Remove dynamic() wrappers |
| `frontend/app/product/[id]/page.tsx` | Add generateMetadata |
| `frontend/app/category/[slug]/page.tsx` | Add generateMetadata |
| `frontend/app/favorites/page.tsx` | Remove "use client" + mounted pattern |
| `frontend/app/orders/page.tsx` | Remove "use client" + mounted pattern |
| `frontend/components/ProductGrid.tsx` | next/image, remove GSAP, favoritesStore |
| `frontend/components/Header.tsx` | Link, remove style jsx + GSAP |
| `frontend/components/ProductDetail.tsx` | next/image, favoritesStore |
| `frontend/lib/api/client.ts` | Add nextOptions to RequestOptions |
| `frontend/lib/api/services/products.service.ts` | Add revalidate cache |
| `frontend/lib/api/actions/auth.actions.ts` | Set pca-session cookie |
| `frontend/store/authStore.ts` | Delete pca-session cookie on logout |
