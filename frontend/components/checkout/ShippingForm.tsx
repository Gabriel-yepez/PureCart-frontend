"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShippingIn } from "@/lib/api/types";

/** The internal form state mirrors ShippingIn but everything is a string for input binding. */
interface ShippingFormState {
  recipient_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
}

const INITIAL_STATE: ShippingFormState = {
  recipient_name: "",
  phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country_code: "US",
};

interface ShippingFormProps {
  /** Called whenever the form changes.  `null` when required fields are missing. */
  onChange: (data: ShippingIn | null) => void;
}

function isValid(s: ShippingFormState): s is ShippingFormState & { recipient_name: string; address_line1: string; city: string; postal_code: string; country_code: string } {
  return (
    s.recipient_name.trim().length > 0 &&
    s.address_line1.trim().length > 0 &&
    s.city.trim().length > 0 &&
    s.postal_code.trim().length > 0 &&
    s.country_code.trim().length > 0
  );
}

export function ShippingForm({ onChange }: ShippingFormProps) {
  const [form, setForm] = useState<ShippingFormState>(INITIAL_STATE);

  // Notify parent whenever the form changes
  useEffect(() => {
    if (isValid(form)) {
      const shipping: ShippingIn = {
        recipient_name: form.recipient_name.trim(),
        address_line1: form.address_line1.trim(),
        city: form.city.trim(),
        postal_code: form.postal_code.trim(),
        country_code: form.country_code.trim(),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        ...(form.email.trim() && { email: form.email.trim() }),
        ...(form.address_line2.trim() && { address_line2: form.address_line2.trim() }),
        ...(form.state.trim() && { state: form.state.trim() }),
      };
      onChange(shipping);
    } else {
      onChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleChange = useCallback(
    (field: keyof ShippingFormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Datos de Envío</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa la dirección donde deseas recibir tu pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipient name (required) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="recipient_name">
            Nombre completo del destinatario <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient_name"
            placeholder="Juan Pérez"
            value={form.recipient_name}
            onChange={handleChange("recipient_name")}
            required
          />
        </div>

        {/* Address line 1 (required) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address_line1">
            Dirección <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address_line1"
            placeholder="Ej: Av. Principal 123, Depto 4"
            value={form.address_line1}
            onChange={handleChange("address_line1")}
            required
          />
        </div>

        {/* Address line 2 (optional) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address_line2">Dirección (línea 2)</Label>
          <Input
            id="address_line2"
            placeholder="Piso, edificio, referencia…"
            value={form.address_line2}
            onChange={handleChange("address_line2")}
          />
        </div>

        {/* City (required) */}
        <div className="space-y-2">
          <Label htmlFor="city">
            Ciudad <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Ciudad o Municipio"
            value={form.city}
            onChange={handleChange("city")}
            required
          />
        </div>

        {/* State (optional) */}
        <div className="space-y-2">
          <Label htmlFor="state">Estado / Provincia</Label>
          <Input
            id="state"
            placeholder="Estado"
            value={form.state}
            onChange={handleChange("state")}
          />
        </div>

        {/* Postal code (required) */}
        <div className="space-y-2">
          <Label htmlFor="postal_code">
            Código Postal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="postal_code"
            placeholder="12345"
            value={form.postal_code}
            onChange={handleChange("postal_code")}
            required
          />
        </div>

        {/* Country code (required, default US) */}
        <div className="space-y-2">
          <Label htmlFor="country_code">
            País (código) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="country_code"
            placeholder="US"
            value={form.country_code}
            onChange={handleChange("country_code")}
            required
          />
        </div>

        {/* Phone (optional) */}
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={form.phone}
            onChange={handleChange("phone")}
          />
        </div>

        {/* Email (optional) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email de contacto</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@ejemplo.com"
            value={form.email}
            onChange={handleChange("email")}
          />
        </div>
      </div>
    </div>
  );
}
