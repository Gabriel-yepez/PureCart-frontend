// ============================================================================
// PureCart API Types - Mirror of the FastAPI backend Pydantic models
// ============================================================================

// ─── Generic API Response ───────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  messages: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: string; // defaults to "customer"
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  role: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface OAuthUrlResponse {
  url: string;
}

export interface OAuthCallbackRequest {
  code: string;
  code_verifier: string;
}

// ─── Users ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export interface UserUpdate {
  full_name?: string;
  avatar_url?: string;
}

// ─── Products ───────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_percent: number;
  stock: number;
  category: string | null;
  is_active: boolean;
  image_url: string | null;
  sales_count: number;
  discounted_price: number | null;
  created_at: string;
}

export interface ProductFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

// ─── Favorites ──────────────────────────────────────────────────────────────
/** Embedded product data returned by the Supabase join on user_favorites */
export interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  discount_percent: number;
  image_url: string | null;
  sales_count: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  /** Joined product data (Supabase relation name is "products") */
  products: FavoriteProduct | null;
}

// ─── Transactions ───────────────────────────────────────────────────────────
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface TransactionItemIn {
  product_id: string;
  quantity: number;
}

export interface TransactionCreate {
  items: TransactionItemIn[];
  payment_method: string;
}

export interface TransactionItemOut {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  status: TransactionStatus;
  total: number;
  payment_method: string;
  items: TransactionItemOut[];
  created_at: string;
}

// ─── Payment Methods ────────────────────────────────────────────────────────
export interface PaymentMethod {
  id: string;
  name: string;
  label: string;
  provider: string;
  is_active: boolean;
  created_at: string;
}

// ─── Orders ─────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type ShippingStatus =
  | "pending"
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed_attempt"
  | "returned";

export interface OrderItemIn {
  product_id: string;
  quantity: number;
}

export interface OrderItemOut {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

export interface ShippingIn {
  recipient_name: string;
  phone?: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country_code: string;
}

export interface ShippingOut {
  id: string;
  order_id: string;
  recipient_name: string;
  phone: string | null;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country_code: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_status: ShippingStatus;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreate {
  payment_method_id: string;
  items: OrderItemIn[];
  shipping: ShippingIn;
  coupon_code?: string;
  customer_notes?: string;
  currency?: string;
}

export interface Order {
  id: string;
  user_id: string;
  payment_method_id: string;
  gateway_payment_id: string | null;
  gateway_status: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  currency: string;
  coupon_code: string | null;
  customer_notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemOut[];
  shipping: ShippingOut | null;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  created_at: string;
  item_count: number;
}
