"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore, type CartProduct } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, PackageX, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { addFavoriteAction, removeFavoriteAction, getFavoritesAction } from "@/lib/api/actions";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "@/lib/api/types";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const STAR_ARRAY = [0, 1, 2, 3, 4];

interface ProductGridProps {
    title?: string;
    products: Product[];
}

export default function ProductGrid({ title, products }: ProductGridProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const { addItem } = useCartStore();
    const { isAuthenticated, accessToken } = useAuthStore();

    // Track which product IDs are favorited by the current user
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    // Track which product IDs are currently being toggled (loading state)
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

    // Load user's favorites on mount (if authenticated)
    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            setFavoriteIds(new Set());
            return;
        }

        let cancelled = false;

        async function loadFavs() {
            const result = await getFavoritesAction(accessToken!);
            if (!cancelled && result.ok) {
                setFavoriteIds(new Set(result.favorites.map((f) => f.product_id)));
            }
        }

        loadFavs();
        return () => { cancelled = true; };
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate section title
            gsap.from(titleRef.current, {
                scrollTrigger: {
                    trigger: titleRef.current,
                    start: "top 80%",
                },
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: "power3.out",
            });

            // Animate product cards
            const cards = gridRef.current?.querySelectorAll(".product-card");
            if (cards && cards.length > 0) {
                gsap.from(cards, {
                    scrollTrigger: {
                        trigger: gridRef.current,
                        start: "top 70%",
                    },
                    opacity: 0,
                    y: 50,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "power3.out",
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, [products]);

    function handleAddToCart(product: Product) {
        const effectivePrice = product.discounted_price ?? product.price;
        const cartProduct: CartProduct = {
            id: product.id,
            name: product.name,
            price: effectivePrice,
            image: product.image_url ?? "📦",
            originalPrice: product.discount_percent > 0 ? product.price : undefined,
            discountPercent: product.discount_percent > 0 ? product.discount_percent : undefined,
        };
        addItem(cartProduct);
    }

    async function handleToggleFavorite(productId: string) {
        if (!isAuthenticated || !accessToken) {
            toast.error("Inicia sesión para agregar favoritos");
            return;
        }

        setTogglingIds((prev) => new Set(prev).add(productId));

        const isFav = favoriteIds.has(productId);

        if (isFav) {
            const result = await removeFavoriteAction(productId, accessToken);
            if (result.ok) {
                setFavoriteIds((prev) => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
                toast.success("Eliminado de favoritos");
            } else {
                toast.error(result.messages);
            }
        } else {
            const result = await addFavoriteAction(productId, accessToken);
            if (result.ok) {
                setFavoriteIds((prev) => new Set(prev).add(productId));
                toast.success("Agregado a favoritos");
            } else {
                toast.error(result.messages);
            }
        }

        setTogglingIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
        });
    }

    function getBadgeInfo(product: Product): { label: string; color: string } | null {
        if (product.discount_percent > 0) return { label: "Sale", color: "bg-red-500" };
        // Consider "new" if created within last 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(product.created_at).getTime() > sevenDaysAgo) return { label: "New", color: "bg-green-500" };
        if (product.sales_count > 50) return { label: "Hot", color: "bg-orange-500" };
        return null;
    }

    return (
        <section ref={sectionRef} className="py-20 bg-background" id="shop">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <div ref={titleRef} className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold">
                        {title ? (
                            <span className="text-foreground">{title}</span>
                        ) : (
                            <>
                                <span className="text-foreground">Featured</span> Products
                            </>
                        )}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Discover our handpicked selection of premium products
                    </p>
                </div>

                {/* Empty state */}
                {products.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <PackageX className="w-16 h-16 text-muted-foreground/40" />
                        <p className="text-xl text-muted-foreground">No products found</p>
                        <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
                    </div>
                )}

                {/* Product Grid */}
                {products.length > 0 && (
                    <div
                        ref={gridRef}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {products.map((product) => {
                            const badge = getBadgeInfo(product);
                            const effectivePrice = product.discounted_price ?? product.price;
                            const isFav = favoriteIds.has(product.id);
                            const isToggling = togglingIds.has(product.id);

                            return (
                                <Card
                                    key={product.id}
                                    className="product-card group overflow-hidden border-border/50 hover:border-black/50 dark:hover:border-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10"
                                >
                                    <CardContent className="p-0">
                                        {/* Product Image */}
                                        <div className="relative aspect-square bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-950/20 dark:via-gray-900/20 dark:to-gray-950/20 flex items-center justify-center overflow-hidden">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="text-8xl group-hover:scale-110 transition-transform duration-500">
                                                    📦
                                                </div>
                                            )}

                                            {/* Badge */}
                                            {badge && (
                                                <Badge
                                                    className={`absolute top-3 left-3 ${badge.color} text-white border-none`}
                                                >
                                                    {badge.label}
                                                </Badge>
                                            )}

                                            {/* Wishlist Button */}
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className={`absolute top-3 right-3 transition-all duration-300 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black ${
                                                    isFav ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                }`}
                                                onClick={() => handleToggleFavorite(product.id)}
                                                disabled={isToggling}
                                            >
                                                {isToggling ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Heart
                                                        className={`w-4 h-4 ${
                                                            isFav
                                                                ? "fill-red-500 text-red-500"
                                                                : ""
                                                        }`}
                                                    />
                                                )}
                                            </Button>

                                            {/* Quick Add to Cart */}
                                            <Button
                                                className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.stock <= 0}
                                            >
                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                                            </Button>
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-4 space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">
                                                    {product.category ?? "General"}
                                                </p>
                                                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                    {product.name}
                                                </h3>
                                            </div>

                                            {/* Rating (based on sales_count as a proxy) */}
                                            <div className="flex items-center space-x-1">
                                                <div className="flex items-center">
                                                    {STAR_ARRAY.map((i) => {
                                                        // Derive a pseudo-rating from sales count for display
                                                        const rating = Math.min(5, 3.5 + (product.sales_count / 200));
                                                        return (
                                                            <Star
                                                                key={i}
                                                                className={`w-3 h-3 ${i < Math.floor(rating)
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-gray-300"
                                                                    }`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    ({product.sales_count} sold)
                                                </span>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-lg font-bold text-foreground">
                                                        {formatPrice(effectivePrice)}
                                                    </span>
                                                    {product.discount_percent > 0 && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            {formatPrice(product.price)}
                                                        </span>
                                                    )}
                                                </div>
                                                {product.discount_percent > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        -{Math.round(product.discount_percent)}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* View All Button */}
                {products.length > 0 && (
                    <div className="text-center mt-12">
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-2 hover:bg-gray-50 dark:hover:bg-gray-950/20 transition-all duration-300"
                        >
                            View All Products
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
