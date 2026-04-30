"use server";

import { cookies } from "next/headers";
import { authService } from "../services";
import { usersService } from "../services";
import { ApiError } from "../client";
import type { User } from "../types";

export interface AuthActionResult {
  ok: boolean;
  messages: string;
  user?: User;
  role?: string;
}

const COOKIE_OPTS_ACCESS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 15,
};

const COOKIE_OPTS_REFRESH = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const store = await cookies();
  store.set("pca-access", accessToken, COOKIE_OPTS_ACCESS);
  store.set("pca-refresh", refreshToken, COOKIE_OPTS_REFRESH);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete("pca-access");
  store.delete("pca-refresh");
}

export async function loginAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  try {
    const tokenRes = await authService.login({ email, password });
    const tokens = tokenRes.data!;
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: tokenRes.messages,
      user: userRes.data ?? undefined,
      role: tokens.role,
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
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: tokenRes.messages,
      user: userRes.data ?? undefined,
      role: tokens.role,
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
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: "Token refreshed",
      user: userRes.data ?? undefined,
      role: tokens.role,
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
    await setAuthCookies(tokens.access_token, tokens.refresh_token);
    const userRes = await usersService.getMyProfile(tokens.access_token);
    return {
      ok: true,
      messages: tokenRes.messages,
      user: userRes.data ?? undefined,
      role: tokens.role,
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
