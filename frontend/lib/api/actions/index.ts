// Barrel export for all Server Actions
export {
  loginAction,
  registerAction,
  refreshTokenAction,
  getOAuthUrlAction,
} from "./auth.actions";

export {
  getProductsAction,
  getDiscountedProductsAction,
  getBestSellersAction,
  getProductByIdAction,
} from "./products.actions";

export {
  getFavoritesAction,
  addFavoriteAction,
  removeFavoriteAction,
} from "./favorites.actions";

export {
  createOrderAction,
  getMyOrdersAction,
  getOrderByIdAction,
  cancelOrderAction,
  getPaymentMethodsAction,
} from "./orders.actions";
