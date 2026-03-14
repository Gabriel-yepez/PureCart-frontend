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
  token: string,
): Promise<{ ok: boolean; messages: string }> {
  try {
    const res = await favoritesService.add(productId, token);
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
  token: string,
): Promise<{ ok: boolean; messages: string }> {
  try {
    await favoritesService.remove(productId, token);
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
