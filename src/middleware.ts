import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (token && pathname === "/login") {
      const role = token.role as string;
      if (role === "student") return NextResponse.redirect(new URL("/student/dashboard", request.url));
      if (role === "professor") return NextResponse.redirect(new URL("/professor/dashboard", request.url));
      if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Require auth for all other routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = token.role as string;

  // Role-based route protection
  if (pathname.startsWith("/student") && role !== "student") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/professor") && role !== "professor") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // API route protection
  if (pathname.startsWith("/api/student") && role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (pathname.startsWith("/api/professor") && role !== "professor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/professor/:path*",
    "/admin/:path*",
    "/api/student/:path*",
    "/api/professor/:path*",
    "/login",
  ],
};
