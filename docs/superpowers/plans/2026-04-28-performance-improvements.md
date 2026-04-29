# Performance Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Lighthouse scores (LCP, CLS, SEO) and eliminate structural performance issues found in code review.

**Architecture:** Five sequential phases — Foundation (proxy.ts, ThemeProvider, error/loading pages) → Images (next/image migration) → Bundle (GSAP removal, Link fixes, mounted pattern) → Caching (favoritesStore, fetch revalidation) → SEO (metadata, sitemap, robots). **Requires Plan `2026-04-28-auth-security.md` to be completed first** — proxy.ts reads the `pca-access` cookie set by that plan.

**Tech Stack:** Next.js 16 App Router, `next/image`, `next-themes`, Zustand, Tailwind CSS v4, `tw-animate-css`.

---

## File Map

**Create:**

| File | Purpose |
|------|---------|
| `frontend/proxy.ts` | Route protection — redirect unauthenticated users from protected routes |
| `frontend/app/error.tsx` | Global error boundary UI |
| `frontend/app/not-found.tsx` | 404 page |
| `frontend/app/loading.tsx` | Global loading skeleton |
| `frontend/app/product/[id]/loading.tsx` | Product detail skeleton |
| `frontend/app/category/[slug]/loading.tsx` | Category grid skeleton |
| `frontend/store/favoritesStore.ts` | Zustand store for favorites — eliminates duplicate API calls |
| `frontend/app/sitemap.ts` | Generates XML sitemap from products API |
| `frontend/app/robots.ts` | robots.txt rules |

**Modify:**

| File | Change |
|------|--------|
| `frontend/app/layout.tsx` | Add `ThemeProvider` |
| `frontend/app/page.tsx` | Remove unused `dynamic()` wrappers |
| `frontend/app/product/[id]/page.tsx` | Add `generateMetadata` |
| `frontend/app/category/[slug]/page.tsx` | Add `generateMetadata` |
| `frontend/app/favorites/page.tsx` | Remove `mounted` anti-pattern; use `favoritesStore` |
| `frontend/app/orders/page.tsx` | Remove `mounted` anti-pattern |
| `frontend/components/ProductGrid.tsx` | `next/image`, remove GSAP, use `favoritesStore` |
| `frontend/components/Header.tsx` | `<Link>`, remove `<style jsx>`, remove GSAP |
| `frontend/app/product/[id]/ProductDetail.tsx` | `next/image`, use `favoritesStore` |
| `frontend/lib/api/services/products.service.ts` | Add `revalidate` cache option |

---

## Phase 1 — Foundation

### Task 1: Create `proxy.ts` — route protection

**Files:**
- Create: `frontend/proxy.ts`

- [ ] **Step 1: Create the file**

```typescript
// frontend/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/checkout", "/favorites", "/orders", "/profile"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !req.cookies.has("pca-access")) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|ico|svg|jpg|jpeg|webp)$).*)"],
};
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

Expected: Clean build.

- [ ] **Step 3: Manual test**

```bash
cd frontend && npm run dev
```

Sign out, then navigate to `http://localhost:3000/favorites` directly. Expected: redirected to `/signin?redirect=%2Ffavorites`.

- [ ] **Step 4: Commit**

```bash
git add frontend/proxy.ts
git commit -m "feat: add proxy.ts for server-side route protection on auth-gated pages"
```

---

### Task 2: Add `ThemeProvider` to `RootLayout`

**Files:**
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

```typescript
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Cart from "@/components/Cart";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PureCart - Premium E-Commerce Store",
  description: "Discover premium products at PureCart. From fashion to electronics, find everything you need in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <Cart />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Note: `suppressHydrationWarning` on `<html>` is required by `next-themes` to prevent hydration mismatch. `lang="es"` aligns with the Spanish UI strings used in the app.

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Manual test dark mode**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000`. Open DevTools → Console, run `document.documentElement.classList`. Should reflect system theme. Manually toggle `localStorage["theme"]` between `"dark"` and `"light"` and refresh — page should respond.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/layout.tsx
git commit -m "feat(layout): add ThemeProvider from next-themes, fix lang attribute"
```

---

### Task 3: Create `error.tsx` and `not-found.tsx`

**Files:**
- Create: `frontend/app/error.tsx`
- Create: `frontend/app/not-found.tsx`

- [ ] **Step 1: Create `app/error.tsx`**

```typescript
// frontend/app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PureCart Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center gap-6">
      <AlertTriangle className="w-16 h-16 text-red-500/60" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-sm">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/not-found.tsx`**

```typescript
// frontend/app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center gap-6">
      <PackageX className="w-16 h-16 text-muted-foreground/40" />
      <div className="space-y-2">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <p className="text-muted-foreground max-w-sm">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/">Back to Shop</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/error.tsx frontend/app/not-found.tsx
git commit -m "feat: add global error.tsx boundary and not-found.tsx page"
```

---

### Task 4: Create `loading.tsx` skeletons

**Files:**
- Create: `frontend/app/loading.tsx`
- Create: `frontend/app/product/[id]/loading.tsx`
- Create: `frontend/app/category/[slug]/loading.tsx`

- [ ] **Step 1: Create global `app/loading.tsx`**

```typescript
// frontend/app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-20 border-b border-border/50 animate-pulse bg-muted/30" />
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border/50">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/product/[id]/loading.tsx`**

```typescript
// frontend/app/product/[id]/loading.tsx
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-20 border-b border-border/50 animate-pulse bg-muted/30" />
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="h-5 w-24 bg-muted animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="aspect-square bg-muted animate-pulse rounded-3xl" />
          <div className="space-y-6 py-4">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-10 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-10 bg-muted animate-pulse rounded w-1/2" />
            </div>
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 w-36 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
              <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-36 bg-muted animate-pulse rounded-xl" />
              <div className="h-12 flex-1 bg-muted animate-pulse rounded-xl" />
              <div className="h-12 w-12 bg-muted animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/category/[slug]/loading.tsx`**

```typescript
// frontend/app/category/[slug]/loading.tsx
export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-20 border-b border-border/50 animate-pulse bg-muted/30" />
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto mb-16" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border/50">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/app/loading.tsx frontend/app/product/[id]/loading.tsx frontend/app/category/[slug]/loading.tsx
git commit -m "feat: add loading skeletons for home, product detail, and category pages"
```

---

## Phase 2 — Images

### Task 5: Migrate `ProductGrid.tsx` to `next/image`

**Files:**
- Modify: `frontend/components/ProductGrid.tsx`

- [ ] **Step 1: Add `Image` import**

At the top of the file, add:
```typescript
import Image from "next/image";
```

- [ ] **Step 2: Replace `<img>` with `<Image>` in the product card**

Find the image section in the card (inside the `relative aspect-square` div) and replace:

```typescript
// BEFORE
{product.image_url ? (
  <img
    src={product.image_url}
    alt={product.name}
    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-500">
    📦
  </div>
)}

// AFTER
{product.image_url ? (
  <Image
    src={product.image_url}
    alt={product.name}
    fill
    className="object-cover group-hover:scale-110 transition-transform duration-500"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    priority={index === 0}
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-500">
    📦
  </div>
)}
```

The parent `div` already has `relative overflow-hidden` — `fill` requires a `relative` parent, so no extra changes needed there. `priority={index === 0}` adds a `<link rel="preload">` for the first card — the LCP candidate on the home page.

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

Expected: Clean build. `next/image` with `fill` requires the parent to have `position: relative` — already set via Tailwind's `relative` class.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/ProductGrid.tsx
git commit -m "perf(images): migrate ProductGrid to next/image with fill + responsive sizes"
```

---

### Task 6: Migrate `ProductDetail.tsx` and `FavoritesPage` to `next/image`

**Files:**
- Modify: `frontend/app/product/[id]/ProductDetail.tsx`
- Modify: `frontend/app/favorites/page.tsx`

- [ ] **Step 1: Update `ProductDetail.tsx`**

Add import:
```typescript
import Image from "next/image";
```

In the image section (inside the `relative aspect-square ... rounded-3xl` div), replace:
```typescript
// BEFORE
{product.image_url ? (
  <img
    src={product.image_url}
    alt={product.name}
    className="w-full h-full object-cover"
  />
) : (
  <div className="text-[120px]">📦</div>
)}

// AFTER
{product.image_url ? (
  <Image
    src={product.image_url}
    alt={product.name}
    fill
    className="object-cover"
    sizes="(max-width: 1024px) 100vw, 50vw"
    priority
  />
) : (
  <div className="text-[120px]">📦</div>
)}
```

`priority` is set here because this is the main product image and the LCP candidate.

- [ ] **Step 2: Update `favorites/page.tsx`**

Add import:
```typescript
import Image from "next/image";
```

In the favorites grid card image section, replace:
```typescript
// BEFORE
{p.image_url ? (
  <img
    src={p.image_url}
    alt={p.name}
    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
  />
) : (
  <div className="text-8xl group-hover:scale-110 transition-transform duration-500">
    📦
  </div>
)}

// AFTER
{p.image_url ? (
  <Image
    src={p.image_url}
    alt={p.name}
    fill
    className="object-cover group-hover:scale-110 transition-transform duration-500"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  />
) : (
  <div className="text-8xl group-hover:scale-110 transition-transform duration-500">
    📦
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/product/[id]/ProductDetail.tsx frontend/app/favorites/page.tsx
git commit -m "perf(images): migrate ProductDetail and FavoritesPage to next/image"
```

---

## Phase 3 — Bundle & Client Rendering

### Task 7: Fix `Header.tsx` — remove GSAP, `<style jsx>`, and `<a>` tags

**Files:**
- Modify: `frontend/components/Header.tsx`

- [ ] **Step 1: Remove the GSAP import and logo animation `useEffect`**

Remove this import:
```typescript
import gsap from "gsap";
```

Remove the entire `useEffect` that animates the logo:
```typescript
// DELETE this entire block
useEffect(() => {
  if (logoRef.current) {
    gsap.from(logoRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.8,
      ease: "power3.out",
      onComplete: () => {
        if (logoRef.current) {
          gsap.set(logoRef.current, { clearProps: "all" });
        }
      },
    });
  }
}, []);
```

Also remove the `logoRef` declaration and its usage on the `<Link>` tag (the `ref={logoRef}` attribute).

- [ ] **Step 2: Add CSS animation class to logo instead**

On the logo `<Link>` element, add `animate-fade-in-down` from `tw-animate-css`:
```typescript
// BEFORE
<Link href="/" ref={logoRef} className="flex flex-row items-center space-x-2 cursor-pointer">

// AFTER
<Link href="/" className="flex flex-row items-center space-x-2 cursor-pointer animate-fade-in-down">
```

- [ ] **Step 3: Replace `<a>` nav items with `<Link>`**

In the desktop navigation, replace:
```typescript
// BEFORE
{navItems.map((item, index) => (
  <a
    key={item.name}
    href={item.href}
    className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative group"
    style={{
      animation: `fadeInDown 0.5s ease-out ${index * 0.1}s both`,
    }}
  >
    {item.name}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white group-hover:w-full transition-all duration-300"></span>
  </a>
))}

// AFTER
{navItems.map((item) => (
  <Link
    key={item.name}
    href={item.href}
    className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative group animate-fade-in-down"
  >
    {item.name}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white group-hover:w-full transition-all duration-300"></span>
  </Link>
))}
```

In the mobile menu, replace `<a href>` nav items with `<Link href>`:
```typescript
// BEFORE
{navItems.map((item) => (
  <a
    key={item.name}
    href={item.href}
    className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
    onClick={() => setIsMenuOpen(false)}
  >
    {item.name}
  </a>
))}

// AFTER
{navItems.map((item) => (
  <Link
    key={item.name}
    href={item.href}
    className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
    onClick={() => setIsMenuOpen(false)}
  >
    {item.name}
  </Link>
))}
```

- [ ] **Step 4: Delete the `<style jsx>` block**

Remove the entire block at the bottom of the component:
```typescript
// DELETE
<style jsx>{`
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style>
```

- [ ] **Step 5: Remove the unused `useRef` for logo (if `logoRef` was the only ref)**

If `logoRef` was the only `useRef` in the file, remove the `useRef` import from React.

- [ ] **Step 6: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add frontend/components/Header.tsx
git commit -m "perf(header): replace GSAP with tw-animate-css, fix nav <a> to <Link>, remove style jsx"
```

---

### Task 8: Fix `ProductGrid.tsx` — remove GSAP, fix `dynamic()` in home page

**Files:**
- Modify: `frontend/components/ProductGrid.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Remove GSAP from `ProductGrid.tsx`**

Remove imports:
```typescript
// DELETE
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
```

Remove the plugin registration:
```typescript
// DELETE
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
```

Remove the GSAP animation `useEffect`:
```typescript
// DELETE this entire useEffect
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from(titleRef.current, { ... });
    const cards = gridRef.current?.querySelectorAll(".product-card");
    if (cards && cards.length > 0) {
      gsap.from(cards, { ... });
    }
  }, sectionRef);
  return () => ctx.revert();
}, [products]);
```

Remove the three refs that were only used by GSAP:
```typescript
// DELETE
const sectionRef = useRef<HTMLElement>(null);
const titleRef = useRef<HTMLDivElement>(null);
const gridRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Add CSS animation to the section and cards**

On the section element, remove `ref={sectionRef}` and add an entry animation class:
```typescript
// BEFORE
<section ref={sectionRef} className="py-20 bg-background" id="shop">

// AFTER
<section className="py-20 bg-background" id="shop">
```

On the title div, remove `ref={titleRef}` and add an animation class:
```typescript
// BEFORE
<div ref={titleRef} className="text-center mb-16 space-y-4">

// AFTER
<div className="text-center mb-16 space-y-4 animate-fade-in-up">
```

On the grid div, remove `ref={gridRef}`:
```typescript
// BEFORE
<div
  ref={gridRef}
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
>

// AFTER
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
```

- [ ] **Step 3: Remove unused `useRef` import if no refs remain**

Check if `useRef` is still used anywhere else in the file. If not, remove it from the React import:
```typescript
// BEFORE
import { useEffect, useRef, useState } from "react";

// AFTER
import { useEffect, useState } from "react";
```

- [ ] **Step 4: Fix `app/page.tsx` — remove unnecessary `dynamic()` wrappers**

Replace the file content:
```typescript
// frontend/app/page.tsx
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import Categories from "@/components/Categories";
import { getProductsAction } from "@/lib/api/actions";

export default async function Home() {
  const result = await getProductsAction({ limit: 8 });
  const products = result.products;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProductGrid products={products} />
        <Categories />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/components/ProductGrid.tsx frontend/app/page.tsx
git commit -m "perf(bundle): remove GSAP from ProductGrid, remove unnecessary dynamic() wrappers"
```

---

### Task 9: Remove `mounted` anti-pattern from `favorites/page.tsx` and `orders/page.tsx`

**Files:**
- Modify: `frontend/app/favorites/page.tsx`
- Modify: `frontend/app/orders/page.tsx`

Since `proxy.ts` now guarantees only authenticated users reach these routes, the `mounted` + `isAuthenticated` guards are redundant.

- [ ] **Step 1: Update `favorites/page.tsx`**

Remove the `mounted` state and its `useEffect`:
```typescript
// DELETE
const [mounted, setMounted] = useState(false);
// DELETE
useEffect(() => {
  setMounted(true);
}, []);
```

Update the data-loading `useEffect` — remove the `mounted` dependency and the early return:
```typescript
// BEFORE
useEffect(() => {
  if (!mounted) return;

  async function load() {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    // ...
  }

  load();
}, [mounted, isAuthenticated, accessToken]);

// AFTER
useEffect(() => {
  async function load() {
    setLoading(true);
    const result = await getFavoritesAction();
    if (result.ok) {
      setFavorites(result.favorites);
    } else {
      toast.error(result.messages);
    }
    setLoading(false);
  }

  load();
}, []);
```

Remove all `mounted &&` guards and the "not authenticated" empty state block — the proxy handles that:
```typescript
// DELETE these entire conditional blocks
{mounted && !isAuthenticated && ( ... )}
```

The remaining conditional structure:
```typescript
{/* Loading */}
{loading && (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)}

{/* Empty state */}
{!loading && favorites.length === 0 && ( ... )}

{/* Favorites grid */}
{!loading && favorites.length > 0 && ( ... )}
```

Remove unused imports: `LogIn` icon, `isAuthenticated` and `accessToken` from authStore (these were already removed in the auth-security plan for `accessToken`). Remove `isAuthenticated` if no longer used.

- [ ] **Step 2: Update `orders/page.tsx`**

Apply the same pattern:

Remove `mounted` state and its `useEffect`. Update the data-loading `useEffect`:
```typescript
// AFTER
useEffect(() => {
  async function load() {
    setLoading(true);
    const result = await getMyOrdersAction();
    if (result.ok) {
      setOrders(result.orders);
    } else {
      toast.error(result.messages);
    }
    setLoading(false);
  }

  load();
}, []);
```

Remove the "not authenticated" conditional block and all `mounted &&` guards. Remove `LogIn` import and `isAuthenticated` from destructure if no longer needed.

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/favorites/page.tsx frontend/app/orders/page.tsx
git commit -m "perf: remove mounted anti-pattern from favorites and orders pages"
```

---

## Phase 4 — Caching

### Task 10: Create `favoritesStore.ts`

**Files:**
- Create: `frontend/store/favoritesStore.ts`

- [ ] **Step 1: Create the store**

```typescript
// frontend/store/favoritesStore.ts
import { create } from "zustand";
import {
  getFavoritesAction,
  addFavoriteAction,
  removeFavoriteAction,
} from "@/lib/api/actions";
import { toast } from "sonner";

interface FavoritesState {
  ids: Set<string>;
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  ids: new Set(),
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const result = await getFavoritesAction();
    if (result.ok) {
      set({ ids: new Set(result.favorites.map((f) => f.product_id)), loaded: true });
    }
    set({ loading: false });
  },

  add: async (productId) => {
    set((state) => ({ ids: new Set(state.ids).add(productId) }));
    const result = await addFavoriteAction(productId);
    if (!result.ok) {
      set((state) => {
        const next = new Set(state.ids);
        next.delete(productId);
        return { ids: next };
      });
      toast.error(result.messages);
    }
  },

  remove: async (productId) => {
    set((state) => {
      const next = new Set(state.ids);
      next.delete(productId);
      return { ids: next };
    });
    const result = await removeFavoriteAction(productId);
    if (!result.ok) {
      set((state) => ({ ids: new Set(state.ids).add(productId) }));
      toast.error(result.messages);
    }
  },

  isFavorite: (productId) => get().ids.has(productId),
}));
```

Note: `add` and `remove` use optimistic updates — the UI updates immediately and rolls back on error.

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/store/favoritesStore.ts
git commit -m "feat(store): add favoritesStore to centralize favorites state and eliminate duplicate fetches"
```

---

### Task 11: Wire `favoritesStore` into `ProductGrid` and `ProductDetail`

**Files:**
- Modify: `frontend/components/ProductGrid.tsx`
- Modify: `frontend/app/product/[id]/ProductDetail.tsx`

- [ ] **Step 1: Update `ProductGrid.tsx` to use `favoritesStore`**

Add import:
```typescript
import { useFavoritesStore } from "@/store/favoritesStore";
```

Replace the local favorites state and fetch logic:
```typescript
// DELETE these lines
const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

// DELETE the favorites useEffect (the one that calls getFavoritesAction)

// ADD these lines
const { ids: favoriteIds, load, add, remove, isFavorite } = useFavoritesStore();
const { isAuthenticated } = useAuthStore();
```

Add a load call in a `useEffect`:
```typescript
useEffect(() => {
  if (isAuthenticated) {
    load();
  }
}, [isAuthenticated, load]);
```

Update `handleToggleFavorite`:
```typescript
async function handleToggleFavorite(productId: string) {
  if (!isAuthenticated) {
    toast.error("Inicia sesión para agregar favoritos");
    return;
  }

  if (isFavorite(productId)) {
    await remove(productId);
    toast.success("Eliminado de favoritos");
  } else {
    await add(productId);
    toast.success("Agregado a favoritos");
  }
}
```

In the card JSX, replace `favoriteIds.has(product.id)` with `isFavorite(product.id)`. Remove `isToggling` state — the store's optimistic update makes the spinner unnecessary (the UI responds instantly).

Remove the `togglingIds` state entirely and the `Loader2` spinner on the wishlist button:
```typescript
// BEFORE
{isToggling ? (
  <Loader2 className="w-4 h-4 animate-spin" />
) : (
  <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
)}

// AFTER
<Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-red-500 text-red-500" : ""}`} />
```

Remove `Loader2` from the lucide imports if no longer used.

- [ ] **Step 2: Update `ProductDetail.tsx` to use `favoritesStore`**

Add import:
```typescript
import { useFavoritesStore } from "@/store/favoritesStore";
```

Replace local `isFavorited`, `isTogglingFav`, `isLoadingFav` states:
```typescript
// DELETE
const [isFavorited, setIsFavorited] = useState(false);
const [isTogglingFav, setIsTogglingFav] = useState(false);
const [isLoadingFav, setIsLoadingFav] = useState(false);

// DELETE the favorites load useEffect

// ADD
const { isFavorite, load, add, remove } = useFavoritesStore();
```

Add load trigger:
```typescript
useEffect(() => {
  if (isAuthenticated) {
    load();
  }
}, [isAuthenticated, load]);
```

Update `handleToggleFavorite`:
```typescript
async function handleToggleFavorite() {
  if (!isAuthenticated) {
    toast.error("Sign in to add favorites");
    return;
  }

  if (isFavorite(product.id)) {
    await remove(product.id);
    toast.success("Removed from favorites");
  } else {
    await add(product.id);
    toast.success("Added to favorites");
  }
}
```

In the JSX, update the heart button:
```typescript
// BEFORE
disabled={isTogglingFav || isLoadingFav}
// ...
{isTogglingFav || isLoadingFav ? (
  <Loader2 className="w-5 h-5 animate-spin" />
) : (
  <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
)}

// AFTER
<Heart className={`w-5 h-5 ${isFavorite(product.id) ? "fill-red-500 text-red-500" : ""}`} />
```

Remove `Loader2` import if no longer used.

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Manual test**

```bash
cd frontend && npm run dev
```

1. Sign in, navigate to home
2. Open DevTools → Network. Filter by fetch/XHR
3. Navigate to a product detail — confirm `/favorites` is called only once (from store load), not twice
4. Toggle a favorite on the product card — UI updates immediately (optimistic)
5. Navigate back — favorite state is preserved (same store)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ProductGrid.tsx frontend/app/product/[id]/ProductDetail.tsx
git commit -m "perf: wire favoritesStore into ProductGrid and ProductDetail, eliminate duplicate fetches"
```

---

### Task 12: Add fetch cache to `products.service.ts`

**Files:**
- Modify: `frontend/lib/api/services/products.service.ts`

- [ ] **Step 1: Update products service to use `nextOptions`**

```typescript
// frontend/lib/api/services/products.service.ts
import { api } from "../client";
import type { Product, ProductFilters } from "../types";

export const productsService = {
  getAll(filters?: ProductFilters) {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.min_price !== undefined) params.set("min_price", String(filters.min_price));
    if (filters?.max_price !== undefined) params.set("max_price", String(filters.max_price));
    if (filters?.limit !== undefined) params.set("limit", String(filters.limit));
    if (filters?.offset !== undefined) params.set("offset", String(filters.offset));

    const query = params.toString();
    return api.get<Product[]>(`/products${query ? `?${query}` : ""}`, {
      nextOptions: { revalidate: 300, tags: ["products"] },
    });
  },

  getById(id: string) {
    return api.get<Product>(`/products/${id}`, {
      nextOptions: { revalidate: 300, tags: ["products", `product-${id}`] },
    });
  },
} as const;
```

Note: You may need to check the current `products.service.ts` to ensure the `getAll` parameters match. The key addition is `nextOptions` on each read method.

- [ ] **Step 2: Add `revalidateTag` to `createOrderAction`**

Open `frontend/lib/api/actions/orders.actions.ts`. At the top add:
```typescript
import { revalidateTag } from "next/cache";
```

Inside `createOrderAction`, call `revalidateTag` after a successful order:
```typescript
export async function createOrderAction(data: OrderCreate): Promise<OrderResult> {
  try {
    const res = await ordersService.create(data);
    if (res.data) {
      revalidateTag("products");
    }
    return { ok: true, order: res.data ?? null, messages: res.messages };
  } catch (error) {
    // ... rest unchanged
  }
}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/api/services/products.service.ts frontend/lib/api/actions/orders.actions.ts
git commit -m "perf(cache): add revalidation to products service and revalidateTag on order creation"
```

---

## Phase 5 — SEO

### Task 13: Add `generateMetadata` to product and category pages

**Files:**
- Modify: `frontend/app/product/[id]/page.tsx`
- Modify: `frontend/app/category/[slug]/page.tsx`

- [ ] **Step 1: Update `app/product/[id]/page.tsx`**

```typescript
// frontend/app/product/[id]/page.tsx
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductDetail } from "./ProductDetail";
import { getProductAction } from "@/lib/api/actions";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getProductAction(id);

  if (!result.product) {
    return { title: "Product not found — PureCart" };
  }

  const { name, description, image_url } = result.product;
  return {
    title: `${name} — PureCart`,
    description: description ?? `Buy ${name} at PureCart. Premium quality, fast shipping.`,
    openGraph: {
      title: name,
      description: description ?? `Buy ${name} at PureCart`,
      images: image_url ? [{ url: image_url }] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const result = await getProductAction(id);

  if (!result.product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="grow pt-24 pb-16">
        <ProductDetail product={result.product} />
      </main>
      <Footer />
    </div>
  );
}
```

Note: The page also calls `notFound()` when the product doesn't exist — this triggers `app/not-found.tsx` created in Task 3.

- [ ] **Step 2: Update `app/category/[slug]/page.tsx`**

```typescript
// frontend/app/category/[slug]/page.tsx
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import { getProductsAction } from "@/lib/api/actions";
import type { ProductFilters } from "@/lib/api/types";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { search } = await searchParams;

  const isAll = slug === "all";
  const title = isAll
    ? search ? `Search: "${search}"` : "All Products"
    : `${slug.charAt(0).toUpperCase() + slug.slice(1)} Collection`;

  return {
    title: `${title} — PureCart`,
    description: `Browse ${title.toLowerCase()} at PureCart. Premium products, fast shipping.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { search } = await searchParams;

  const isAll = slug === "all";
  const title = isAll
    ? search ? `Search: "${search}"` : "All Products"
    : slug.charAt(0).toUpperCase() + slug.slice(1);

  const filters: ProductFilters = { limit: 40 };
  if (!isAll) filters.category = slug;
  if (search) filters.search = search;

  const result = await getProductsAction(filters);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="grow pt-24">
        <div className="container mx-auto px-4 py-8">
          <ProductGrid title={`${title} Collection`} products={result.products} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/product/[id]/page.tsx frontend/app/category/[slug]/page.tsx
git commit -m "feat(seo): add generateMetadata with Open Graph to product and category pages"
```

---

### Task 14: Create `sitemap.ts` and `robots.ts`

**Files:**
- Create: `frontend/app/sitemap.ts`
- Create: `frontend/app/robots.ts`

- [ ] **Step 1: Create `app/sitemap.ts`**

```typescript
// frontend/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getProductsAction } from "@/lib/api/actions";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://purecart.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await getProductsAction({ limit: 1000 });

  const productUrls: MetadataRoute.Sitemap = result.products.map((p) => ({
    url: `${BASE_URL}/product/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/category/all`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...productUrls,
  ];
}
```

- [ ] **Step 2: Create `app/robots.ts`**

```typescript
// frontend/app/robots.ts
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://purecart.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/checkout", "/profile", "/orders", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Add `NEXT_PUBLIC_APP_URL` to Vercel**

In Vercel dashboard → Settings → Environment Variables, add:
```
NEXT_PUBLIC_APP_URL = https://your-production-domain.vercel.app
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

Expected: Sitemap and robots routes generated. You can verify locally at `http://localhost:3000/sitemap.xml` and `http://localhost:3000/robots.txt` after running `npm run dev`.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/sitemap.ts frontend/app/robots.ts
git commit -m "feat(seo): add sitemap.ts and robots.ts for search engine crawling"
```
