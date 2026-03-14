"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore, type CartProduct } from "@/store/cartStore";
import { getFavoritesAction, removeFavoriteAction } from "@/lib/api/actions";
import type { Favorite } from "@/lib/api/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Heart, ShoppingCart, Loader2, HeartOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function FavoritesPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { addItem } = useCartStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function load() {
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await getFavoritesAction(accessToken);
      if (result.ok) {
        setFavorites(result.favorites);
      } else {
        toast.error(result.messages);
      }
      setLoading(false);
    }

    load();
  }, [mounted, isAuthenticated, accessToken]);

  async function handleRemove(productId: string) {
    if (!accessToken) return;

    setRemovingIds((prev) => new Set(prev).add(productId));

    const result = await removeFavoriteAction(productId, accessToken);
    if (result.ok) {
      setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
      toast.success("Eliminado de favoritos");
    } else {
      toast.error(result.messages);
    }

    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }

  function handleAddToCart(fav: Favorite) {
    const p = fav.products;
    if (!p) return;

    const effectivePrice =
      p.discount_percent > 0
        ? p.price * (1 - p.discount_percent / 100)
        : p.price;

    const cartProduct: CartProduct = {
      id: p.id,
      name: p.name,
      price: effectivePrice,
      image: p.image_url ?? "📦",
      originalPrice: p.discount_percent > 0 ? p.price : undefined,
      discountPercent: p.discount_percent > 0 ? p.discount_percent : undefined,
    };

    addItem(cartProduct);
    toast.success(`${p.name} agregado al carrito`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="grow container mx-auto px-4 py-8 mt-20">
        <h1 className="text-3xl font-bold mb-2">Tus Favoritos</h1>
        <p className="text-muted-foreground mb-8">
          Productos que has guardado para más tarde.
        </p>

        {/* Not authenticated */}
        {mounted && !isAuthenticated && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <LogIn className="w-16 h-16 text-muted-foreground/40" />
            <p className="text-xl text-muted-foreground">
              Inicia sesión para ver tus favoritos
            </p>
            <Button asChild>
              <Link href="/signin?redirect=/favorites">Iniciar Sesión</Link>
            </Button>
          </div>
        )}

        {/* Loading */}
        {mounted && isAuthenticated && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {mounted && isAuthenticated && !loading && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <HeartOff className="w-16 h-16 text-muted-foreground/40" />
            <p className="text-xl text-muted-foreground">
              Aún no tienes favoritos
            </p>
            <p className="text-muted-foreground">
              Explora nuestra colección y agrega productos a tu lista de deseos.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Explorar Productos</Link>
            </Button>
          </div>
        )}

        {/* Favorites grid */}
        {mounted && isAuthenticated && !loading && favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map((fav) => {
              const p = fav.products;
              if (!p) return null;

              const effectivePrice =
                p.discount_percent > 0
                  ? p.price * (1 - p.discount_percent / 100)
                  : p.price;
              const isRemoving = removingIds.has(fav.product_id);

              return (
                <Card
                  key={fav.id}
                  className="group overflow-hidden border-border/50 hover:border-black/50 dark:hover:border-white/50 transition-all duration-300 hover:shadow-xl"
                >
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative aspect-square bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-950/20 dark:via-gray-900/20 dark:to-gray-950/20 flex items-center justify-center overflow-hidden">
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

                      {p.discount_percent > 0 && (
                        <Badge className="absolute top-3 left-3 bg-red-500 text-white border-none">
                          -{Math.round(p.discount_percent)}%
                        </Badge>
                      )}

                      {/* Remove from favorites */}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        onClick={() => handleRemove(fav.product_id)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        )}
                      </Button>

                      {/* Add to cart */}
                      <Button
                        className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                        onClick={() => handleAddToCart(fav)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar al Carrito
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {p.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(effectivePrice)}
                        </span>
                        {p.discount_percent > 0 && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(p.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
