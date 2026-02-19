"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";

export default function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.from(titleRef.current, {
                opacity: 0,
                y: 50,
                duration: 1,
                delay: 0.3,
            })
                .from(
                    subtitleRef.current,
                    {
                        opacity: 0,
                        y: 30,
                        duration: 0.8,
                    },
                    "-=0.5"
                )
                .from(
                    ctaRef.current,
                    {
                        opacity: 0,
                        y: 20,
                        duration: 0.8,
                    },
                    "-=0.5"
                )
                .from(
                    imageRef.current,
                    {
                        opacity: 0,
                        scale: 0.8,
                        duration: 1,
                    },
                    "-=1"
                );

            // Floating animation for the image
            gsap.to(imageRef.current, {
                y: -20,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950/20 dark:via-black/20 dark:to-gray-950/20 my-10"
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gray-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gray-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10 my-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left space-y-8">
                        <h1
                            ref={titleRef}
                            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
                        >
                            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-500 bg-clip-text text-transparent">
                                Discover
                            </span>
                            <br />
                            Your Style
                            <br />
                            <span className="text-foreground/80">Today</span>
                        </h1>

                        <div className="inline-flex items-center space-x-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-800/50">
                            <Sparkles className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                New Collection 2026
                            </span>
                        </div>

                        <p
                            ref={subtitleRef}
                            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0"
                        >
                            Explore our curated collection of premium products. From fashion
                            to electronics, find everything you need in one place.
                        </p>

                        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                                Shop Now
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 hover:bg-gray-50 dark:hover:bg-gray-950/20 transition-all duration-300"
                            >
                                View Collections
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
                            <div>
                                <div className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    10k+
                                </div>
                                <div className="text-sm text-muted-foreground">Products</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    50k+
                                </div>
                                <div className="text-sm text-muted-foreground">Customers</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    4.9★
                                </div>
                                <div className="text-sm text-muted-foreground">Rating</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Hero Image */}
                    <div ref={imageRef} className="relative">
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-400 to-gray-400 rounded-3xl rotate-6 opacity-20 blur-2xl"></div>

                            {/* Main Image Container */}
                            <div className="relative bg-gradient-to-br from-gray-500 via-gray-500 to-gray-400 rounded-3xl p-1 shadow-2xl">
                                <div className="bg-white dark:bg-black rounded-3xl p-8 h-full flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className="w-48 h-48 mx-auto bg-gradient-to-br from-gray-400 via-gray-400 to-gray-400 rounded-full flex items-center justify-center shadow-xl">
                                            <Sparkles className="w-24 h-24 text-white" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Premium Quality Products
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-500 rounded-2xl shadow-lg animate-bounce-slow"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
        </section>
    );
}
