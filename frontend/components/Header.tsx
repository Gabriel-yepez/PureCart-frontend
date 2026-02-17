"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, Search, Menu, X, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import gsap from "gsap";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { totalItems, toggleCart } = useCartStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    const logoRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (logoRef.current) {
            gsap.from(logoRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.8,
                ease: "power3.out",
                onComplete: () => {
                    if (logoRef.current) {
                        gsap.set(logoRef.current, { clearProps: "all" });
                    }
                },
            });
        }
    }, []);

    const navItems = [
        { name: "Mens", href: "/category/mens" },
        { name: "Womens", href: "/category/womens" },
        { name: "Kids", href: "/category/kids" },
        { name: "Sale", href: "/category/sale" },
    ];

    return (
        <header
            ref={headerRef}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "bg-white/80 dark:bg-black/80 backdrop-blur-lg shadow-lg"
                : "bg-transparent"
                }`}
        >
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" ref={logoRef} className="flex flex-row items-center space-x-2 cursor-pointer">
                        <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white dark:text-black font-bold text-xl">P</span>
                        </div>
                        <span className="text-2xl font-bold text-black dark:text-white">
                            PureCart
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        {navItems.map((item, index) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative group"
                                style={{
                                    animation: `fadeInDown 0.5s ease-out ${index * 0.1}s both`,
                                }}
                            >
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white group-hover:w-full transition-all duration-300"></span>
                            </a>
                        ))}
                    </nav>

                    {/* Search Bar - Desktop */}
                    <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="pl-10 pr-4 py-2 w-full bg-muted/50 border-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex relative hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <Link href="/favorites">
                                <Heart className="w-5 h-5" />
                            </Link>
                        </Button>


                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <Link href="/signin">
                                <User className="w-5 h-5" />
                            </Link>
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            onClick={toggleCart}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {totalItems() > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-black dark:bg-white text-white dark:text-black border-none text-xs">
                                    {totalItems()}
                                </Badge>
                            )}
                        </Button>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-border/50 animate-in slide-in-from-top-5 duration-300">
                        <div className="flex flex-col space-y-4">
                            {/* Mobile Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    className="pl-10 pr-4 py-2 w-full bg-muted/50 border-none"
                                />
                            </div>

                            {/* Mobile Nav Items */}
                            {navItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.name}
                                </a>
                            ))}

                            {/* Mobile Action Buttons */}
                            <div className="flex items-center space-x-4 pt-4 border-t border-border/50">
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/favorites">
                                        <Heart className="w-4 h-4 mr-2" />
                                        Wishlist
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/signin">
                                        <User className="w-4 h-4 mr-2" />
                                        Account
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </header>
    );
}
