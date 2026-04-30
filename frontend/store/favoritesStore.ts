import { create } from "zustand";
import {
  addFavoriteAction,
  removeFavoriteAction,
  getFavoritesAction,
} from "@/lib/api/actions";

interface FavoritesState {
  ids: Set<string>;
  loaded: boolean;
  togglingIds: Set<string>;
  load: () => Promise<void>;
  reset: () => void;
  toggle: (productId: string) => Promise<{ ok: boolean; isFav: boolean; messages?: string }>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  loaded: false,
  togglingIds: new Set(),

  async load() {
    const result = await getFavoritesAction();
    if (result.ok) {
      set({ ids: new Set(result.favorites.map((f) => f.product_id)), loaded: true });
    }
  },

  reset() {
    set({ ids: new Set(), loaded: false, togglingIds: new Set() });
  },

  async toggle(productId) {
    set((state) => {
      const next = new Set(state.togglingIds);
      next.add(productId);
      return { togglingIds: next };
    });

    const isFav = get().ids.has(productId);
    const action = isFav ? removeFavoriteAction : addFavoriteAction;
    const result = await action(productId);

    if (result.ok) {
      set((state) => {
        const next = new Set(state.ids);
        if (isFav) next.delete(productId);
        else next.add(productId);
        return { ids: next };
      });
    }

    set((state) => {
      const next = new Set(state.togglingIds);
      next.delete(productId);
      return { togglingIds: next };
    });

    return { ok: result.ok, isFav: !isFav, messages: result.ok ? undefined : result.messages };
  },
}));
