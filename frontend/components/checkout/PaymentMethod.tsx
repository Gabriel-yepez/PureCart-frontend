"use client";

import { useEffect, useState } from "react";
import { CreditCard, Wallet, Banknote, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getPaymentMethodsAction } from "@/lib/api/actions";
import type { PaymentMethod as PaymentMethodType } from "@/lib/api/types";
import { toast } from "sonner";

/** Map known provider names to Lucide icons. */
function getProviderIcon(provider: string) {
  const p = provider.toLowerCase();
  if (p.includes("card") || p.includes("stripe")) return CreditCard;
  if (p.includes("paypal") || p.includes("wallet")) return Wallet;
  if (p.includes("transfer") || p.includes("bank")) return Banknote;
  return CreditCard;
}

interface PaymentMethodProps {
  /** Called when the user selects a payment method (or null if deselected). */
  onChange: (methodId: string | null) => void;
}

export function PaymentMethod({ onChange }: PaymentMethodProps) {
  const [methods, setMethods] = useState<PaymentMethodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await getPaymentMethodsAction();

      if (cancelled) return;

      if (result.ok && result.methods.length > 0) {
        setMethods(result.methods);
        // Auto-select first active method
        const first = result.methods[0];
        setSelected(first.id);
        onChange(first.id);
      } else if (!result.ok) {
        toast.error(result.messages || "No se pudieron cargar los métodos de pago");
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(value: string) {
    setSelected(value);
    onChange(value || null);
  }

  return (
    <div className="space-y-6 pt-10">
      <div className="flex flex-col gap-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Método de Pago</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona cómo deseas abonar tu compra.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando métodos de pago…</span>
        </div>
      ) : methods.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-muted text-center">
          <p className="text-sm text-muted-foreground">
            No hay métodos de pago disponibles en este momento.
          </p>
        </div>
      ) : (
        <RadioGroup
          value={selected}
          onValueChange={handleSelect}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {methods.map((method) => {
            const Icon = getProviderIcon(method.provider);
            const isActive = method.is_active;

            return (
              <Label
                key={method.id}
                htmlFor={method.id}
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 p-6 transition-all duration-300 ease-out
                  ${isActive
                    ? "border-muted bg-card/60 hover:bg-accent hover:border-accent hover:text-accent-foreground hover:shadow-md cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    : "border-muted bg-card/60 opacity-60 cursor-not-allowed relative overflow-hidden"
                  }`}
              >
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="sr-only"
                  disabled={!isActive}
                />
                <Icon
                  className={`mb-4 h-8 w-8 text-foreground ${isActive ? "group-hover:scale-110 transition-transform duration-300" : ""}`}
                />
                <span className="font-semibold text-sm">{method.label}</span>
                {!isActive && (
                  <span className="absolute top-2 right-2 text-[10px] bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground font-medium uppercase tracking-wider">
                    Pronto
                  </span>
                )}
              </Label>
            );
          })}
        </RadioGroup>
      )}
    </div>
  );
}
