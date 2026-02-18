"use client";

import { useCartStore } from "@/store/cartStore";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

export default function Cart() {
    const { items, isOpen, toggleCart, incrementItem, decrementItem, removeItem, totalPrice } = useCartStore();

    return (
        <Sheet open={isOpen} onOpenChange={toggleCart}>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Your Cart ({items.length})
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 pr-4 mt-8">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-4 text-muted-foreground">
                            <ShoppingCart className="w-12 h-12 opacity-20" />
                            <p>Your cart is empty</p>
                            <Button variant="link" onClick={toggleCart}>
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl flex-shrink-0">
                                        {item.image}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-semibold line-clamp-1">{item.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                ${item.price.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 border rounded-md p-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => decrementItem(item.id)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="text-sm w-4 text-center">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => incrementItem(item.id)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <SheetFooter className="mt-auto border-t pt-6">
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <span>Total</span>
                                <span>${totalPrice().toFixed(2)}</span>
                            </div>
                            <Button className="w-full" size="lg">
                                Checkout
                            </Button>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
