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
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load products";
    return { ok: false, products: [], messages: msg };
  }
}

export async function getDiscountedProductsAction(
  limit = 20,
): Promise<ProductsResult> {
  try {
    const res = await productsService.getDiscounted(limit);
    return { ok: true, products: res.data ?? [], messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load discounted products";
    return { ok: false, products: [], messages: msg };
  }
}

export async function getBestSellersAction(
  limit = 20,
): Promise<ProductsResult> {
  try {
    const res = await productsService.getBestSellers(limit);
    return { ok: true, products: res.data ?? [], messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load best sellers";
    return { ok: false, products: [], messages: msg };
  }
}

export async function getProductByIdAction(
  productId: string,
): Promise<SingleProductResult> {
  try {
    const res = await productsService.getById(productId);
    return { ok: true, product: res.data ?? null, messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load product details";
    return { ok: false, product: null, messages: msg };
  }
}
