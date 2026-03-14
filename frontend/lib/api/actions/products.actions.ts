"use server";

// ============================================================================
// Product Server Actions - Data fetching for Server Components
// ============================================================================

import { productsService } from "../services";
import { ApiError } from "../client";
import type { Product, ProductFilters } from "../types";

export interface ProductsResult {
  ok: boolean;
  products: Product[];
  messages: string;
}

export interface SingleProductResult {
  ok: boolean;
  product: Product | null;
  messages: string;
}

export async function getProductsAction(
  filters?: ProductFilters,
): Promise<ProductsResult> {
  try {
    const res = await productsService.list(filters);
    return { ok: true, products: res.data ?? [], messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, products: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getProductsAction]", detail);
    return { ok: false, products: [], messages: `Failed to load products: ${detail}` };
  }
}

export async function getDiscountedProductsAction(
  limit = 20,
): Promise<ProductsResult> {
  try {
    const res = await productsService.getDiscounted(limit);
    return { ok: true, products: res.data ?? [], messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, products: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getDiscountedProductsAction]", detail);
    return { ok: false, products: [], messages: `Failed to load discounted products: ${detail}` };
  }
}

export async function getBestSellersAction(
  limit = 20,
): Promise<ProductsResult> {
  try {
    const res = await productsService.getBestSellers(limit);
    return { ok: true, products: res.data ?? [], messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, products: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getBestSellersAction]", detail);
    return { ok: false, products: [], messages: `Failed to load best sellers: ${detail}` };
  }
}

export async function getProductByIdAction(
  productId: string,
): Promise<SingleProductResult> {
  try {
    const res = await productsService.getById(productId);
    return { ok: true, product: res.data ?? null, messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, product: null, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getProductByIdAction]", detail);
    return { ok: false, product: null, messages: `Failed to load product: ${detail}` };
  }
}
