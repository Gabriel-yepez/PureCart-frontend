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
    if (error instanceof ApiError) {
      return { ok: false, order: null, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[createOrderAction]", detail);
    return { ok: false, order: null, messages: `Failed to create order: ${detail}` };
  }
}

export async function getMyOrdersAction(
  token: string,
): Promise<{ ok: boolean; orders: OrderSummary[]; messages: string }> {
  try {
    const res = await ordersService.listMine(token);
    return { ok: true, orders: res.data ?? [], messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, orders: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getMyOrdersAction]", detail);
    return { ok: false, orders: [], messages: `Failed to load orders: ${detail}` };
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
    if (error instanceof ApiError) {
      return { ok: false, order: null, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getOrderByIdAction]", detail);
    return { ok: false, order: null, messages: `Failed to load order: ${detail}` };
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
    if (error instanceof ApiError) {
      return { ok: false, order: null, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[cancelOrderAction]", detail);
    return { ok: false, order: null, messages: `Failed to cancel order: ${detail}` };
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
    if (error instanceof ApiError) {
      return { ok: false, methods: [], messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getPaymentMethodsAction]", detail);
    return { ok: false, methods: [], messages: `Failed to load payment methods: ${detail}` };
  }
}
