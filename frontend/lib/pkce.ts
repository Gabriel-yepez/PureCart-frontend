// ============================================================================
// PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
// ============================================================================
// Uses the Web Crypto API to generate a cryptographically secure
// code_verifier and its SHA-256 code_challenge (base64url-encoded).
//
// The code_verifier is stored in sessionStorage so it survives the
// redirect to the OAuth provider and back. It is consumed (deleted)
// once the callback exchanges it for tokens.
// ============================================================================

const STORAGE_KEY = "pkce_code_verifier";

/**
 * Generate a random string of the given length using characters from
 * the unreserved set defined in RFC 7636 §4.1:
 *   [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 */
function generateRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => charset[v % charset.length]).join("");
}

/**
 * Compute the SHA-256 hash of a string and return it as base64url.
 */
async function sha256Base64url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Convert ArrayBuffer → base64
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

  // base64 → base64url (RFC 4648 §5)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a fresh PKCE code_verifier / code_challenge pair.
 *
 * - `code_verifier` is a 64-character random string (stored in sessionStorage).
 * - `code_challenge` is the base64url-encoded SHA-256 hash of the verifier.
 *
 * @returns `{ codeVerifier, codeChallenge }`
 */
export async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await sha256Base64url(codeVerifier);

  // Persist the verifier so it's available after the OAuth redirect
  sessionStorage.setItem(STORAGE_KEY, codeVerifier);

  return { codeVerifier, codeChallenge };
}

/**
 * Retrieve the previously stored code_verifier and remove it from storage.
 * Returns `null` if no verifier is found (e.g. storage was cleared).
 */
export function consumeCodeVerifier(): string | null {
  const verifier = sessionStorage.getItem(STORAGE_KEY);
  if (verifier) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return verifier;
}
