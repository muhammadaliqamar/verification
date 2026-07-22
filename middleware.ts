import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory sliding window rate limiter for security against brute-force token enumeration
const ipTracker = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 40; // Max 40 verification lookups per minute per IP

export function middleware(request: NextRequest) {
  // Extract client IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const now = Date.now();

  // Periodic cleanup of stale IPs to prevent memory growth
  if (ipTracker.size > 5000) {
    for (const [key, val] of ipTracker.entries()) {
      if (now > val.resetTime) {
        ipTracker.delete(key);
      }
    }
  }

  const record = ipTracker.get(ip);

  if (!record || now > record.resetTime) {
    ipTracker.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    record.count++;
    if (record.count > MAX_REQUESTS) {
      return new NextResponse(
        "Rate limit exceeded. Please wait a minute before making more verification checks.",
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "Content-Type": "text/plain",
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Exclude static files, Next.js assets, and favicons from rate limiting
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
