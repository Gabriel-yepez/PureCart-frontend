// ============================================================================
// Payment Methods Service
// ============================================================================

import { api } from "../client";
import type { PaymentMethod } from "../types";

export const paymentMethodsService = {
  list() {
    return api.get<PaymentMethod[]>("/payment-methods");
  },

  getById(methodId: string) {
    return api.get<PaymentMethod>(`/payment-methods/${methodId}`);
  },
} as const;
