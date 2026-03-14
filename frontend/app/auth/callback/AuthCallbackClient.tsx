"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { exchangeOAuthTokenAction } from "@/lib/api/actions";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * OAuth Callback Client Component
 *
 * After the user completes the OAuth consent flow (e.g. Google),
 * Supabase redirects back with tokens in the URL **hash fragment**
 * (implicit grant flow):
 *
 *   /auth/callback#access_token=...&refresh_token=...&token_type=bearer&...
 *
 * This component:
 * 1. Parses the Supabase access_token from the hash fragment
 * 2. Sends it to our backend (POST /auth/oauth/callback) to exchange for app JWTs
 * 3. Stores the session in Zustand (persisted to localStorage)
 * 4. Redirects to the home page
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

        // ─── Parse the hash fragment ────────────────────────────────
        const hash = window.location.hash.substring(1); // remove leading '#'

        if (!hash) {
          // Fallback: check query params for access_token (rare)
          const qpAccessToken = searchParams.get("access_token");
          if (qpAccessToken) {
            await exchangeAndStore(qpAccessToken);
            return;
          }
          throw new Error(
            "No authentication data found in URL. Make sure the OAuth redirect is configured correctly in Supabase."
          );
        }

        const params = new URLSearchParams(hash);
        const supabaseAccessToken = params.get("access_token");

        if (!supabaseAccessToken) {
          // Check for error in hash params
          const errorDescription =
            params.get("error_description") || params.get("error");
          throw new Error(
            errorDescription || "No access token found in OAuth response"
          );
        }

        await exchangeAndStore(supabaseAccessToken);
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

    async function exchangeAndStore(supabaseAccessToken: string) {
      // Exchange Supabase token for app JWTs via our backend
      const result = await exchangeOAuthTokenAction(supabaseAccessToken);

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
