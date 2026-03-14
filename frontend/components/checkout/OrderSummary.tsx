"use client";

import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/lib/api/actions";
import type { OrderCreate, ShippingIn } from "@/lib/api/types";

interface OrderSummaryProps {
  /** Shipping data from the ShippingForm */
  shippingData?: ShippingIn;
  /** Selected payment method ID */
  paymentMethodId?: string;
}

export function OrderSummary({ shippingData, paymentMethodId }: OrderSummaryProps) {
  const { items, totalPrice, clearCart } = useCartStore();
  const { isAuthenticated, accessToken } = useAuthStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = totalPrice();
  const shippingCost = subtotal > 100 ? 0 : 15;
  const taxes = subtotal * 0.16;
  const total = subtotal + shippingCost + taxes;

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Tu carrito esta vacio");
      return;
    }

    if (!isAuthenticated || !accessToken) {
      toast.error("Por favor, inicia sesion para continuar");
      router.push("/signin?redirect=/checkout");
      return;
    }

    if (!shippingData) {
      toast.error("Por favor, completa los datos de envio");
      return;
    }

    if (!paymentMethodId) {
      toast.error("Por favor, selecciona un metodo de pago");
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload: OrderCreate = {
        payment_method_id: paymentMethodId,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        shipping: shippingData,
        currency: "USD",
      };

      const result = await createOrderAction(orderPayload, accessToken);

      if (result.ok && result.order) {
        clearCart();
        toast.success("Pedido creado con exito", {
          description: `Orden #${result.order.id.slice(0, 8)} - ${formatPrice(result.order.total)}`,
        });
        router.push("/");
      } else {
        toast.error(result.messages || "Error al procesar el pedido");
      }
    } catch {
      toast.error("Error inesperado al procesar el pedido");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm sticky top-24">
      <h3 className="text-xl font-bold tracking-tight mb-6">Resumen de tu orden</h3>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay productos en tu carrito.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border">
                {item.image.startsWith("http") ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl bg-muted">
                    {item.image}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <h4 className="text-sm font-semibold line-clamp-2">{item.name}</h4>
                <p className="text-xs text-muted-foreground">Cant: {item.quantity}</p>
              </div>
              <div className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))
        )}
      </div>

      <Separator className="my-6" />

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Envio</span>
          <span>{shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Impuestos</span>
          <span>{formatPrice(taxes)}</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between items-end mb-6">
        <span className="font-bold text-lg">Total</span>
        <span className="font-bold text-2xl text-primary">{formatPrice(total)}</span>
      </div>

      <div className="space-y-4">
        <Button
          size="lg"
          className="w-full text-base font-semibold transition-all"
          onClick={handleCheckout}
          disabled={isProcessing || items.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Procesando Pago...
            </>
          ) : (
            "Completar Compra"
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Pago 100% seguro</span>
        </div>
      </div>
    </div>
  );
}
