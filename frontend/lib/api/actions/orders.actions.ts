"use server";

// ============================================================================
// Order Server Actions - Checkout / Order management
// ============================================================================

import { ordersService } from "../services";
import { paymentMethodsService } from "../services";
import { ApiError } from "../client";
import type { Order, OrderCreate, OrderSummary, PaymentMethod } from "../types";

export interface OrderResult {
  ok: boolean;
  order: Order | null;
  messages: string;
}

export async function createOrderAction(
  data: OrderCreate,
  token: string,
): Promise<OrderResult> {
  try {
    const res = await ordersService.create(data, token);
    return { ok: true, order: res.data ?? null, messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to create order";
    return { ok: false, order: null, messages: msg };
  }
}

export async function getMyOrdersAction(
  token: string,
): Promise<{ ok: boolean; orders: OrderSummary[]; messages: string }> {
  try {
    const res = await ordersService.listMine(token);
    return { ok: true, orders: res.data ?? [], messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load orders";
    return { ok: false, orders: [], messages: msg };
  }
}

export async function getOrderByIdAction(
  orderId: string,
  token: string,
): Promise<OrderResult> {
  try {
    const res = await ordersService.getById(orderId, token);
    return { ok: true, order: res.data ?? null, messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load order";
    return { ok: false, order: null, messages: msg };
  }
}

export async function cancelOrderAction(
  orderId: string,
  token: string,
): Promise<OrderResult> {
  try {
    const res = await ordersService.cancel(orderId, token);
    return { ok: true, order: res.data ?? null, messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to cancel order";
    return { ok: false, order: null, messages: msg };
  }
}

export async function getPaymentMethodsAction(): Promise<{
  ok: boolean;
  methods: PaymentMethod[];
  messages: string;
}> {
  try {
    const res = await paymentMethodsService.list();
    return { ok: true, methods: res.data ?? [], messages: res.messages };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? error.messages
        : "Failed to load payment methods";
    return { ok: false, methods: [], messages: msg };
  }
}
