import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight, fail-safe middleware for Vercel Edge Runtime
export function middleware(request: NextRequest) {
  try {
    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware Error]:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
