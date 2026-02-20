"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface Product {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    badge?: string;
    category: string;
}

const products: Product[] = [
    {
        id: 1,
        name: "Premium Wireless Headphones",
        price: 299,
        originalPrice: 399,
        rating: 4.8,
        reviews: 234,
        image: "🎧",
        badge: "Sale",
        category: "Electronics",
    },
    {
        id: 2,
        name: "Designer Leather Bag",
        price: 189,
        rating: 4.9,
        reviews: 156,
        image: "👜",
        badge: "New",
        category: "Fashion",
    },
    {
        id: 3,
        name: "Smart Watch Pro",
        price: 449,
        originalPrice: 549,
        rating: 4.7,
        reviews: 892,
        image: "⌚",
        badge: "Hot",
        category: "Electronics",
    },
    {
        id: 4,
        name: "Minimalist Sneakers",
        price: 129,
        rating: 4.6,
        reviews: 445,
        image: "👟",
        category: "Fashion",
    },
    {
        id: 5,
        name: "Portable Speaker",
        price: 89,
        originalPrice: 129,
        rating: 4.5,
        reviews: 678,
        image: "🔊",
        badge: "Sale",
        category: "Electronics",
    },
    {
        id: 6,
        name: "Sunglasses Collection",
        price: 159,
        rating: 4.8,
        reviews: 234,
        image: "🕶️",
        badge: "New",
        category: "Fashion",
    },
    {
        id: 7,
        name: "Laptop Backpack",
        price: 79,
        rating: 4.7,
        reviews: 567,
        image: "🎒",
        category: "Accessories",
    },
    {
        id: 8,
        name: "Wireless Earbuds",
        price: 149,
        originalPrice: 199,
        rating: 4.9,
        reviews: 1234,
        image: "🎵",
        badge: "Hot",
        category: "Electronics",
    },
];

interface ProductGridProps {
    title?: string;
    category?: string;
}

export default function ProductGrid({ title, category }: ProductGridProps = {}) {
    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const { addItem } = useCartStore();

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
            if (cards) {
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
    }, []);

    const filteredProducts = products.filter(product => {
        if (!category) return true;
        const searchCategory = category.toLowerCase();

        // Handle Sale category
        if (searchCategory === 'sale') {
            return product.badge === 'Sale';
        }

        // Map gender categories to Fashion for demo purposes
        if (['mens', 'womens', 'kids'].includes(searchCategory)) {
            return product.category === 'Fashion';
        }

        return product.category.toLowerCase() === searchCategory;
    });

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

                {/* Product Grid */}
                <div
                    ref={gridRef}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {filteredProducts.map((product) => (
                        <Card
                            key={product.id}
                            className="product-card group overflow-hidden border-border/50 hover:border-black/50 dark:hover:border-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10"
                        >
                            <CardContent className="p-0">
                                {/* Product Image */}
                                <div className="relative aspect-square bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-950/20 dark:via-gray-900/20 dark:to-gray-950/20 flex items-center justify-center overflow-hidden">
                                    <div className="text-8xl group-hover:scale-110 transition-transform duration-500">
                                        {product.image}
                                    </div>

                                    {/* Badge */}
                                    {product.badge && (
                                        <Badge
                                            className={`absolute top-3 left-3 ${product.badge === "Sale"
                                                ? "bg-red-500"
                                                : product.badge === "New"
                                                    ? "bg-green-500"
                                                    : "bg-orange-500"
                                                } text-white border-none`}
                                        >
                                            {product.badge}
                                        </Badge>
                                    )}

                                    {/* Wishlist Button */}
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black"
                                    >
                                        <Heart className="w-4 h-4" />
                                    </Button>

                                    {/* Quick Add to Cart */}
                                    <Button
                                        className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                        onClick={() => addItem({
                                            id: product.id.toString(),
                                            name: product.name,
                                            price: product.price,
                                            image: product.image
                                        })}
                                    >
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Add to Cart
                                    </Button>
                                </div>

                                {/* Product Info */}
                                <div className="p-4 space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            {product.category}
                                        </p>
                                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                                            {product.name}
                                        </h3>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center space-x-1">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < Math.floor(product.rating)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {product.rating} ({product.reviews})
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg font-bold text-foreground">
                                                ${product.price}
                                            </span>
                                            {product.originalPrice && (
                                                <span className="text-sm text-muted-foreground line-through">
                                                    ${product.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                        {product.originalPrice && (
                                            <Badge variant="secondary" className="text-xs">
                                                -
                                                {Math.round(
                                                    ((product.originalPrice - product.price) /
                                                        product.originalPrice) *
                                                    100
                                                )}
                                                %
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* View All Button */}
                <div className="text-center mt-12">
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-2 hover:bg-gray-50 dark:hover:bg-gray-950/20 transition-all duration-300"
                    >
                        View All Products
                    </Button>
                </div>
            </div>
        </section>
    );
}
