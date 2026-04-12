/**
 * middleware.ts  (Next.js Edge Middleware)
 * ─────────────────────────────────────────
 * Protects all routes under /dashboard, /analytics, /civic,
 * /daily-input, /trends, /heatmap, /tackle-pollution, /admin.
 *
 * Reads the Bearer token from:
 *   1. The "access_token" HttpOnly cookie (set by the backend on login)
 *   2. The "Authorization" request header (for programmatic clients)
 *
 * If neither is present the request is redirected to /?auth=required
 * which the login page uses to display a friendly message.
 */

import { NextRequest, NextResponse } from "next/server"

/** Routes that require authentication. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/analytics",
  "/civic",
  "/daily-input",
  "/trends",
  "/heatmap",
  "/tackle-pollution",
  "/admin",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (!isProtected) return NextResponse.next()

  // 1. Check HttpOnly cookie set by FastAPI
  const cookieToken = request.cookies.get("access_token")?.value

  // 2. Check Authorization header (Bearer <token>)
  const authHeader = request.headers.get("authorization") ?? ""
  const headerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null

  const hasToken = !!(cookieToken || headerToken)

  if (!hasToken) {
    const loginUrl = new URL("/", request.url)
    loginUrl.searchParams.set("auth", "required")
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analytics/:path*",
    "/civic/:path*",
    "/daily-input/:path*",
    "/trends/:path*",
    "/heatmap/:path*",
    "/tackle-pollution/:path*",
    "/admin/:path*",
  ],
}
