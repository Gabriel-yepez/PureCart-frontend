// ============================================================================
// Users Service - Profile retrieval and update
// ============================================================================

import { api } from "../client";
import type { User, UserUpdate } from "../types";

export const usersService = {
  getMyProfile(token?: string) {
    return api.get<User>("/users/me", { token });
  },

  updateMyProfile(data: UserUpdate, token?: string) {
    return api.put<User>("/users/me", data, { token });
  },

  getUserById(userId: string, token?: string) {
    return api.get<User>(`/users/${userId}`, { token });
  },
} as const;
