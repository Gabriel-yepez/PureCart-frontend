"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { exchangeOAuthCodeAction } from "@/lib/api/actions";
import { consumeCodeVerifier } from "@/lib/pkce";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * OAuth Callback Client Component — PKCE (Authorization Code) Flow
 *
 * After the user completes the OAuth consent flow (e.g. Google),
 * Supabase redirects back with an authorization **code** in the
 * query string (not a token in the hash fragment):
 *
 *   /auth/callback?code=...
 *
 * This component:
 * 1. Reads the `code` from the URL query params
 * 2. Retrieves the `code_verifier` from sessionStorage (stored before redirect)
 * 3. Sends both to our backend (POST /auth/oauth/callback) for PKCE exchange
 * 4. Stores the session in Zustand (persisted to localStorage)
 * 5. Redirects to the home page
 */
export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  // Prevent double execution in React StrictMode
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function handleCallback() {
      try {
        // ─── Check for error in query params first ──────────────────
        const qpError =
          searchParams.get("error_description") || searchParams.get("error");
        if (qpError) {
          throw new Error(qpError);
        }

        // ─── Get the authorization code from query params ───────────
        const code = searchParams.get("code");
        if (!code) {
          throw new Error(
            "No authorization code found in URL. Make sure the OAuth redirect is configured correctly in Supabase."
          );
        }

        // ─── Retrieve the PKCE code_verifier from sessionStorage ────
        const codeVerifier = consumeCodeVerifier();
        if (!codeVerifier) {
          throw new Error(
            "PKCE code verifier not found. This can happen if you opened this page directly, " +
            "cleared browser storage, or used a different browser/tab. Please try signing in again."
          );
        }

        // ─── Exchange code + code_verifier for app JWTs ─────────────
        const result = await exchangeOAuthCodeAction(code, codeVerifier);

        if (!result.ok || !result.tokens || !result.user) {
          throw new Error(result.messages || "Failed to authenticate with OAuth");
        }

        // Store the session in Zustand (persisted to localStorage)
        setSession(result.tokens, result.user);
        setStatus("success");
        toast.success(`Welcome, ${result.user.full_name}!`);

        // Redirect to home page (short delay so toast is visible)
        setTimeout(() => {
          router.replace("/");
        }, 800);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Authentication failed";
        console.error("[OAuth Callback] Error:", message);
        setErrorMsg(message);
        setStatus("error");
        toast.error(message);

        // Redirect to sign-in after a delay
        setTimeout(() => {
          router.replace("/signin");
        }, 3000);
      }
    }

    handleCallback();
  }, [router, setSession, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="text-center space-y-6 max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Completing sign in...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your account.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Signed in successfully!</h1>
            <p className="text-muted-foreground">
              Redirecting you to the store...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Sign in failed</h1>
            <p className="text-muted-foreground">
              {errorMsg || "Something went wrong. Please try again."}
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to sign in page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
