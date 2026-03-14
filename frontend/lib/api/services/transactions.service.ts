// ============================================================================
// Transactions Service
// ============================================================================

import { api } from "../client";
import type { Transaction, TransactionCreate } from "../types";

export const transactionsService = {
  create(data: TransactionCreate, token?: string) {
    return api.post<Transaction>("/transactions", data, { token });
  },

  listMine(token?: string) {
    return api.get<Transaction[]>("/transactions", { token });
  },

  getById(transactionId: string, token?: string) {
    return api.get<Transaction>(`/transactions/${transactionId}`, { token });
  },
} as const;
