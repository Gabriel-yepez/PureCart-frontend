"use client";

import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { PaymentMethod } from "@/components/checkout/PaymentMethod";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ShippingIn } from "@/lib/api/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // ─── Lifted state for shipping + payment ────────────────────────────────
  const [shippingData, setShippingData] = useState<ShippingIn | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/signin?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  // Stable callbacks so child components don't re-render needlessly
  const handleShippingChange = useCallback((data: ShippingIn | null) => {
    setShippingData(data);
  }, []);

  const handlePaymentChange = useCallback((methodId: string | null) => {
    setPaymentMethodId(methodId);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 pb-20 pt-10 px-4 md:px-8 max-w-7xl mx-auto mt-20 animate-in fade-in duration-700">
      <div className="mb-10 text-center md:text-left">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors w-fit group mb-6 mx-auto md:mx-0"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver al Inicio
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Completa los datos de envío y pago para finalizar tu pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Forms – Left side */}
        <div className="lg:col-span-8 space-y-12">
          {/* Shipping */}
          <section className="bg-card p-6 md:p-8 rounded-3xl border shadow-sm transition-all hover:shadow-md">
            <ShippingForm onChange={handleShippingChange} />
          </section>

          {/* Payment */}
          <section className="bg-card p-6 md:p-8 rounded-3xl border shadow-sm transition-all hover:shadow-md">
            <PaymentMethod onChange={handlePaymentChange} />
          </section>
        </div>

        {/* Summary – Right side */}
        <div className="lg:col-span-4 relative">
          <OrderSummary
            shippingData={shippingData ?? undefined}
            paymentMethodId={paymentMethodId ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
