import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AuthCallbackClient from "./AuthCallbackClient";

/**
 * OAuth callback page — wraps the client component in Suspense
 * because it uses useSearchParams().
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Completing sign in...</h1>
          </div>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
