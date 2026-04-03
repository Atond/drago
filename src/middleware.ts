import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;

  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/muldos", req.url));
  }

  // Redirect non-logged-in users to login for protected routes
  if (!isLoggedIn && !isAuthPage && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
