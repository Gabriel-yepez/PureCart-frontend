// ============================================================================
// Auth Service - Login, Register, Refresh, OAuth
// ============================================================================

import { api } from "../client";
import type { TokenResponse, LoginRequest, RegisterRequest, OAuthUrlResponse } from "../types";

export const authService = {
  login(data: LoginRequest) {
    return api.post<TokenResponse>("/auth/login", data);
  },

  register(data: RegisterRequest) {
    return api.post<TokenResponse>("/auth/register", data);
  },

  refresh(refresh_token: string) {
    return api.post<TokenResponse>("/auth/refresh", { refresh_token });
  },

  logout() {
    return api.post<null>("/auth/logout", undefined, { rawResponse: true });
  },

  getOAuthUrl(provider: "google" | "facebook" | "twitter") {
    return api.get<OAuthUrlResponse>(`/auth/login/${provider}`);
  },

  /** Exchange a Supabase OAuth access_token for app JWT tokens */
  exchangeOAuthToken(supabaseAccessToken: string) {
    return api.post<TokenResponse>("/auth/oauth/callback", {
      access_token: supabaseAccessToken,
    });
  },
} as const;
