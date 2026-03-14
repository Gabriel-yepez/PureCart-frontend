"use server";

// ============================================================================
// Auth Server Actions
// ============================================================================
// These run exclusively on the server. They call the backend API and return
// a serializable result to the client. Tokens are returned to be stored in
// the client-side Zustand store (via localStorage/persist).
// ============================================================================

import { authService } from "../services";
import { usersService } from "../services";
import { ApiError } from "../client";
import type { User } from "../types";

export interface AuthActionResult {
  ok: boolean;
  messages: string;
  tokens?: {
    access_token: string;
    refresh_token: string;
    role: string;
  };
  user?: User;
}

export async function loginAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.login({ email, password });
    const tokens = tokenRes.data!;

    // Immediately fetch the user profile using the fresh token
    const userRes = await usersService.getMyProfile(tokens.access_token);

    return {
      ok: true,
      messages: tokenRes.messages,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        role: tokens.role,
      },
      user: userRes.data ?? undefined,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[loginAction]", detail);
    return { ok: false, messages: `Login failed: ${detail}` };
  }
}

export async function registerAction(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.register({
      email,
      password,
      full_name: fullName,
      role: "customer",
    });
    const tokens = tokenRes.data!;

    // Fetch the newly created user's profile
    const userRes = await usersService.getMyProfile(tokens.access_token);

    return {
      ok: true,
      messages: tokenRes.messages,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        role: tokens.role,
      },
      user: userRes.data ?? undefined,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[registerAction]", detail);
    return { ok: false, messages: `Registration failed: ${detail}` };
  }
}

export async function refreshTokenAction(
  refreshToken: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.refresh(refreshToken);
    const tokens = tokenRes.data!;

    const userRes = await usersService.getMyProfile(tokens.access_token);

    return {
      ok: true,
      messages: "Token refreshed",
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        role: tokens.role,
      },
      user: userRes.data ?? undefined,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[refreshTokenAction]", detail);
    return { ok: false, messages: `Session refresh failed: ${detail}` };
  }
}

export async function getOAuthUrlAction(
  provider: "google" | "facebook" | "twitter",
  codeChallenge: string,
): Promise<{ ok: boolean; url?: string; messages: string }> {
  try {
    const res = await authService.getOAuthUrl(provider, codeChallenge);
    return { ok: true, url: res.data?.url, messages: res.messages };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[getOAuthUrlAction]", detail);
    return { ok: false, messages: `OAuth URL failed: ${detail}` };
  }
}

export async function exchangeOAuthCodeAction(
  code: string,
  codeVerifier: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.exchangeOAuthCode(code, codeVerifier);
    const tokens = tokenRes.data!;

    // Fetch the user profile using the fresh app token
    const userRes = await usersService.getMyProfile(tokens.access_token);

    return {
      ok: true,
      messages: tokenRes.messages,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        role: tokens.role,
      },
      user: userRes.data ?? undefined,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, messages: error.messages };
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[exchangeOAuthCodeAction]", detail);
    return { ok: false, messages: `OAuth exchange failed: ${detail}` };
  }
}
