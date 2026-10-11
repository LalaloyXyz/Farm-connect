import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/products",
    "/farms",
    "/cart",
    "/_next",
    "/images",
    "/favicon",
    "/manifest",
    "/sw.js",
    "/icons",
    "/api/auth",
    "/api/auth/me",
    "/api/products",
    "/api/farms",
    "/api/categories",
    "/api/search",
  ];

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Check auth token from cookie
  const token = req.cookies.get("authjs.session-token")?.value ||
                req.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|manifest.json|sw.js).*)",
  ],
};
