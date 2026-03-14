// ============================================================================
// Shipping Service
// ============================================================================

import { api } from "../client";
import type { ShippingOut } from "../types";

export const shippingService = {
  getByOrderId(orderId: string, token?: string) {
    return api.get<ShippingOut>(`/shipping/${orderId}`, { token });
  },
} as const;
