"use client";

import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
    const footerLinks = {
        shop: [
            { name: "All Products", href: "#" },
            { name: "New Arrivals", href: "#" },
            { name: "Best Sellers", href: "#" },
            { name: "Sale", href: "#" },
        ],
        company: [
            { name: "About Us", href: "#" },
            { name: "Careers", href: "#" },
            { name: "Press", href: "#" },
            { name: "Contact", href: "#" },
        ],
        support: [
            { name: "Help Center", href: "#" },
            { name: "Shipping Info", href: "#" },
            { name: "Returns", href: "#" },
            { name: "Track Order", href: "#" },
        ],
        legal: [
            { name: "Privacy Policy", href: "#" },
            { name: "Terms of Service", href: "#" },
            { name: "Cookie Policy", href: "#" },
            { name: "Sitemap", href: "#" },
        ],
    };

    const socialLinks = [
        { icon: Facebook, href: "#", label: "Facebook" },
        { icon: Twitter, href: "#", label: "Twitter" },
        { icon: Instagram, href: "#", label: "Instagram" },
        { icon: Youtube, href: "#", label: "Youtube" },
    ];

    return (
        <footer className="bg-muted/30 border-t border-border/50">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Newsletter Section */}
                <div className="py-12 border-b border-border/50">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl md:text-3xl font-bold">
                                Subscribe to Our{" "}
                                <span className="text-foreground border-b-4 border-black dark:border-white">
                                    Newsletter
                                </span>
                            </h3>
                            <p className="text-muted-foreground">
                                Get the latest updates on new products and exclusive deals
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10 pr-4 py-6 bg-background"
                                />
                            </div>
                            <Button
                                size="lg"
                                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-6 cursor-pointer"
                            >
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Footer Content */}
                <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {/* Brand Column */}
                    <div className="col-span-2 space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white dark:text-black font-bold text-xl">P</span>
                            </div>
                            <span className="text-2xl font-bold text-black dark:text-white">
                                PureCart
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Your one-stop destination for premium products. Quality,
                            affordability, and style - all in one place.
                        </p>
                        <div className="flex items-center space-x-3">
                            {socialLinks.map((social) => (
                                <Button
                                    key={social.label}
                                    variant="outline"
                                    size="icon"
                                    className="hover:bg-black/10 dark:hover:bg-white/10 hover:border-black dark:hover:border-white transition-all duration-300"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-4 h-4" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Shop</h4>
                        <ul className="space-y-2">
                            {footerLinks.shop.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Company</h4>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Support</h4>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Legal</h4>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-purple-600 transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="py-6 border-t border-border/50">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm text-muted-foreground">
                            © 2026 PureCart. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-6">
                            <span className="text-sm text-muted-foreground">
                                We accept:
                            </span>
                            <div className="flex items-center space-x-2">
                                <div className="px-3 py-1 bg-background border border-border/50 rounded text-xs font-medium">
                                    💳 Visa
                                </div>
                                <div className="px-3 py-1 bg-background border border-border/50 rounded text-xs font-medium">
                                    💳 Mastercard
                                </div>
                                <div className="px-3 py-1 bg-background border border-border/50 rounded text-xs font-medium">
                                    💳 PayPal
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
