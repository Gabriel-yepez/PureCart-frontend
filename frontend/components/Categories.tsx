"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface Category {
    id: number;
    name: string;
    icon: string;
    count: number;
    gradient: string;
}

const categories: Category[] = [
    {
        id: 1,
        name: "Electronics",
        icon: "💻",
        count: 1234,
        gradient: "from-gray-800 to-gray-600",
    },
    {
        id: 2,
        name: "Fashion",
        icon: "👗",
        count: 2456,
        gradient: "from-gray-700 to-gray-500",
    },
    {
        id: 3,
        name: "Home & Living",
        icon: "🏠",
        count: 987,
        gradient: "from-gray-600 to-gray-400",
    },
    {
        id: 4,
        name: "Sports",
        icon: "⚽",
        count: 654,
        gradient: "from-black to-gray-800",
    },
    {
        id: 5,
        name: "Beauty",
        icon: "💄",
        count: 1567,
        gradient: "from-gray-500 to-gray-300",
    },
    {
        id: 6,
        name: "Books",
        icon: "📚",
        count: 789,
        gradient: "from-gray-900 to-gray-700",
    },
];

export default function Categories() {
    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
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

            const cards = gridRef.current?.querySelectorAll(".category-card");
            if (cards) {
                gsap.from(cards, {
                    scrollTrigger: {
                        trigger: gridRef.current,
                        start: "top 70%",
                    },
                    opacity: 0,
                    scale: 0.8,
                    stagger: 0.1,
                    duration: 0.6,
                    ease: "back.out(1.7)",
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="py-20 bg-gradient-to-b from-background to-muted/20"
            id="categories"
        >
            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <div ref={titleRef} className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold">
                        Shop by{" "}
                        <span className="text-foreground border-b-4 border-black dark:border-white">
                            Category
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Browse through our diverse range of product categories
                    </p>
                </div>

                {/* Categories Grid */}
                <div
                    ref={gridRef}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
                >
                    {categories.map((category) => (
                        <Card
                            key={category.id}
                            className="category-card group cursor-pointer border-border/50 hover:border-transparent transition-all duration-300 hover:shadow-xl overflow-hidden"
                        >
                            <CardContent className="p-6 text-center space-y-4 relative">
                                {/* Gradient Background on Hover */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                                ></div>

                                {/* Icon */}
                                <div className="relative">
                                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                                        {category.icon}
                                    </div>
                                </div>

                                {/* Category Info */}
                                <div className="relative space-y-1">
                                    <h3 className="font-semibold text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {category.count} items
                                    </p>
                                </div>

                                {/* Arrow Icon */}
                                <div className="relative">
                                    <ArrowRight className="w-4 h-4 mx-auto text-muted-foreground group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
