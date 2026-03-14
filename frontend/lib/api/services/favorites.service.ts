// ============================================================================
// Favorites Service - Wishlist / favorites management
// ============================================================================

import { api } from "../client";
import type { Favorite } from "../types";

export const favoritesService = {
  getAll(token?: string) {
    return api.get<Favorite[]>("/favorites", { token });
  },

  add(productId: string, token?: string) {
    return api.post<Favorite>(`/favorites/${productId}`, undefined, { token });
  },

  remove(productId: string, token?: string) {
    return api.delete<null>(`/favorites/${productId}`, { token });
  },
} as const;
