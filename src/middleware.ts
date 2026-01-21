/**
 * Next.js Middleware
 * Handles authentication redirects and API protection
 */

import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes (no auth required)
  const publicRoutes = ["/", "/auth/signin", "/auth/error"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // API routes that don't require auth (e.g., NextAuth endpoints)
  const publicApiRoutes = ["/api/auth"];
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  // Protected API routes (require authentication)
  const isProtectedApiRoute = pathname.startsWith("/api") && !isPublicApiRoute;

  // Static routes
  const isStaticRoute = pathname.startsWith("/_next") || pathname.includes(".");

  // Allow public and static routes
  if (isPublicRoute || isPublicApiRoute || isStaticRoute) {
    return;
  }

  // Protect API routes - return 401 for unauthenticated requests
  if (isProtectedApiRoute && !isLoggedIn) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Redirect unauthenticated users to signin for non-API routes
  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
