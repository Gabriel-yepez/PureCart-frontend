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

  /** Get OAuth URL with PKCE code_challenge for Authorization Code flow */
  getOAuthUrl(provider: "google" | "facebook" | "twitter", codeChallenge: string) {
    return api.get<OAuthUrlResponse>(
      `/auth/login/${provider}?code_challenge=${encodeURIComponent(codeChallenge)}`,
    );
  },

  /** Exchange an authorization code + PKCE code_verifier for app JWT tokens */
  exchangeOAuthCode(code: string, codeVerifier: string) {
    return api.post<TokenResponse>("/auth/oauth/callback", {
      code,
      code_verifier: codeVerifier,
    });
  },
} as const;
