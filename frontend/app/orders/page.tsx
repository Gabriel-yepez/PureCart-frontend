"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { getMyOrdersAction, cancelOrderAction } from "@/lib/api/actions";
import type { OrderSummary } from "@/lib/api/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Loader2,
  PackageOpen,
  LogIn,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

/** Map order status to a visual representation */
function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending:            { label: "Pendiente",    variant: "secondary",    icon: <Clock className="w-3 h-3" /> },
    payment_pending:    { label: "Pago Pendiente", variant: "outline",   icon: <Clock className="w-3 h-3" /> },
    paid:               { label: "Pagado",       variant: "default",     icon: <CheckCircle2 className="w-3 h-3" /> },
    processing:         { label: "Procesando",   variant: "secondary",   icon: <Package className="w-3 h-3" /> },
    shipped:            { label: "Enviado",      variant: "default",     icon: <Truck className="w-3 h-3" /> },
    delivered:          { label: "Entregado",    variant: "default",     icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled:          { label: "Cancelado",    variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
    refunded:           { label: "Reembolsado",  variant: "outline",     icon: <XCircle className="w-3 h-3" /> },
    partially_refunded: { label: "Reembolso Parcial", variant: "outline", icon: <XCircle className="w-3 h-3" /> },
  };
  return map[status] ?? { label: status, variant: "secondary" as const, icon: null };
}

export default function OrdersPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function load() {
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await getMyOrdersAction(accessToken);
      if (result.ok) {
        setOrders(result.orders);
      } else {
        toast.error(result.messages);
      }
      setLoading(false);
    }

    load();
  }, [mounted, isAuthenticated, accessToken]);

  async function handleCancel(orderId: string) {
    if (!accessToken) return;

    setCancellingIds((prev) => new Set(prev).add(orderId));

    const result = await cancelOrderAction(orderId, accessToken);
    if (result.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
      );
      toast.success("Orden cancelada exitosamente");
    } else {
      toast.error(result.messages);
    }

    setCancellingIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }

  const canCancel = (status: string) =>
    ["pending", "payment_pending"].includes(status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="grow container mx-auto px-4 py-8 mt-20">
        <h1 className="text-3xl font-bold mb-2">Mis Pedidos</h1>
        <p className="text-muted-foreground mb-8">
          Historial y estado de tus compras.
        </p>

        {/* Not authenticated */}
        {mounted && !isAuthenticated && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <LogIn className="w-16 h-16 text-muted-foreground/40" />
            <p className="text-xl text-muted-foreground">
              Inicia sesión para ver tus pedidos
            </p>
            <Button asChild>
              <Link href="/signin?redirect=/orders">Iniciar Sesión</Link>
            </Button>
          </div>
        )}

        {/* Loading */}
        {mounted && isAuthenticated && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {mounted && isAuthenticated && !loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <PackageOpen className="w-16 h-16 text-muted-foreground/40" />
            <p className="text-xl text-muted-foreground">No tienes pedidos aún</p>
            <p className="text-muted-foreground">
              Cuando realices una compra, aparecerá aquí.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Explorar Productos</Link>
            </Button>
          </div>
        )}

        {/* Orders list */}
        {mounted && isAuthenticated && !loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              const isCancelling = cancellingIds.has(order.id);

              return (
                <div
                  key={order.id}
                  className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-base">
                        Orden #{order.id.slice(0, 8)}
                      </h3>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {" · "}
                      {order.item_count} {order.item_count === 1 ? "producto" : "productos"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">
                      {formatPrice(order.total)}
                    </span>
                    {canCancel(order.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleCancel(order.id)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
