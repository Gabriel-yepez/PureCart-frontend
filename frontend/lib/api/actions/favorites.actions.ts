"use server";

// ============================================================================
// Favorites Server Actions
// ============================================================================

import { favoritesService } from "../services";
import { ApiError } from "../client";
import type { Favorite } from "../types";

export async function getFavoritesAction(
  token: string,
): Promise<{ ok: boolean; favorites: Favorite[]; messages: string }> {
  try {
    const res = await favoritesService.getAll(token);
    return { ok: true, favorites: res.data ?? [], messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load favorites";
    return { ok: false, favorites: [], messages: msg };
  }
}

export async function addFavoriteAction(
  productId: string,
  token: string,
): Promise<{ ok: boolean; messages: string }> {
  try {
    const res = await favoritesService.add(productId, token);
    return { ok: true, messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to add to favorites";
    return { ok: false, messages: msg };
  }
}

export async function removeFavoriteAction(
  productId: string,
  token: string,
): Promise<{ ok: boolean; messages: string }> {
  try {
    await favoritesService.remove(productId, token);
    return { ok: true, messages: "Removed from favorites" };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to remove from favorites";
    return { ok: false, messages: msg };
  }
}
