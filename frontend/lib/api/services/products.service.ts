// ============================================================================
// Products Service - Catalog, search, discounted, best-sellers
// ============================================================================

import { api } from "../client";
import type { Product, ProductFilters } from "../types";

function buildQuery(filters?: ProductFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.min_price !== undefined) params.set("min_price", String(filters.min_price));
  if (filters.max_price !== undefined) params.set("max_price", String(filters.max_price));
  if (filters.search) params.set("search", filters.search);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const productsService = {
  /** List products with optional filters. Works great in Server Components (no token needed). */
  list(filters?: ProductFilters) {
    return api.get<Product[]>(`/products${buildQuery(filters)}`);
  },

  /** Get products that have an active discount. */
  getDiscounted(limit = 20) {
    return api.get<Product[]>(`/products/discounted?limit=${limit}`);
  },

  /** Get best-selling products. */
  getBestSellers(limit = 20) {
    return api.get<Product[]>(`/products/best-sellers?limit=${limit}`);
  },

  /** Get a single product by its ID. */
  getById(productId: string) {
    return api.get<Product>(`/products/${productId}`);
  },
} as const;
