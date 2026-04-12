/**
 * lib/auth.ts
 * ────────────
 * Token helpers for EcoPulse frontend.
 * Tokens are stored in localStorage under "ecopulse_token".
 * User data is cached under "ecopulse_user".
 */

const TOKEN_KEY = "ecopulse_token"
const USER_KEY = "ecopulse_user"

/** Save JWT access token to localStorage */
export function saveToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

/** Retrieve JWT access token from localStorage (null if not found) */
export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Remove JWT token (call on logout) */
export function removeToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/** Returns true if a token exists (does NOT validate expiry) */
export function isAuthenticated(): boolean {
  return Boolean(getToken())
}

/** Cache a user object locally for quick UI reads */
export function saveUser(user: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** Read cached user object (null if not found) */
export function getCachedUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
