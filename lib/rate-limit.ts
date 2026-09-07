/**
 * In-Memory Sliding Window Rate Limiter for ClearMed API Endpoints
 * 
 * Protects public API endpoints from brute force and scraping.
 * Configured limits:
 * - Public API endpoints: 100 requests per minute per IP address
 * - Auth endpoints (login/register/mfa): 10 requests per minute per IP address
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale IP entries older than 5 minutes periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(ip);
    }
  }
}, 300000);

export interface RateLimitOptions {
  windowMs?: number; // Default 60000 (1 minute)
  maxRequests?: number; // Default 100
  keyPrefix?: string;
}

export function checkRateLimit(
  ip: string,
  options: RateLimitOptions = {}
): { isAllowed: boolean; limit: number; remaining: number; resetTimeMs: number } {
  const windowMs = options.windowMs ?? 60000;
  const maxRequests = options.maxRequests ?? 100;
  const prefix = options.keyPrefix ?? "gen";
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetTimeMs = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      isAllowed: false,
      limit: maxRequests,
      remaining: 0,
      resetTimeMs: Math.max(1, resetTimeMs),
    };
  }

  record.timestamps.push(now);
  return {
    isAllowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetTimeMs: 60,
  };
}

/**
 * Extracts Client IP address from request headers.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Creates a rate limit error response with standard rate limit headers.
 */
export function createRateLimitResponse(limit: number, resetTimeMs: number): NextResponse {
  return NextResponse.json(
    {
      message: "Too many requests. Rate limit exceeded. Please try again later.",
      retryAfterSeconds: resetTimeMs,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetTimeMs),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
