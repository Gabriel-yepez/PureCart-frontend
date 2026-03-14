// ============================================================================
// Orders Service - Create, list, get, cancel orders
// ============================================================================

import { api } from "../client";
import type { Order, OrderCreate, OrderSummary } from "../types";

export const ordersService = {
  create(data: OrderCreate, token?: string) {
    return api.post<Order>("/orders", data, { token });
  },

  listMine(token?: string) {
    return api.get<OrderSummary[]>("/orders", { token });
  },

  getById(orderId: string, token?: string) {
    return api.get<Order>(`/orders/${orderId}`, { token });
  },

  cancel(orderId: string, token?: string) {
    return api.post<Order>(`/orders/${orderId}/cancel`, undefined, { token });
  },
} as const;
