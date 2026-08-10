/**
 * Shared NextAuth settings used by the API route and middleware.
 * Keeps JWT verification aligned when env vars are missing in local dev.
 */
export const authSecret =
  process.env.NEXTAUTH_SECRET ??
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "clearmed-development-secret"
    : undefined);
