"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore, type CartProduct } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import {
  addFavoriteAction,
  removeFavoriteAction,
  getFavoritesAction,
} from "@/lib/api/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ShoppingCart,
  Star,
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Loader2,
  PackageCheck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/api/types";

const STAR_ARRAY = [0, 1, 2, 3, 4];

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCartStore();
  const { isAuthenticated, accessToken } = useAuthStore();

  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [isLoadingFav, setIsLoadingFav] = useState(false);

  const effectivePrice = product.discounted_price ?? product.price;
  const rating = Math.min(5, 3.5 + product.sales_count / 200);
  const inStock = product.stock > 0;

  // Load favorite state
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setIsFavorited(false);
      return;
    }

    let cancelled = false;
    setIsLoadingFav(true);

    async function loadFav() {
      const result = await getFavoritesAction(accessToken!);
      if (!cancelled && result.ok) {
        setIsFavorited(result.favorites.some((f) => f.product_id === product.id));
      }
      if (!cancelled) setIsLoadingFav(false);
    }

    loadFav();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken, product.id]);

  function handleAddToCart() {
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: effectivePrice,
      image: product.image_url ?? "📦",
      originalPrice: product.discount_percent > 0 ? product.price : undefined,
      discountPercent:
        product.discount_percent > 0 ? product.discount_percent : undefined,
    };

    for (let i = 0; i < quantity; i++) {
      addItem(cartProduct);
    }

    toast.success(`${product.name} added to cart (x${quantity})`);
  }

  async function handleToggleFavorite() {
    if (!isAuthenticated || !accessToken) {
      toast.error("Sign in to add favorites");
      return;
    }

    setIsTogglingFav(true);

    if (isFavorited) {
      const result = await removeFavoriteAction(product.id, accessToken);
      if (result.ok) {
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        toast.error(result.messages);
      }
    } else {
      const result = await addFavoriteAction(product.id, accessToken);
      if (result.ok) {
        setIsFavorited(true);
        toast.success("Added to favorites");
      } else {
        toast.error(result.messages);
      }
    }

    setIsTogglingFav(false);
  }

  return (
    <div className="container mx-auto px-4 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Shop
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* ─── Image Section ─────────────────────────────────────────── */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-950/20 dark:via-gray-900/20 dark:to-gray-950/20 rounded-3xl overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-[120px]">📦</div>
          )}

          {/* Discount badge */}
          {product.discount_percent > 0 && (
            <Badge className="absolute top-4 left-4 bg-red-500 text-white border-none text-sm px-3 py-1">
              -{Math.round(product.discount_percent)}% OFF
            </Badge>
          )}
        </div>

        {/* ─── Info Section ──────────────────────────────────────────── */}
        <div className="flex flex-col justify-center space-y-6">
          {/* Category */}
          {product.category && (
            <Link
              href={`/category/${product.category.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider w-fit"
            >
              {product.category}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {STAR_ARRAY.map((i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {rating.toFixed(1)} · {product.sales_count} sold
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-foreground">
              {formatPrice(effectivePrice)}
            </span>
            {product.discount_percent > 0 && (
              <span className="text-xl text-muted-foreground line-through mb-1">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              {product.description}
            </p>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2">
            {inStock ? (
              <>
                <PackageCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  In stock ({product.stock} available)
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-red-500">
                Out of stock
              </span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            {/* Quantity Selector */}
            <div className="flex items-center border rounded-xl overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-none"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-14 text-center font-semibold text-lg">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-none"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                disabled={quantity >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Add to Cart */}
            <Button
              size="lg"
              className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-base font-semibold transition-all"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>

            {/* Favorite Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 border-2 shrink-0"
              onClick={handleToggleFavorite}
              disabled={isTogglingFav || isLoadingFav}
            >
              {isTogglingFav || isLoadingFav ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart
                  className={`w-5 h-5 ${
                    isFavorited
                      ? "fill-red-500 text-red-500"
                      : ""
                  }`}
                />
              )}
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Free Shipping
              </span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Secure Payment
              </span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                30-Day Returns
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
