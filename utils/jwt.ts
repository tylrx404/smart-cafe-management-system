/**
 * JWT Token Utilities
 * 
 * This module handles JWT token management for the frontend:
 * - Storing tokens in localStorage
 * - Retrieving tokens for API requests
 * - Validating token expiry
 * - Clearing tokens on logout
 */

const JWT_TOKEN_KEY = 'jwt_token';

/**
 * Store JWT token in localStorage
 * Called after successful login
 */
export function setJWTToken(token: string): void {
  localStorage.setItem(JWT_TOKEN_KEY, token);
}

/**
 * Retrieve JWT token from localStorage
 * Used when making API requests
 */
export function getJWTToken(): string | null {
  return localStorage.getItem(JWT_TOKEN_KEY);
}

/**
 * Clear JWT token from localStorage
 * Called on logout
 */
export function clearJWTToken(): void {
  localStorage.removeItem(JWT_TOKEN_KEY);
}

/**
 * Get Authorization header for API requests
 * Returns header in format: { Authorization: "Bearer <token>" }
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getJWTToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Decode JWT token (client-side only, does NOT verify signature)
 * WARNING: This is for reading payload only, actual verification happens on backend
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * Returns true if expired, false if still valid
 */
export function isJWTExpired(token?: string): boolean {
  const tokenToCheck = token || getJWTToken();
  if (!tokenToCheck) return true;

  const decoded = decodeJWT(tokenToCheck);
  if (!decoded || !decoded.exp) return true;

  // exp is in seconds, convert to milliseconds
  const expiryTime = decoded.exp * 1000;
  return Date.now() > expiryTime;
}
