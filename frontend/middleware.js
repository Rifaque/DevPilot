// /middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Public paths that should be accessible without auth
  const publicPaths = [
    "/login",
    "/api/auth",    // next-auth endpoints
    "/api/health",
    "/_next",
    "/static",
    "/favicon.ico",
  ];

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Try to get the next-auth token (works with CredentialsProvider + JWT)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // Redirect to login, preserving original path
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists → allow access
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    "/",                // protect homepage
    "/dashboard/:path*",
    "/projects/:path*",
    "/project/:path*",  // adjust to your routes
    // "/api/:path*",   // optional: protect API routes if needed
  ],
};
